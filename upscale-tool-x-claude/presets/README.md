# Picking a preset

Each file here is a complete, working starting point — the model, the
scale, and the output format already chosen for one kind of job. Copy
whichever fits closest to somewhere convenient (your Desktop is fine),
edit the block marked `[CUSTOMIZE]` at the top, then run it.

| Preset | Model | Scale | Best for |
|---|---|---|---|
| `photos.ps1` | `realesrgan-x4plus` | 4× | One photograph or real-world image at a time. The default starting point if you're not sure. |
| `anime.ps1` | `realesrgan-x4plus-anime` | 4× | Anime, manga, illustration, logos, flat-colour graphics — anything drawn rather than photographed. |
| `batch-folder.ps1` | your choice | your choice | A whole folder in one run, saving as JPG so you don't end up with a hundred 200 MB PNGs. |

## Running one

Right-click the file → **Run with PowerShell**. If Windows refuses to run
scripts at all, open PowerShell in the folder and run it this way instead,
which allows just this one script without changing any settings
permanently:

```bash
powershell -ExecutionPolicy Bypass -File .\photos.ps1
```

## What to edit

Only the `[CUSTOMIZE]` block at the top of each file. There are three
things to fill in every time:

- `$Exe` — where you extracted the tool, e.g.
  `C:\Tools\realesrgan\realesrgan-ncnn-vulkan.exe`
- `$InFile` / `$InDir` — what you're upscaling
- `$OutFile` / `$OutDir` — where the result goes

Everything below that line is the actual command and doesn't need
touching. The scripts pass the models folder explicitly, so they work from
any folder — you don't have to be standing in the tool's directory.

Don't feel locked in — these are starting points, not finished products.
The easiest way to adapt one is to tell Claude what's different about your
images and have it edit your copy with you, rather than hand-editing the
PowerShell yourself.

**If you're unsure which to use:** it's not a preference, it's a right
answer per image. Camera-made → `photos.ps1`. Drawn → `anime.ps1`. The
model table in `../USING-IT.md` explains why.
