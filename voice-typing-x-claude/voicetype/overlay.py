"""The voicetype status ring — a small aurora mark that floats on the desktop.

  wake        one ease-out revolution on arrival
  idle        the ring at rest, full colour, still
  recording   spins; faster the louder you speak
  thinking    1.3s per revolution

Nothing resizes, ever — only rotation changes.

Threading: run() must own the main thread, because that is where Tk's event loop
has to live. Every other thread talks to it through set() and level(), which only
touch a queue and a float — never Tk itself, since cross-thread Tk calls hang the
GUI. The repaint tick is also what keeps Ctrl+C deliverable on Windows.
"""

from __future__ import annotations

import json
import queue
import tkinter as tk
from pathlib import Path

from aurora import ring_rgba_frames
from layered import LayeredSurface, virtual_screen

POSITION_PATH = Path(__file__).resolve().parent / "overlay-position.json"

RING = 40                # ring diameter; the canvas around it is larger, for the glow
FRAMES = 60              # rotation steps; 360/FRAMES degrees apart
GLOW = 0.35              # 0 = flat ring; above ~0.6 it fogs on light backgrounds
TICK = 16                # ms between frames (16 ~ 60fps, 33 ~ 30fps)

SPIN_THINKING = 1 / 1.3          # revolutions per second — the website's vai-spin
SPIN_REC_BASE = 0.22             # slow drift when you are silent
SPIN_REC_GAIN = 1.7              # ...and this much faster at full voice

MARGIN_RIGHT = 15                # where it parks the FIRST time, from the screen edges;
MARGIN_BOTTOM = 45               # after that, wherever you last dragged it wins


class Overlay:
    def __init__(self, ring: int = RING, glow: float = GLOW) -> None:
        self._events: queue.Queue[str] = queue.Queue()
        self._level = 0.0
        self.state = "wake"
        self.pos = 0.0               # rotation, in frames, as a float
        self._wake_t = 0.0

        self.frames, self.size = ring_rgba_frames(ring, FRAMES, glow=glow)

        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)
        x, y = self._start_position()
        self.root.geometry(f"{self.size}x{self.size}+{x}+{y}")

        self.surface = LayeredSurface(self.root, self.size)
        self._shown = -1

        self.root.bind("<Button-1>", self._grab)
        self.root.bind("<B1-Motion>", self._drag)
        self.root.bind("<ButtonRelease-1>", self._save_position)

    # --- where it parks ---

    def _start_position(self) -> tuple[int, int]:
        """Last dragged position if it is still on a monitor, else the default corner."""
        vx, vy, vw, vh = virtual_screen()
        try:
            saved = json.loads(POSITION_PATH.read_text(encoding="utf-8"))
            x, y = int(saved["x"]), int(saved["y"])
            if vx <= x <= vx + vw - self.size and vy <= y <= vy + vh - self.size:
                return x, y
        except (OSError, ValueError, KeyError, TypeError):
            pass
        w, h = self.root.winfo_screenwidth(), self.root.winfo_screenheight()
        return w - self.size - MARGIN_RIGHT, h - self.size - MARGIN_BOTTOM

    def _save_position(self, _event=None) -> None:
        try:
            POSITION_PATH.write_text(
                json.dumps({"x": self.root.winfo_x(), "y": self.root.winfo_y()}),
                encoding="utf-8")
        except OSError:
            pass          # a read-only folder must not break dictation

    # --- safe from any thread ---

    def set(self, state: str) -> None:
        """'recording' | 'thinking' | 'idle'"""
        self._events.put(state)

    def level(self, value: float) -> None:
        """0.0–1.0 microphone loudness; drives the recording spin rate."""
        self._level = value

    def stop(self) -> None:
        self._events.put("__quit__")

    # --- dragging ---

    def _grab(self, e) -> None:
        self._ox = e.x_root - self.root.winfo_x()
        self._oy = e.y_root - self.root.winfo_y()

    def _drag(self, e) -> None:
        self.root.geometry(f"+{e.x_root - self._ox}+{e.y_root - self._oy}")

    # --- the loop ---

    def _tick(self) -> None:
        dt = TICK / 1000
        while not self._events.empty():
            nxt = self._events.get()
            if nxt == "__quit__":
                self.root.quit()
                return
            self.state = nxt

        if self.state == "wake":
            self._wake_t = min(1.0, self._wake_t + dt / 1.3)
            self.pos = (1 - (1 - self._wake_t) ** 3) * FRAMES
            if self._wake_t >= 1.0:
                self.state = "idle"
        elif self.state == "recording":
            self.pos += (SPIN_REC_BASE + SPIN_REC_GAIN * self._level) * FRAMES * dt
        elif self.state == "thinking":
            self.pos += SPIN_THINKING * FRAMES * dt

        frame = int(self.pos) % FRAMES
        if frame != self._shown:          # idle repaints nothing at all
            self.surface.show(self.frames[frame])
            self._shown = frame

        self.root.after(TICK, self._tick)

    def run(self) -> None:
        """Blocks. Must be called on the main thread."""
        self._tick()
        self.root.mainloop()
