# batch-folder.ps1 — every image in a folder, in one run
#
# Saves as JPG by default, on purpose: 4x PNGs get enormous, and a folder
# of a hundred of them will fill a drive faster than you'd expect. Change
# $Format to "png" if you actually need lossless output.
#
# There's no resume. If you stop it halfway, running it again starts over -
# so for very large batches, split them into a few folders.
#
# Run it:  right-click -> Run with PowerShell
#     or:  powershell -ExecutionPolicy Bypass -File .\batch-folder.ps1

# ---- [CUSTOMIZE] ---------------------------------------------------------

# Where you extracted the tool (see ../SETUP-UPSCALER.md step 2)
$Exe = "C:\Tools\realesrgan\realesrgan-ncnn-vulkan.exe"

# The folder of images going in, and the folder to put results in.
# These must be two different folders.
$InDir  = "C:\Users\you\Pictures\to-upscale"
$OutDir = "C:\Users\you\Pictures\upscaled"

# Which model - "realesrgan-x4plus" for photographs,
#               "realesrgan-x4plus-anime" for drawn artwork.
$Model = "realesrgan-x4plus"

# How much bigger: 2, 3, or 4. For a big batch, 2 is often the sane choice.
$Scale = 4

# Output format: "jpg", "png", or "webp".
$Format = "jpg"

# Tile size. Leave at 0 unless you hit an out-of-memory error or black
# output images - then try 256, then 128, then 64.
$Tile = 0

# --------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Exe)) {
    Write-Host "Can't find the tool at: $Exe" -ForegroundColor Red
    Write-Host "Fix the `$Exe path at the top of this file." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path $InDir)) {
    Write-Host "Can't find the input folder: $InDir" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

# The tool won't reliably create this itself, so do it here
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

# Note the trailing \* - -Include is ignored on a bare folder path
$Count = @(Get-ChildItem -Path (Join-Path $InDir "*") -File -Include *.jpg,*.jpeg,*.png,*.webp).Count

Write-Host "About to upscale $Count image(s) at ${Scale}x using $Model." -ForegroundColor Cyan
Write-Host "This runs one image at a time and can take a while - a slow card" -ForegroundColor Cyan
Write-Host "at 30 seconds each means $Count images is roughly $([math]::Round($Count * 0.5)) minutes." -ForegroundColor Cyan
$Go = Read-Host "Press Enter to start, or type n then Enter to cancel"
if ($Go -eq "n") { exit 0 }

# Point at the models folder explicitly, so this works from any directory
$Models = Join-Path (Split-Path $Exe -Parent) "models"

& $Exe -i $InDir -o $OutDir -n $Model -s $Scale -f $Format -t $Tile -m $Models

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Results are in: $OutDir" -ForegroundColor Green
    Write-Host "Spot-check a few at 100% zoom before deleting anything." -ForegroundColor Green
} else {
    Write-Host "It failed - see the message above." -ForegroundColor Red
    Write-Host "Out of memory or black images? Set `$Tile = 256 and run again." -ForegroundColor Yellow
    Write-Host "See ../USING-IT.md for the other five things that go wrong." -ForegroundColor Yellow
}

Read-Host "Press Enter to close"
