"""Build voicetype.ico from the aurora ring — every size Windows asks for.

Windows picks a different bitmap for the taskbar, the desktop, alt-tab and the
file dialog, so an icon with one size gets scaled badly somewhere. This writes
all seven, each rendered at its own resolution rather than resampled.

Regenerate with:  python make_icon.py voicetype.ico
"""

import struct
import sys
import zlib
from pathlib import Path

import numpy as np

from aurora import INNER, OUTER, SS, _blur, _conic

SIZES = [16, 24, 32, 48, 64, 128, 256]
FILL = 0.86          # ring diameter as a fraction of the canvas; the rest is glow room
GLOW = 0.45


def ring_rgba(size: int) -> np.ndarray:
    n = size * SS
    axis = (np.arange(n) + 0.5) / n * 2 - 1
    x, y = axis[None, :], axis[:, None]
    radius = np.sqrt(x ** 2 + y ** 2) / FILL

    band = ((radius >= INNER) & (radius <= OUTER)).astype(np.float64)
    ring_a = band.reshape(size, SS, size, SS).mean(axis=(1, 3))
    halo = _blur(ring_a, max(1, size // 16)) * GLOW
    alpha = np.clip(ring_a + halo * (1 - ring_a), 0.0, 1.0)

    small = (np.arange(size) + 0.5) / size * 2 - 1
    angle = np.arctan2(small[None, :], -small[:, None]) / (2 * np.pi) % 1.0

    out = np.empty((size, size, 4), dtype=np.uint8)
    out[..., :3] = np.clip(_conic(angle), 0, 255).astype(np.uint8)   # straight alpha
    out[..., 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    return out


def png_bytes(rgba: np.ndarray) -> bytes:
    h, w, _ = rgba.shape
    raw = b"".join(b"\x00" + rgba[y].tobytes() for y in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))   # 6 = RGBA
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))


def write_ico(path: Path, images: list[bytes], sizes: list[int]) -> None:
    """ICO wrapping PNG payloads — supported since Vista, and far smaller than BMP."""
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = len(header) + 16 * len(images)
    entries, blobs = b"", b""
    for png, size in zip(images, sizes):
        entries += struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0,
                               1, 32, len(png), offset)   # 0 in the byte means 256
        blobs += png
        offset += len(png)
    path.write_bytes(header + entries + blobs)


if __name__ == "__main__":
    target = Path(sys.argv[1])
    frames = {s: ring_rgba(s) for s in SIZES}
    write_ico(target, [png_bytes(frames[s]) for s in SIZES], SIZES)
    print(f"wrote {target}  ({target.stat().st_size / 1024:.1f} KB, "
          f"{len(SIZES)} sizes: {SIZES})")

    # contact sheet so the small sizes can actually be judged
    strip, pad = [], 8
    for bg in [(16, 16, 18), (205, 205, 210)]:
        row = np.full((256 + pad * 2, sum(s + pad for s in SIZES) + pad, 3), bg, np.uint8)
        cx = pad
        for s in SIZES:
            img = frames[s].astype(np.float64)
            a = img[..., 3:4] / 255.0
            comp = img[..., :3] * a + np.array(bg, np.float64) * (1 - a)
            y0 = pad + (256 - s) // 2
            row[y0:y0 + s, cx:cx + s] = comp.astype(np.uint8)
            cx += s + pad
        strip.append(row)
    Path("icon_preview.png").write_bytes(png_bytes(
        np.dstack([np.vstack(strip), np.full(np.vstack(strip).shape[:2], 255, np.uint8)])))
    print("wrote icon_preview.png")
