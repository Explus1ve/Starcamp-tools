# NOTES — read before changing this code

Push-to-talk dictation into the focused window, tuned for dictating prompts into the Claude Code CLI. Windows only, local only.

Run it with `uv run voicetype.py` from this folder. No build, no tests. `Ctrl+C` to stop.

Python 3.11 via `uv`, `faster-whisper` (CTranslate2, CUDA) for the speech model, `sounddevice` for capture, `pynput` for the global hotkey and the paste keystroke. The status ring adds **no dependencies** — `tkinter` and `ctypes` are standard library, and numpy was already there for the audio. Keep it that way: it is decoration on a tool that has to start reliably.

## The invariant

**The tool never sends Enter.** It pastes and stops. It dictates into an agent that edits files and runs commands, so submitting is always a human decision. Anything that auto-submits is a bug, not a feature.

## Four things that look wrong and are not

Each of these was a real bug. If you clean them up, you reintroduce it.

1. **`_DLL_DIRS` is a list that is never read.** It must exist. `os.add_dll_directory()` returns a handle that un-registers the directory when it is garbage-collected, so the handles are parked there for the life of the process. Delete it and you get `RuntimeError: Library cublas64_12.dll is not found` at model load.

2. **Corrections run in ONE regex pass** (the `Corrections` class), never a loop of `sub()` calls, and every correct form is also mapped to itself. Chained passes let an earlier replacement be re-matched by a shorter later rule, so a phrase like "Acme Data AI" comes out as "Acme Data AI AI". If you touch this, test a phrase containing a shorter rule nested inside a longer one.

3. **`run()` hands the main thread to `overlay.run()`** — Tk's event loop — never `listener.join()`. A bare join on Windows blocks the main thread so completely that Ctrl+C is never delivered, leaving the app unquittable from the keyboard. What actually fixes it is anything that keeps executing Python bytecode; the overlay's repaint tick does that. If the ring is ever removed, a `while ...: time.sleep(0.2)` loop has to go back — `_NoOverlay` already carries one for exactly this reason.

4. **Nothing outside the main thread touches Tk.** `Overlay.set()` and `.level()` only put to a queue and set a float; the repaint tick drains them. Calling a Tk method from the hotkey listener or the transcription thread hangs the GUI — which is why `handle()` signals `"idle"` through `set()` rather than redrawing anything itself.

`_load_model()` also tries CUDA, **proves** it with a real transcribe, and falls back to the processor if that throws. `get_cuda_device_count()` alone is not enough — it reports a device even when the CUDA libraries cannot load. If you end up on the processor, the tool is working-but-slow, not broken.

**The tool never contacts Hugging Face.** `_model_path()` loads the model from disk only (`local_files_only=True`, or a folder path in `VOICETYPE_MODEL`) and exits with the manual download command if it is missing. Left to itself, faster-whisper checks Hugging Face for a newer model on every start, so a dictation tool would phone out each time you open it and could swap models without you asking. Model updates are a hand step.

**Phantom lines are dropped, never pasted.** Whisper learned from subtitled video, so near-silence can come out as "Closed Captioning by …" or "Thanks for watching". `is_phantom()` drops a segment that is wholly such a credit, or that Whisper itself scores as no speech and low confidence. Dropped text is printed to the terminal so you can see it happened.

## The files

| File | What it is |
|---|---|
| `voicetype.py` | The tool. Hotkey, capture, transcription, corrections, paste. |
| `overlay.py` | The ring's states, position memory and drag. `run()` owns the main thread. |
| `aurora.py` | The ring bitmaps, in numpy. Change `COLOURS` to recolour it. |
| `layered.py` | Per-pixel alpha through Win32 `UpdateLayeredWindow`. Tk can only key out one flat colour, which cannot express a glow. |
| `make_icon.py` | Regenerates `voicetype.ico`. The icon is a binary — edit the script, not the icon. |

## Files the tool creates, that are not here

| File | What it is |
|---|---|
| `vocab.txt` | Your own corrections and bias terms. Read at startup only, so restart after editing. Start from one of the files in `../vocab/`. |
| `history.jsonl` | A local transcript log, capped at the newest 500 entries. Mainly to recover a long dictation lost before sending, and to see what the tool actually mishears. Never commit it — it is a record of everything you have said. |
| `overlay-position.json` | Where the ring was last dragged. Written on drop. |

All three are already listed in this folder's `.gitignore`, so they stay out if you put your copy under version control.
