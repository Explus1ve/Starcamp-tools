# Setting up the upscaler — step by step

This walks through downloading Real-ESRGAN and running your first image
through it. There's no installer and nothing gets added to Windows — you
unzip a folder, and the whole tool lives inside it. Deleting that folder
is a complete uninstall.

**Before you start:** you need about 100 MB of disk space and a graphics
card from roughly the last ten years (Nvidia, AMD, or Intel built into the
processor all work). No account, no internet connection after the
download.

## 1. Download the tool

Go to the releases page:

**https://github.com/xinntao/Real-ESRGAN/releases**

Scroll to **v0.2.5.0** and download the Windows file:

```
realesrgan-ncnn-vulkan-20220424-windows.zip
```

Or use the direct link:
https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip

It's around 25 MB and includes the AI models, so there's no second
download afterwards.

**Don't be put off by the 2022 date.** That's the newest prebuilt program
there is. The higher version numbers further up that page are source code
for the Python version, which needs a much bigger setup and isn't what
this guide covers.

## 2. Unzip it — properly

Right-click the downloaded zip → **Extract All…** → put it somewhere with
a short, simple path and no spaces. `C:\Tools\realesrgan` is a good
choice.

**This step matters more than it looks.** Windows lets you double-click
into a zip file and it looks like a normal folder — but the program can't
find its AI models from in there and will fail with a confusing error.
Extract it for real, then work from the extracted folder.

When you're done you should see, inside that folder:

- `realesrgan-ncnn-vulkan.exe` — the program itself
- a `models` folder containing files ending in `.bin` and `.param`
- a couple of licence and readme text files

If there's no `models` folder next to the .exe, the extract didn't finish
— do it again.

## 3. Open a terminal in that folder

In File Explorer, open your `C:\Tools\realesrgan` folder, click into the
address bar at the top, type `powershell`, and press Enter. A blue window
opens, already pointed at the right folder.

That "already pointed at the right folder" part is the point — the program
looks for its `models` folder relative to where you're standing, so
starting from anywhere else is the most common way to trip it up.

## 4. Check it runs

Type this and press Enter:

```
.\realesrgan-ncnn-vulkan.exe -h
```

**You'll probably get a blue "Windows protected your PC" popup.** This is
SmartScreen, and it appears for any program that isn't signed by a big
company — it's not a virus warning, it's a "we don't recognise the
publisher" warning. Click **More info**, then **Run anyway**. You'll only
be asked once.

If it works, you get a wall of text listing the options. That's success —
that text is the built-in help, and `USING-IT.md` explains what each line
actually means.

If instead you get an error mentioning **vulkan**, your graphics driver
needs updating: get it from the Nvidia, AMD, or Intel support site for
your card, restart, and try again.

## 5. Upscale one test image

Put a test image somewhere easy to type, like `C:\Tools\realesrgan\in.jpg`.
Then, in the same terminal:

```
.\realesrgan-ncnn-vulkan.exe -i in.jpg -o out.png -n realesrgan-x4plus -s 4
```

Reading that left to right: `-i` is the image going in, `-o` is the file
to create, `-n` picks which AI model to use, `-s 4` makes it four times
wider and taller.

You'll see it count from 0.00% to 100.00%. A normal photo takes a few
seconds to a minute depending on your graphics card. When it's done,
`out.png` is sitting in the same folder.

**Always pass `-n` explicitly.** If you leave it out, the program quietly
defaults to the anime-video model, which is not what you want for
photographs — and the result looks wrong in a way that's hard to diagnose
if you don't know that's what happened.

## 6. Look at it properly

Open the result and zoom to **100%** — actual pixels, not fit-to-window.
Zoomed out, everything looks better simply because it's bigger; 100% is
where you see whether the detail is real or smeared.

Compare against the original at the same on-screen size. What you're
looking for: edges that are crisp without being outlined, texture that
still looks like skin or fabric rather than plastic, and no wormy
patterns in flat areas like sky.

If it looks over-smoothed or plasticky, that's usually the wrong model for
the image type — `USING-IT.md` covers choosing between them.

## 7. Now do it for real

Copy a preset from `presets/`, fill in the three paths at the top, and run
that instead of typing commands by hand. That's where scale, model, and
batching are set up for you per image type — see `presets/README.md`.
