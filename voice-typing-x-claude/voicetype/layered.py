"""Per-pixel alpha for a tkinter window, via Windows' UpdateLayeredWindow.

Tk can only do -transparentcolor, which keys out one exact colour: hard edges,
and no glow, since a glow IS partial alpha. Windows will composite a real alpha
channel if you hand it a premultiplied BGRA bitmap directly.

Tk still owns the window, the event loop and the mouse bindings; we only take
over what the window looks like. Two things fall out of it for free:
  - clicks pass through wherever alpha is zero (hit-testing follows the alpha)
  - WS_EX_NOACTIVATE means clicking the ring never steals focus from your terminal
"""

from __future__ import annotations

import ctypes
from ctypes import wintypes

user32 = ctypes.WinDLL("user32", use_last_error=True)
gdi32 = ctypes.WinDLL("gdi32", use_last_error=True)

GWL_EXSTYLE = -20
WS_EX_LAYERED = 0x00080000
WS_EX_TOOLWINDOW = 0x00000080
WS_EX_NOACTIVATE = 0x08000000
ULW_ALPHA = 0x02
AC_SRC_OVER, AC_SRC_ALPHA = 0x00, 0x01
BI_RGB, DIB_RGB_COLORS = 0, 0


class BITMAPINFOHEADER(ctypes.Structure):
    _fields_ = [("biSize", wintypes.DWORD), ("biWidth", wintypes.LONG),
                ("biHeight", wintypes.LONG), ("biPlanes", wintypes.WORD),
                ("biBitCount", wintypes.WORD), ("biCompression", wintypes.DWORD),
                ("biSizeImage", wintypes.DWORD), ("biXPelsPerMeter", wintypes.LONG),
                ("biYPelsPerMeter", wintypes.LONG), ("biClrUsed", wintypes.DWORD),
                ("biClrImportant", wintypes.DWORD)]


class BITMAPINFO(ctypes.Structure):
    _fields_ = [("bmiHeader", BITMAPINFOHEADER), ("bmiColors", wintypes.DWORD * 3)]


class BLENDFUNCTION(ctypes.Structure):
    _fields_ = [("BlendOp", ctypes.c_byte), ("BlendFlags", ctypes.c_byte),
                ("SourceConstantAlpha", ctypes.c_byte), ("AlphaFormat", ctypes.c_byte)]


gdi32.CreateDIBSection.argtypes = [wintypes.HDC, ctypes.POINTER(BITMAPINFO), wintypes.UINT,
                                   ctypes.POINTER(ctypes.c_void_p), wintypes.HANDLE,
                                   wintypes.DWORD]
gdi32.CreateDIBSection.restype = wintypes.HBITMAP
gdi32.CreateCompatibleDC.argtypes = [wintypes.HDC]
gdi32.CreateCompatibleDC.restype = wintypes.HDC
gdi32.SelectObject.argtypes = [wintypes.HDC, wintypes.HGDIOBJ]
gdi32.SelectObject.restype = wintypes.HGDIOBJ
user32.GetDC.argtypes = [wintypes.HWND]
user32.GetDC.restype = wintypes.HDC
user32.UpdateLayeredWindow.argtypes = [
    wintypes.HWND, wintypes.HDC, ctypes.POINTER(wintypes.POINT),
    ctypes.POINTER(wintypes.SIZE), wintypes.HDC, ctypes.POINTER(wintypes.POINT),
    wintypes.COLORREF, ctypes.POINTER(BLENDFUNCTION), wintypes.DWORD]
user32.UpdateLayeredWindow.restype = wintypes.BOOL

# 64-bit Windows needs the Ptr variants; the 32-bit build only has the plain ones.
_get_long = getattr(user32, "GetWindowLongPtrW", user32.GetWindowLongW)
_set_long = getattr(user32, "SetWindowLongPtrW", user32.SetWindowLongW)
_get_long.argtypes = [wintypes.HWND, ctypes.c_int]
_get_long.restype = ctypes.c_ssize_t
_set_long.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t]
_set_long.restype = ctypes.c_ssize_t


def virtual_screen() -> tuple[int, int, int, int]:
    """(x, y, w, h) spanning every monitor, so a saved position can be sanity-checked.

    Tk only knows the primary screen. Unplug a monitor with the ring parked on it
    and a restored position could strand it where you can never drag it back.
    """
    return (user32.GetSystemMetrics(76), user32.GetSystemMetrics(77),
            user32.GetSystemMetrics(78), user32.GetSystemMetrics(79))


class LayeredSurface:
    """Paints a tkinter toplevel from raw premultiplied BGRA bytes."""

    def __init__(self, root, size: int, no_activate: bool = True) -> None:
        self.size = size
        root.update_idletasks()

        # Tk's toplevel is a child of a wrapper window; the wrapper is the one
        # Windows treats as top-level, so that is what has to be layered.
        child = root.winfo_id()
        parent = user32.GetParent(child)
        self.hwnd = parent if parent else child

        style = _get_long(self.hwnd, GWL_EXSTYLE) | WS_EX_LAYERED | WS_EX_TOOLWINDOW
        if no_activate:
            style |= WS_EX_NOACTIVATE
        _set_long(self.hwnd, GWL_EXSTYLE, style)

        info = BITMAPINFO()
        info.bmiHeader.biSize = ctypes.sizeof(BITMAPINFOHEADER)
        info.bmiHeader.biWidth = size
        info.bmiHeader.biHeight = -size          # negative: top-down rows
        info.bmiHeader.biPlanes = 1
        info.bmiHeader.biBitCount = 32
        info.bmiHeader.biCompression = BI_RGB

        self.screen_dc = user32.GetDC(None)
        self.mem_dc = gdi32.CreateCompatibleDC(self.screen_dc)
        self.bits = ctypes.c_void_p()
        self.bitmap = gdi32.CreateDIBSection(self.mem_dc, ctypes.byref(info),
                                             DIB_RGB_COLORS, ctypes.byref(self.bits),
                                             None, 0)
        if not self.bitmap:
            raise OSError("CreateDIBSection failed")
        gdi32.SelectObject(self.mem_dc, self.bitmap)

        self._size = wintypes.SIZE(size, size)
        self._src = wintypes.POINT(0, 0)
        self._blend = BLENDFUNCTION(AC_SRC_OVER, 0, 255, AC_SRC_ALPHA)
        self._nbytes = size * size * 4

    def show(self, bgra: bytes) -> None:
        ctypes.memmove(self.bits, bgra, self._nbytes)
        # pptDst=None leaves position alone, so Tk's geometry stays authoritative
        # and dragging keeps working through the usual bindings.
        user32.UpdateLayeredWindow(self.hwnd, self.screen_dc, None,
                                   ctypes.byref(self._size), self.mem_dc,
                                   ctypes.byref(self._src), 0,
                                   ctypes.byref(self._blend), ULW_ALPHA)
