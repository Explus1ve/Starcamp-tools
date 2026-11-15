"""voicetype — hold a key, speak, release; the text lands in the focused window.

Built for dictating prompts into the Claude Code CLI. It never presses Enter:
the text goes into an agent that edits files and runs commands, so submitting
is always a human decision.
"""

from __future__ import annotations

import json
import os
import re
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
VOCAB_PATH = HERE / "vocab.txt"
HISTORY_PATH = HERE / "history.jsonl"

MODEL_NAME = os.environ.get("VOICETYPE_MODEL", "large-v3-turbo")
SAMPLE_RATE = 16000
MIN_SECONDS = 0.35          # shorter than this is a stray tap, not speech
HISTORY_LIMIT = 500         # keep the newest N dictations; the log never grows past this
PASTE_SETTLE = 0.05         # let the clipboard land before Ctrl+V
PASTE_RESTORE = 0.40        # let the paste happen before restoring the clipboard


# Held for the life of the process on purpose: os.add_dll_directory() removes the
# directory again as soon as its handle is garbage-collected.
_DLL_DIRS: list[object] = []


def _register_cuda_dlls() -> None:
    """CTranslate2 needs cuBLAS/cuDNN DLLs on PATH; the pip packages ship them."""
    if not hasattr(os, "add_dll_directory"):
        return
    try:
        import nvidia
    except ImportError:
        return
    for root in map(Path, getattr(nvidia, "__path__", [])):
        for sub in ("cublas/bin", "cudnn/bin"):
            candidate = root.joinpath(*sub.split("/"))
            if candidate.is_dir():
                _DLL_DIRS.append(os.add_dll_directory(str(candidate)))
                os.environ["PATH"] = f"{candidate}{os.pathsep}{os.environ['PATH']}"


_register_cuda_dlls()

import numpy as np                                    # noqa: E402
import pyperclip                                      # noqa: E402
import sounddevice as sd                              # noqa: E402
from faster_whisper import WhisperModel               # noqa: E402
from faster_whisper.utils import download_model       # noqa: E402
from pynput import keyboard                           # noqa: E402

from overlay import Overlay                           # noqa: E402

HOTKEY = keyboard.Key.ctrl_r


class _NoOverlay:
    """Stand-in when the ring won't start. Dictation must never depend on decoration."""

    def __init__(self) -> None:
        self._running = True

    def set(self, state: str) -> None:
        pass

    def level(self, value: float) -> None:
        pass

    def stop(self) -> None:
        self._running = False

    def run(self) -> None:
        # The old poll loop, kept for this path: sleep() is interruptible on
        # Windows where a bare join() is not. See the note in VoiceType.run().
        while self._running:
            time.sleep(0.2)


# --- vocabulary ---------------------------------------------------------------

def _normalise(phrase: str) -> str:
    return " ".join(phrase.split()).lower()


class Corrections:
    """One regex over every phrase, applied in a single pass.

    Single pass is the whole point: chaining one sub() per rule lets an earlier
    replacement be re-matched by a later rule, so a phrase like "Acme Data AI"
    comes out as "Acme Data AI AI". Alternatives are ordered longest-first so the
    fullest phrase wins at any given position.
    """

    def __init__(self, mapping: dict[str, str]) -> None:
        self.mapping = mapping
        self.pattern: re.Pattern[str] | None = None
        if mapping:
            alternatives = "|".join(
                r"\s+".join(re.escape(word) for word in phrase.split())
                for phrase in sorted(mapping, key=len, reverse=True)
            )
            self.pattern = re.compile(rf"(?<!\w)({alternatives})(?!\w)", re.IGNORECASE)

    def __len__(self) -> int:
        return len(self.mapping)

    def apply(self, text: str) -> str:
        if self.pattern is None:
            return text
        return self.pattern.sub(lambda match: self.mapping[_normalise(match.group(0))], text)


def load_vocab(path: Path) -> tuple[Corrections, list[str]]:
    mapping: dict[str, str] = {}
    terms: list[str] = []
    if not path.exists():
        return Corrections(mapping), terms

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        if "->" in line:
            heard, written = (part.strip() for part in line.split("->", 1))
            if not heard or not written:
                continue
            mapping[_normalise(heard)] = written
            # Also map the correct form to itself, so a phrase Whisper already got
            # right can't be partially re-matched by a shorter rule.
            mapping.setdefault(_normalise(written), written)
            terms.append(written)
        else:
            terms.append(line)

    return Corrections(mapping), list(dict.fromkeys(terms))


