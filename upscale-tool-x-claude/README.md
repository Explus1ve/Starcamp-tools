# Upscale Tool × Claude

A free, no-subscription way to enlarge images without them going soft or
blocky — old photos, small logos, low-res screenshots, artwork, anime
frames. It runs entirely on your own PC, offline, with no account, no
upload, no watermark, and no per-image credit counter.

The tool itself is **Real-ESRGAN**, an open-source AI upscaler by Xintao
Wang and the ARC Lab team at Tencent. This folder isn't a copy of it —
it's the part that's usually missing: plain-English instructions for
getting it running and actually using it well, plus three ready-made
presets. You download the tool from the link below; everything else is
here.

- **The project:** https://github.com/xinntao/Real-ESRGAN
- **The download you want (Windows):**
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip

You don't install anything. You unzip one folder and run one command per
image — or point it at a folder and let it work through the whole thing.

## What it does

- Enlarges an image 2×, 3×, or 4× and reconstructs detail while it does,
  rather than just stretching the pixels you already had.
- Cleans up the mess that comes with small web images — JPEG blocking,
  banding, compression fuzz — because it was trained on exactly that kind
  of damaged input, not on pristine originals.
- Has separate models tuned for photographs versus anime and
  illustration, which matters more than any other setting you'll touch.
- Runs on your graphics card through Vulkan — Nvidia, AMD, or Intel, no
  CUDA install, no Python, no PyTorch, nothing to set up.
- Works on one file or a whole folder in one go.
- Free and open-source (BSD-3-Clause). No sign-in, no cloud, nothing
  leaves your machine.

## What it doesn't do

- **It won't fix faces.** The dedicated face-restoration model (GFPGAN)
  only exists in the project's Python version, not in the portable one
  this folder covers. Portraits come out sharper but can look slightly
  waxy up close.
- **It won't invent what was never there.** Text too small to read stays
  unreadable; it just becomes confidently-shaped nonsense.
- **It won't run in a browser.** This is a local program on one PC.

## What's inside

| File | What it's for |
|---|---|
| `START-HERE.md` | The prompt — paste it as your first message to Claude. |
| `SETUP-UPSCALER.md` | Click-by-click walkthrough for the one-time download and unzip, plus the first test run. |
| `USING-IT.md` | The reference — every option in plain English, which model to pick, batching a folder, and the six things that go wrong. |
| `presets/` | Three ready-to-run scripts to copy and edit — see `presets/README.md`. |

## Quick start

1. Follow `SETUP-UPSCALER.md` to download and unzip the tool (about five
   minutes, most of it waiting on the download).
2. Read `presets/README.md`, pick the preset closest to what you're
   upscaling, copy it somewhere convenient, and fill in the three paths at
   the top.
3. Run it. Compare the before and after at 100% zoom, not zoomed out.
4. Keep `USING-IT.md` open the first few times — the model choice and the
   tile-size fix are the two things worth understanding.

Or skip straight to `START-HERE.md` and hand the whole thing to Claude.

## A note on versions

The portable ready-to-run build is `v0.2.5.0`, dated April 2022. Newer
release numbers exist on that page (up to `v0.3.0`), but those are source
code for the Python version — there's no newer prebuilt executable to
find. You're not missing an update; 2022 is the current one for this
route, and it still works fine.
