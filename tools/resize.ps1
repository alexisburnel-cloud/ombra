# Redimensionne les originaux CARÈNE vers public/photos (max 1920w, jpeg q82)
Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Alexis\Desktop\architecture-experiment\assets-raw"
$dst = "C:\Users\Alexis\Desktop\architecture-experiment\public\photos"
New-Item -ItemType Directory -Force $dst | Out-Null

# nom source → nom propre
$map = @{
  'grande-photo-AMq88gGZW5heWRwp.jpeg'                                    = 'maison-terrasse-couverte.jpg'
  'anna-c-e-80-90-YKbllg0P4quzvGag.jpeg'                                  = 'archive-1980.jpg'
  'anna-c-e-90-bis-mk3JJK7lgVI7KMq7.jpeg'                                 = 'archive-1990-chantier.jpg'
  'anna-c-e-90-bis2-mxBXXK3zJPSrvPo9.jpeg'                                = 'archive-1990.jpg'
  'anna-c-e-2000-YX4xxg821NI9OKnx.jpeg'                                   = 'maison-2000.jpg'
  'anna-c-e-2010-YNq22g5XrXh1r3Vz.jpg'                                    = 'maison-2010.jpg'
  'anna-c-e-2020-m7VbbXy2OvsDL5KO.jpeg'                                   = 'maison-2020.jpg'
  'b3e82299-d452-45fc-becb-1f802e9b9103_1_201_a-AzGNNK9N2GUG66P6.jpeg'    = 'maison-galets.jpg'
  'd487e7d6-6387-40f5-a9a9-1806f0e3582e_1_201_a-YrDJJG2JrBHwDeKR.jpeg'    = 'renovation-ferme.jpg'
  'd-1-1-m7VDKk8DG5TKpxr8.jpg'                                            = 'rameur-avant.jpg'
  '020-1024x768-AVLaagnPGGF9OEJE.jpg'                                     = 'maison-monopente.jpg'
  'img-0278-Y4LvvXyllWsB4nPB.jpg'                                         = 'maison-tour.jpg'
  '70473541_2898421896838620_3259434853979914240_n-YX4xxgjVWZH8R0LD.jpg'  = 'maison-piscine-soir.jpg'
  '467345947_9502250569789020_9102258293637778447_n-mnlJJKGQx9CbErj6.jpg' = 'renovation-coteau.jpg'
  '467427484_9514610775219666_7245459799384477740_n-Awv99KwlNLiXbqRQ.jpg' = 'chantier-2.jpg'
  '70660820_2920076511339825_2729814396531376128_n-AGBbbglREKiQzP2N.jpg'  = 'real-1.jpg'
  '71023389_2920075361339940_3071914043510882304_n-mv0JJKwgnDI1NjX4.jpg'  = 'real-2.jpg'
  '71843935_2920076414673168_2076879569679286272_n-YanJJKg5lBSgzogQ.jpg'  = 'real-3.jpg'
  '70621233_2920076314673178_8353425002300702720_n-A85VVXM9BgsjE1vV.jpg'  = 'real-4.jpg'
  'tim-r-A1a5xqvrlMtaeGEA.jpg'                                            = 'equipe-timothee-rousset.jpg'
  '1-A0xjjXbW6WfZywgp.jpg'                                                = 'equipe-jean-marc-munia.jpg'
  'flyer-lancement-carene-2-AQEepVJ65afMeM5A.jpg'                         = 'rameur-flyer.jpg'
}

$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$q = New-Object System.Drawing.Imaging.EncoderParameters(1)
$q.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

foreach ($k in $map.Keys) {
  $in = Join-Path $src $k
  if (-not (Test-Path $in)) { "MANQUANT: $k"; continue }
  $img = [System.Drawing.Image]::FromFile($in)
  $maxW = 1920
  $w = $img.Width; $h = $img.Height
  if ($w -gt $maxW) { $nh = [int]($h * $maxW / $w); $nw = $maxW } else { $nw = $w; $nh = $h }
  $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($img, 0, 0, $nw, $nh)
  $out = Join-Path $dst $map[$k]
  $bmp.Save($out, $enc, $q)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  "{0} -> {1} ({2}x{3})" -f $k, $map[$k], $nw, $nh
}
"TOTAL:"; (Get-ChildItem $dst | Measure-Object Length -Sum).Sum / 1MB