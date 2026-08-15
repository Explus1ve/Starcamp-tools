# Using it — the reference

Everything the program can do, in plain English. Read `SETUP-UPSCALER.md`
first if you haven't got it running yet.

The shape of every command is the same:

```
.\realesrgan-ncnn-vulkan.exe -i <image in> -o <image out> -n <model> -s <scale>
```

Everything else is optional and mostly only comes out when something's
gone wrong.

## Picking the model — the decision that matters

This is the one choice that changes the result more than everything else
combined. Wrong model isn't a matter of taste; it visibly damages the
image.

| Model | Use it for | What it does |
|---|---|---|
| `realesrgan-x4plus` | **Photographs, real-world images, product shots, screenshots of real things.** The default answer. | Reconstructs texture and detail aggressively. Best all-rounder. |
| `realesrgan-x4plus-anime` | **Anime, manga, illustration, cartoons, logos, flat-colour graphics.** | Keeps lines clean and colours flat instead of inventing texture inside them. Much smaller file, much faster. |
| `realesr-animevideov3` | **Frames pulled from anime video.** | Tuned for video compression damage. Also the model you get by accident if you forget `-n`. |
| `realesrnet-x4plus` | Rarely. | A gentler, more conservative version of `x4plus` — less invented detail, less risk of artefacts. Try it if `x4plus` looks over-processed. |

Rule of thumb: **if a camera made it, use `realesrgan-x4plus`. If a person
or a program drew it, use `realesrgan-x4plus-anime`.**

Running an anime image through the photo model is the classic mistake — it
tries to add skin-like texture inside flat cel colours and the result
looks grubby.

## Every option

| Flag | What it means | When you'd change it |
|---|---|---|
| `-i` | Input — an image file, **or a folder** | Always |
| `-o` | Output — a file, or a folder if the input was a folder | Always |
| `-n` | Model name (see table above) | Always — never leave it out |
| `-s` | Scale: `2`, `3`, or `4`. Default `4` | When 4× is more than you need |
| `-f` | Output format: `png`, `jpg`, `webp`. Default `png` | Big batches where PNG files get huge |
| `-t` | Tile size — how much it processes at once. `0` = automatic | Only to fix out-of-memory errors |
| `-m` | Path to the `models` folder | If you run from a different folder |
| `-g` | Which graphics card. `-1` means use the processor instead | Multiple GPUs, or no working GPU |
| `-x` | TTA mode — slightly better, roughly 8× slower | Almost never. A single hero image at most |
| `-j` | Thread counts, as `load:process:save` | Almost never |
| `-v` | Verbose — prints more detail | Diagnosing a problem |

## Scale: don't reach for 4× automatically

The models are built for 4×, and `-s 2` or `-s 3` works by upscaling to 4×
and then shrinking down. So smaller scales aren't faster — but they often
look better, because shrinking hides the small mistakes the AI made.

Practical guide:

- **Print, or a big source image already 2000px+:** `-s 2` is usually
  plenty and looks cleaner.
- **Small web images, thumbnails, old photos under 1000px:** `-s 4`.
- **Anything already large:** check the maths first. A 4000×3000 photo at
  4× becomes 16000×12000 — that's a 200 MB+ PNG that most programs will
  struggle to even open.

## Doing a whole folder

Point `-i` and `-o` at folders instead of files:

```
.\realesrgan-ncnn-vulkan.exe -i C:\photos\in -o C:\photos\out -n realesrgan-x4plus -s 4 -f jpg
```

Notes that save grief:

- **Create the output folder yourself first.** It won't always make it for
  you, and the failure is silent-looking.
- **Use `-f jpg` for anything over about twenty images**, unless you
  specifically need PNG. PNG output of 4× images gets enormous fast.
- It processes every image in the folder, one after another, and doesn't
  look in sub-folders.
- There's no resume. If you stop it halfway, restarting redoes everything
  — so for a big batch, split it into a few folders.

**Estimating time:** run one image first and time it, then multiply. A
batch of 200 photos at thirty seconds each is over an hour and a half, and
knowing that upfront is better than finding out.

## Paths with spaces

If any path has a space in it, wrap it in quotes:

```
.\realesrgan-ncnn-vulkan.exe -i "C:\Users\Me\My Photos\shot 1.jpg" -o "C:\Users\Me\out.png" -n realesrgan-x4plus
```

Missing quotes is the single most common cause of "it says the file
doesn't exist" when the file obviously does exist.

## The six things that go wrong

**1. "vulkan device not found" / instant crash on launch.**
Graphics driver is too old or missing. Update it from Nvidia's, AMD's, or
Intel's site — not through Windows Update, which lags badly on this —
then restart. As a last-resort test, `-g -1` runs on the processor
instead; it works, but it's ten to fifty times slower.

**2. Out of memory, or the output is a black or half-black image.**
Your graphics card ran out of working memory. Force smaller chunks with
`-t`:

```
-t 256
```

If that still fails, try `-t 128`, then `-t 64`. Smaller tiles are a bit
slower and, at very small sizes, can leave faint seams in flat areas — but
they will get the job done on a modest card.

**3. "failed to load model" or similar.**
You're not standing in the folder that contains `models`, or you're
running from inside the zip file rather than an extracted folder. Either
`cd` to the tool's folder, or add `-m` pointing at the models folder:

```
-m C:\Tools\realesrgan\models
```

**4. The result looks plasticky, waxy, or smeared.**
Almost always the wrong model — check the model table above. If the model
is right and it still looks over-processed, try `realesrnet-x4plus`, which
is more conservative, or drop to `-s 2`.

**5. Faces look uncanny.**
Expected. Face restoration is a separate model (GFPGAN) that only ships
with the project's Python version, not this portable one. For a few
important portraits, that heavier setup is worth it — for anything else,
it isn't.

**6. Transparent backgrounds turn black or come out ragged.**
Transparency handling is unreliable here. Flatten the image onto a solid
background before upscaling, upscale, then cut it out again afterwards.

## Where this fits

Upscaling is the last step, not the first. Crop, straighten, and colour
correct **before** upscaling — those operations on a 4× image are slow,
and any dust or noise you leave in gets faithfully enlarged along with
everything you wanted.

If the source is genuinely tiny or badly damaged, no upscaler saves it.
It reconstructs plausible detail; it doesn't recover lost information.
