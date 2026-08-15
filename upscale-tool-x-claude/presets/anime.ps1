# anime.ps1 — anime, illustration, logos and flat-colour art, upscaled 4x
#
# For anything drawn rather than photographed: anime, manga, cartoons,
# illustrations, logos, icons, flat graphics. This model keeps lines clean
# and colours flat instead of inventing photo texture inside them - which
# is exactly what the photo model gets wrong on this kind of image.
#
# Run it:  right-click -> Run with PowerShell
#     or:  powershell -ExecutionPolicy Bypass -File .\anime.ps1

# ---- [CUSTOMIZE] ---------------------------------------------------------

# Where you extracted the tool (see ../SETUP-UPSCALER.md step 2)
$Exe = "C:\Tools\realesrgan\realesrgan-ncnn-vulkan.exe"

# The image going in, and the file to create
$InFile  = "C:\Users\you\Pictures\art.png"
$OutFile = "C:\Users\you\Pictures\art-4x.png"

# How much bigger: 2, 3, or 4.
$Scale = 4

# Set this to $true only for frames grabbed out of anime video - it swaps
# in the model tuned for video compression damage.
$FromVideo = $false

# Tile size. Leave at 0 unless you hit an out-of-memory error or a black
# output image - then try 256, then 128, then 64.
$Tile = 0

# --------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Exe)) {
    Write-Host "Can't find the tool at: $Exe" -ForegroundColor Red
    Write-Host "Fix the `$Exe path at the top of this file." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path $InFile)) {
    Write-Host "Can't find the image at: $InFile" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$Model = if ($FromVideo) { "realesr-animevideov3" } else { "realesrgan-x4plus-anime" }

$OutDir = Split-Path $OutFile -Parent
if ($OutDir -and -not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

# Point at the models folder explicitly, so this works from any directory
$Models = Join-Path (Split-Path $Exe -Parent) "models"

Write-Host "Upscaling $InFile at ${Scale}x with $Model..." -ForegroundColor Cyan

& $Exe -i $InFile -o $OutFile -n $Model -s $Scale -t $Tile -m $Models

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done: $OutFile" -ForegroundColor Green
    Write-Host "Open it and zoom to 100% to judge it properly." -ForegroundColor Green
} else {
    Write-Host "It failed - see the message above." -ForegroundColor Red
    Write-Host "Out of memory or a black image? Set `$Tile = 256 and run again." -ForegroundColor Yellow
    Write-Host "See ../USING-IT.md for the other five things that go wrong." -ForegroundColor Yellow
}

Read-Host "Press Enter to close"
