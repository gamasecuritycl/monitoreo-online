Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\public\og-gama.png'
$base = [System.Drawing.Image]::FromFile((Resolve-Path $src).Path)

$labels = @{ 'og-servicio' = 'SERVICIOS DE SEGURIDAD'
             'og-comuna'    = 'COBERTURA POR COMUNA'
             'og-blog'      = 'BLOG DE SEGURIDAD' }

foreach ($name in $labels.Keys) {
  $bmp = New-Object System.Drawing.Bitmap(1200, 630)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($base, 0, 0, 1200, 630)

  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 5, 13, 26))
  $g.FillRectangle($brush, 0, 540, 1200, 90)

  $font = New-Object System.Drawing.Font('Segoe UI', 36, [System.Drawing.FontStyle]::Bold)
  $white = [System.Drawing.Brushes]::White
  $g.DrawString($labels[$name], $font, $white, 40, 555)

  $g.Dispose()
  $out = Join-Path $PSScriptRoot "..\public\$name.png"
  $bmp.Save((Join-Path (Resolve-Path (Split-Path $out)).Path "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK $name.png"
}
$base.Dispose()
