# Extrait Color/NormalGL/Roughness/AO des zips ambientCG,
# renomme en color/normal/rough/ao.jpg et limite la taille.
Add-Type -AssemblyName System.Drawing

$root = "C:\Users\Alexis\Desktop\architecture-experiment\public\textures"
$tmp = Join-Path $env:TEMP "acg-extract"

$sets = @{
  'Grass004_2K'       = @{ key = 'grass';   max = 1600 }
  'Gravel043_2K'      = @{ key = 'gravel';  max = 1600 }
  'Ground108_1K'      = @{ key = 'ground';  max = 1024 }
  'Plaster002_1K'     = @{ key = 'plaster'; max = 1024 }
  'Concrete034_1K'    = @{ key = 'concrete';max = 1024 }
  'WoodSiding009_1K'  = @{ key = 'siding';  max = 1024 }
  'RoofingTiles013A_1K' = @{ key = 'tiles'; max = 1024 }
  'PavingStones128_2K'= @{ key = 'paving';  max = 1600 }
  'Rock051_1K'        = @{ key = 'rock';    max = 1024 }
  'WoodFloor043_1K'   = @{ key = 'woodfloor'; max = 1024 }
  'Planks037A_1K'     = @{ key = 'planks';  max = 1024 }
  'Bricks097_2K'      = @{ key = 'stonewall'; max = 1600 }
}
$maps = @{ 'Color' = 'color'; 'NormalGL' = 'normal'; 'Roughness' = 'rough'; 'AmbientOcclusion' = 'ao' }

$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$q = New-Object System.Drawing.Imaging.EncoderParameters(1)
$q.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)

foreach ($zipName in $sets.Keys) {
  $conf = $sets[$zipName]
  $zip = Join-Path $root "$zipName.zip"
  if (-not (Test-Path $zip)) { "MANQUANT: $zipName"; continue }
  if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $dst = Join-Path $root $conf.key
  New-Item -ItemType Directory -Force $dst | Out-Null
  foreach ($m in $maps.Keys) {
    $src = Get-ChildItem $tmp -Filter "*_$m.jpg" | Select-Object -First 1
    if (-not $src) { continue }
    $img = [System.Drawing.Image]::FromFile($src.FullName)
    $mx = $conf.max
    if ($img.Width -gt $mx) { $nw = $mx; $nh = [int]($img.Height * $mx / $img.Width) } else { $nw = $img.Width; $nh = $img.Height }
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.DrawImage($img, 0, 0, $nw, $nh)
    $bmp.Save((Join-Path $dst "$($maps[$m]).jpg"), $enc, $q)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  }
  "$zipName -> $($conf.key)"
}
Remove-Item (Join-Path $root '*.zip') -Force
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
"TOTAL MB: {0:N1}" -f ((Get-ChildItem $root -Recurse -File | Measure-Object Length -Sum).Sum / 1MB)