def apply_corrections(text: str, corrections: Corrections) -> str:
    return corrections.apply(text)


def bias_prompt(terms: list[str]) -> str:
    return "Vocabulary: " + ", ".join(terms) + "." if terms else ""


# --- phantoms -----------------------------------------------------------------

# Whisper learned from subtitled video, so near-silence can come out as a subtitle
# credit ("Closed Captioning by www.patreon.com.au", seen 2026-11-03 from a 1.4s
# accidental hold). Matched against a whole segment, so a real sentence that merely
# contains "captions by" is kept.
_PHANTOM = re.compile(
    r"\W*(?:"
    r"(?:closed captioning|captions?|captioned|subtitles?|subtitled|transcription) by\b.*"
    r"|.*\bamara\.org\b.*"
    r"|(?:thanks|thank you) for watching\W*"
    r")",
    re.IGNORECASE | re.DOTALL,
)
# Whisper's own silence test: it thinks there was no speech AND it is unsure of the words.
NO_SPEECH_PROB = 0.6
LOW_LOGPROB = -1.0


def is_phantom(segment) -> bool:
    if _PHANTOM.fullmatch(segment.text.strip()):
        return True
    return segment.no_speech_prob > NO_SPEECH_PROB and segment.avg_logprob < LOW_LOGPROB


# --- audio --------------------------------------------------------------------

class Recorder:
    def __init__(self, on_level=None) -> None:
        self._frames: list[np.ndarray] = []
        self._stream: sd.InputStream | None = None
        self._on_level = on_level

    def start(self) -> None:
        self._frames = []
        self._stream = sd.InputStream(
            samplerate=SAMPLE_RATE, channels=1, dtype="float32", callback=self._on_audio
        )
        self._stream.start()

    def _on_audio(self, indata, _frames, _time_info, _status) -> None:
        self._frames.append(indata.copy())
        if self._on_level is not None:
            # Loudness only — this drives the ring's spin rate, nothing else.
            self._on_level(min(1.0, float(np.sqrt(np.mean(indata ** 2))) * 12))

    def stop(self) -> np.ndarray | None:
        stream, self._stream = self._stream, None
        if stream is None:
            return None
        stream.stop()
        stream.close()
        if not self._frames:
            return None
        return np.concatenate(self._frames, axis=0).flatten()


# --- injection ----------------------------------------------------------------

def paste(text: str, controller: keyboard.Controller) -> None:
    """Clipboard + Ctrl+V — exact and instant, unlike simulated typing."""
    try:
        previous = pyperclip.paste()
    except Exception:
        previous = ""

    pyperclip.copy(text)
    time.sleep(PASTE_SETTLE)
    with controller.pressed(keyboard.Key.ctrl):
        controller.press("v")
        controller.release("v")
    time.sleep(PASTE_RESTORE)

    if previous:
        try:
            pyperclip.copy(previous)
        except Exception:
            pass


# --- the loop -----------------------------------------------------------------

