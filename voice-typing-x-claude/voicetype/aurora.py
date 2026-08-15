"""The aurora status ring, rendered with numpy for a tkinter overlay.

A conic rainbow gradient masked into a donut. The values were lifted from a
web asset and are kept here as the source of truth:
  donut     mask radial-gradient(closest-side, transparent 56%, #000 58%)
  spin      1.3s linear infinite

Swap the colours in COLOURS below to make the ring your own.

Frames are pre-rendered once at startup, so animating costs nothing at runtime:
rotating a conic gradient is just a phase offset, so every frame is exact rather
than a resampled copy of frame zero.
"""

from __future__ import annotations

import numpy as np

# --aurora-conic, dark theme (globals.css:131). Light theme is at :265.
STOPS = ["#38BDF8", "#7DD3FC", "#A78BFA", "#4ADE80", "#38BDF8"]

INNER = 0.58        # the mask's solid edge; inside this is the hole
OUTER = 0.98        # a hair inside the bitmap so the ring never clips
SS = 4              # supersample factor - this is where the smooth edges come from


def _rgb(hex_colour: str) -> np.ndarray:
    h = hex_colour.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def _conic(t: np.ndarray) -> np.ndarray:
    """t in [0,1) around the circle -> colour, interpolated like CSS does (in sRGB)."""
    stops = np.array([_rgb(c) for c in STOPS])
    pos = np.linspace(0.0, 1.0, len(stops))
    idx = np.clip(np.searchsorted(pos, t, side="right") - 1, 0, len(stops) - 2)
    span = pos[idx + 1] - pos[idx]
    f = ((t - pos[idx]) / span)[..., None]
    return stops[idx] * (1 - f) + stops[idx + 1] * f


# --- the frames ----------------------------------------------------------------
# Tk's own -transparentcolor keys out one exact colour, which caps quality at a
# hard edge and forbids a glow (a glow is partial alpha by definition). Windows'
# UpdateLayeredWindow takes a real alpha channel instead, so these frames carry
# one - and the halo can be genuinely soft.


def _box1d(a: np.ndarray, r: int, axis: int) -> np.ndarray:
    a = np.moveaxis(a, axis, 0)
    pad = np.zeros((r + 1,) + a.shape[1:])
    ext = np.concatenate([pad, a, np.zeros((r,) + a.shape[1:])], axis=0)
    cs = np.cumsum(ext, axis=0)
    return np.moveaxis((cs[2 * r + 1:] - cs[:-(2 * r + 1)]) / (2 * r + 1), 0, axis)


def _blur(a: np.ndarray, r: int) -> np.ndarray:
    """Three box passes - close enough to a gaussian, and no scipy."""
    for _ in range(3):
        a = _box1d(_box1d(a, r, 0), r, 1)
    return a


def ring_rgba_frames(ring: int, count: int, glow: float = 0.60,
                     glow_radius: int = 8) -> tuple[list[bytes], int]:
    """Premultiplied BGRA frames for UpdateLayeredWindow, plus the canvas size.

    The glow is the ring's own colours bled outward, so the halo is iridescent
    rather than a flat wash. It is rotationally symmetric, so its alpha is
    computed once and only the colour field rotates per frame.
    """
    margin = int(glow_radius * 2.6)
    size = ring + margin * 2
    n = size * SS

    axis = (np.arange(n) + 0.5) / n * 2 - 1
    x, y = axis[None, :], axis[:, None]
    radius = np.sqrt(x ** 2 + y ** 2) * size / ring        # 1.0 == the ring's edge

    band = ((radius >= INNER) & (radius <= OUTER)).astype(np.float64)
    ring_a = band.reshape(size, SS, size, SS).mean(axis=(1, 3))     # antialiased

    halo = _blur(ring_a, glow_radius) * glow
    alpha = np.clip(ring_a + halo * (1 - ring_a), 0.0, 1.0)

    # Sampled at final resolution, NOT averaged from the supersampled grid: angle
    # wraps 1.0 -> 0.0 at twelve o'clock, and averaging across that seam lands in
    # the middle of the gradient, drawing a wrong-coloured line down the top.
    # Only alpha needs supersampling; colour is smooth enough to point-sample.
    small_axis = (np.arange(size) + 0.5) / size * 2 - 1
    angle_small = np.arctan2(small_axis[None, :], -small_axis[:, None]) / (2 * np.pi) % 1.0

    frames = []
    for i in range(count):
        colour = _conic((angle_small + i / count) % 1.0)
        # premultiplied, BGRA order, top-down - what UpdateLayeredWindow expects
        bgra = np.empty((size, size, 4), dtype=np.uint8)
        premul = np.clip(colour * alpha[..., None], 0, 255)
        bgra[..., 0] = premul[..., 2]
        bgra[..., 1] = premul[..., 1]
        bgra[..., 2] = premul[..., 0]
        bgra[..., 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
        frames.append(bgra.tobytes())

    return frames, size
