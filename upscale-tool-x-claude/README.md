# Upscale Tool × Claude

A free way to enlarge images and keep them sharp: old photos, small logos, low-resolution screenshots, artwork, anime frames. It runs offline on your own computer. No account, no upload, no watermark, no credit counter.

The tool itself is **Real-ESRGAN**, an open-source AI upscaler by Xintao Wang and the ARC Lab team at Tencent. (Open source means its code is published for anyone to use.) This folder is the part that usually goes missing: plain-English instructions for getting it running and using it well, plus three ready-made presets. You download the tool from the link below; everything else is here.

- **The project:** https://github.com/xinntao/Real-ESRGAN
- **The download you want (Windows):**
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip

There is nothing to install. You unzip one folder and run one command per image, or point it at a folder and let it work through the lot.

## What it does

- Enlarges an image 2, 3 or 4 times over and rebuilds detail as it goes, instead of stretching the pixels you already had.
- Cleans up what small web images carry with them: blocky squares, colour banding, fuzz from compression. It was trained on exactly that kind of damaged picture.
- Has separate models for photographs and for drawings. (A model is the trained AI file that does the work.) Picking the right one matters more than any other setting.
- Runs on your graphics card, whether it is Nvidia, AMD or Intel, with nothing extra to set up.
- Works on one file or a whole folder in one go.
- Free and open source (BSD-3-Clause licence). Everything stays on your computer.

## Good to know before you start

- **Faces come out sharper and can look a little smooth up close.** The model made for faces, GFPGAN, comes with the project's Python version, which is a bigger setup than the one this folder covers.
- **It rebuilds detail that is plausibly there.** Text too small to read in the original stays unreadable; it becomes letter-shaped.
- **It runs on one Windows PC, from a window called PowerShell.** The setup guide shows you how to open it.

## What's inside

| File | What it's for |
|---|---|
| `START-HERE.md` | The message to paste as your first one to Claude. |
| `SETUP-UPSCALER.md` | Click by click: the one-time download and unzip, then the first test run. |
| `USING-IT.md` | The reference: every option in plain English, which model to pick, doing a whole folder, and the six things that most often trip people up. |
| `presets/` | Three ready-to-run scripts to copy and edit. See `presets/README.md`. |

## Quick start

1. Follow `SETUP-UPSCALER.md` to download and unzip the tool. About five minutes, most of it the download.
2. Read `presets/README.md`, pick the preset closest to what you are enlarging, copy it somewhere handy, and fill in the three paths at the top.
3. Run it. Compare before and after at 100% zoom.
4. Keep `USING-IT.md` open the first few times. The model choice and the tile-size fix are the two things worth understanding.

Or start with `START-HERE.md` and hand the whole thing to Claude.

## A note on versions

The ready-to-run build is `v0.2.5.0`, from April 2022. Higher release numbers on that page, up to `v0.3.0`, are source code for the Python version, so 2022 is the current ready-to-run build. It works well today.