class VoiceType:
    def __init__(self) -> None:
        self.corrections, self.terms = load_vocab(VOCAB_PATH)
        self.prompt = bias_prompt(self.terms)
        try:
            self.overlay = Overlay()
        except Exception as exc:
            print(f"  ! status ring unavailable, running without it: {exc}", flush=True)
            self.overlay = _NoOverlay()
        self.recorder = Recorder(on_level=self.overlay.level)
        self.controller = keyboard.Controller()
        self.holding = False
        self.work_lock = threading.Lock()

        self.model = self._load_model()

    def _load_model(self) -> WhisperModel:
        """Try the GPU, prove it works, and drop to CPU rather than dying if it doesn't."""
        model_path = self._model_path()
        for device, compute in self._candidates():
            print(f"  loading {MODEL_NAME} on {device} ({compute}) ...", flush=True)
            started = time.perf_counter()
            try:
                model = WhisperModel(model_path, device=device, compute_type=compute)
                # Also warms the kernels, so the first real utterance isn't the slow one.
                list(model.transcribe(np.zeros(SAMPLE_RATE, dtype=np.float32), language="en")[0])
            except Exception as exc:
                print(f"  ! {device} unusable: {exc}", flush=True)
                continue
            print(f"  ready in {time.perf_counter() - started:.1f}s on {device}"
                  f" - {len(self.corrections)} corrections,"
                  f" {len(self.terms)} bias terms\n", flush=True)
            return model
        raise SystemExit("  could not load the model on any device.")

    @staticmethod
    def _model_path() -> str:
        """Use the copy on disk only. The app never goes online; updates are fetched by hand."""
        if os.path.isdir(MODEL_NAME):
            return MODEL_NAME
        try:
            return download_model(MODEL_NAME, local_files_only=True)
        except Exception:
            raise SystemExit(
                f"  {MODEL_NAME} is not on disk. Download it by hand (this goes online):\n"
                f"  uv run python -c \"from faster_whisper.utils import download_model;"
                f" print(download_model('{MODEL_NAME}'))\"")

    @staticmethod
    def _candidates() -> list[tuple[str, str]]:
        try:
            import ctranslate2

            if ctranslate2.get_cuda_device_count() > 0:
                return [("cuda", "float16"), ("cpu", "int8")]
        except Exception:
            pass
        return [("cpu", "int8")]

    def on_press(self, key) -> None:
        if key != HOTKEY or self.holding:
            return
        self.holding = True
        self.overlay.set("recording")
        self.recorder.start()

    def on_release(self, key) -> None:
        if key != HOTKEY or not self.holding:
            return
        self.holding = False
        self.overlay.set("thinking")
        audio = self.recorder.stop()
        threading.Thread(target=self.handle, args=(audio,), daemon=True).start()

    def handle(self, audio: np.ndarray | None) -> None:
        try:
            self._transcribe(audio)
        finally:
            # Every path settles the ring: stray tap, nothing heard, or text pasted.
            self.overlay.set("idle")

    def _transcribe(self, audio: np.ndarray | None) -> None:
        if audio is None or len(audio) / SAMPLE_RATE < MIN_SECONDS:
            return

        with self.work_lock:
            started = time.perf_counter()
            segments, _info = self.model.transcribe(
                audio,
                language="en",
                beam_size=5,
                vad_filter=True,
                condition_on_previous_text=False,
                initial_prompt=self.prompt or None,
            )
            kept, dropped = [], []
            for segment in segments:
                (dropped if is_phantom(segment) else kept).append(segment.text.strip())
            if dropped:
                print(f"  (dropped, not speech: {' '.join(dropped)})", flush=True)
            raw = " ".join(kept).strip()
            if not raw:
                print("  (nothing heard)", flush=True)
                return

            final = apply_corrections(raw, self.corrections)
            latency = time.perf_counter() - started
            spoken = len(audio) / SAMPLE_RATE

            paste(final, self.controller)
            print(f"  [{spoken:.1f}s spoken, {latency:.1f}s to text] {final}", flush=True)
            self.log(spoken, latency, raw, final)

    @staticmethod
    def log(spoken: float, latency: float, raw: str, final: str) -> None:
        entry = {
            "at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "spoken_seconds": round(spoken, 2),
            "latency_seconds": round(latency, 2),
            "raw": raw,
            "final": final,
        }
        try:
            with HISTORY_PATH.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
            # Rolling window: newest at the bottom, oldest dropped off the top.
            lines = HISTORY_PATH.read_text(encoding="utf-8").splitlines(keepends=True)
            if len(lines) > HISTORY_LIMIT:
                HISTORY_PATH.write_text("".join(lines[-HISTORY_LIMIT:]), encoding="utf-8")
        except OSError as exc:
            # Never let a locked or unwritable log break a dictation - the text is
            # already pasted by this point, which is the part that matters.
            print(f"  ! history not written: {exc}", flush=True)

    def run(self) -> None:
        print("  hold RIGHT CTRL, speak, release.  Ctrl+C here to quit.")
        print("  it never presses Enter - read it, then send it yourself.\n", flush=True)
        listener = keyboard.Listener(on_press=self.on_press, on_release=self.on_release)
        listener.start()
        try:
            # The overlay's Tk event loop owns the main thread from here. Its steady
            # repaint tick preserves what the old poll loop existed for: a bare
            # join() on Windows blocks the main thread so hard that Ctrl+C is never
            # delivered. Anything that keeps running Python bytecode fixes that.
            self.overlay.run()
        except KeyboardInterrupt:
            pass
        finally:
            listener.stop()
            self.recorder.stop()


def main() -> int:
    print("\n  voicetype")
    try:
        VoiceType().run()
    except KeyboardInterrupt:
        print("\n  stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
