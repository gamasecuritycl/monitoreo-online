# Escáner de red compatible con PowerShell 5.1 usando .NET Tasks
$subnet = "192.168.1"
$ports = @(554, 80, 37777)
$results = [System.Collections.Concurrent.ConcurrentBag[PSCustomObject]]::new()

Write-Host "Iniciando escaneo compatible en $subnet.x..." -ForegroundColor Cyan

# Función para escanear una IP
$scanIp = {
    param($ip)
    # 1. Ping rápido (timeout 150ms)
    $ping = New-Object System.Net.NetworkInformation.Ping
    try {
        $reply = $ping.Send($ip, 150)
        if ($reply.Status -eq "Success") {
            # Si responde ping, probar los puertos Dahua/RTSP
            foreach ($port in $ports) {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $connect = $tcp.BeginConnect($ip, $port, $null, $null)
                $wait = $connect.AsyncWaitHandle.WaitOne(150, $false)
                if ($wait) {
                    try {
                        $tcp.EndConnect($connect)
                        $results.Add([PSCustomObject]@{
                            IP   = $ip
                            Port = $port
                            Service = if ($port -eq 554) { "RTSP" } elseif ($port -eq 37777) { "Dahua" } else { "HTTP" }
                        })
                    } catch {}
                }
                $tcp.Close()
            }
        }
    } catch {}
}

# Ejecutar las 254 IPs en paralelo usando hilos de .NET
$tasks = New-Object System.Collections.Generic.List[System.Threading.Tasks.Task]
for ($i = 1; $i -le 254; $i++) {
    $ip = "$subnet.$i"
    $task = [System.Threading.Tasks.Task]::Run({
        & $scanIp $using:ip
    })
    $tasks.Add($task)
}

# Esperar a que terminen todas las tareas (máximo 8 segundos)
[System.Threading.Tasks.Task]::WaitAll($tasks.ToArray(), 8000) | Out-Null

Write-Host "`nEscaneo completado. Dispositivos activos encontrados:" -ForegroundColor Green
if ($results.Count -eq 0) {
    Write-Host "No se encontró ningún dispositivo Dahua o puerto abierto en RTSP (554) / Dahua (37777)." -ForegroundColor Red
} else {
    $results | Out-String | Write-Host -ForegroundColor Yellow
}
