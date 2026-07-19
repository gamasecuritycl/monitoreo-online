# Escáner de Red Inteligente para Cámaras Dahua / IP (PowerShell 5.1+)
# Diseñado para técnicos en terreno - GAMA SEGURIDAD

$ErrorActionPreference = "SilentlyContinue"
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "         GAMA SEGURIDAD - BUSCADOR DE CÁMARAS IP" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Detectando adaptadores de red y subredes locales..." -ForegroundColor Yellow

# Obtener IPs locales de interfaces activas (excluyendo loops y VPNs conocidas)
$interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notlike "*WireGuard*" -and
    $_.InterfaceAlias -notlike "*vEthernet*" -and
    $_.InterfaceAlias -notlike "*Docker*"
}

if (-not $interfaces) {
    Write-Host "ERROR: No se detectaron interfaces de red locales activas." -ForegroundColor Red
    pause
    exit
}

$subnets = @()
foreach ($face in $interfaces) {
    $ip = $face.IPAddress
    $parts = $ip.Split('.')
    $subnet = "$($parts[0]).$($parts[1]).$($parts[2])"
    if ($subnets -notcontains $subnet) {
        $subnets += $subnet
        Write-Host " -> Detectada Red: $subnet.x (Interfaz: $($face.InterfaceAlias) | IP: $ip)" -ForegroundColor Green
    }
}

$ports = @(554, 80, 37777, 8000)
$foundDevices = [System.Collections.Concurrent.ConcurrentBag[PSCustomObject]]::new()

Write-Host "`nEscaneando subredes en paralelo... (Tiempo estimado: 10-15 segundos)" -ForegroundColor Yellow

# Crear un RunspacePool para multithreading ultra-rápido en PowerShell 5
$sessionState = [System.Management.Automation.Runspaces.InitialSessionState]::CreateDefault()
$pool = [System.Management.Automation.Runspaces.RunspaceFactory]::CreateRunspacePool(1, 100, $sessionState, $Host)
$pool.Open()

$jobs = New-Object System.Collections.Generic.List[PSCustomObject]

$scriptBlock = {
    param($ip, $ports, $foundDevices)
    
    # 1. Ping ultrarrápido usando .NET
    $ping = New-Object System.Net.NetworkInformation.Ping
    try {
        $reply = $ping.Send($ip, 200) # 200ms timeout
        if ($reply.Status -eq "Success") {
            # 2. Verificar puertos comunes de cámaras
            foreach ($port in $ports) {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $connect = $tcp.BeginConnect($ip, $port, $null, $null)
                $wait = $connect.AsyncWaitHandle.WaitOne(150, $false) # 150ms timeout
                if ($wait) {
                    try {
                        $tcp.EndConnect($connect)
                        $serviceName = switch ($port) {
                            554   { "RTSP (Video Stream)" }
                            37777 { "Dahua Servicio TCP" }
                            80    { "HTTP (Web Admin)" }
                            8000  { "Hikvision / SDK Port" }
                            Default { "Desconocido" }
                        }
                        
                        $foundDevices.Add([PSCustomObject]@{
                            IP      = $ip
                            Port    = $port
                            Service = $serviceName
                        })
                    } catch {}
                }
                $tcp.Close()
            }
        }
    } catch {}
}

# Lanzar hilos para todas las IPs en todas las subredes detectadas
foreach ($subnet in $subnets) {
    for ($i = 1; $i -le 254; $i++) {
        $targetIp = "$subnet.$i"
        $powershell = [PowerShell]::Create().AddScript($scriptBlock).AddArgument($targetIp).AddArgument($ports).AddArgument($foundDevices)
        $powershell.RunspacePool = $pool
        $asyncResult = $powershell.BeginInvoke()
        
        $jobs.Add([PSCustomObject]@{
            PowerShell  = $powershell
            AsyncResult = $asyncResult
        })
    }
}

# Esperar a que todos terminen
Write-Host "Progreso: Esperando respuestas..." -ForegroundColor Gray
$startTime = Get-Date
while ($true) {
    $pending = $jobs | Where-Object { -not $_.AsyncResult.IsCompleted }
    if ($pending.Count -eq 0 -or ((Get-Date) - $startTime).TotalSeconds -gt 20) {
        break
    }
    Start-Sleep -Milliseconds 200
}

# Limpiar Runspaces
foreach ($job in $jobs) {
    $job.PowerShell.EndInvoke($job.AsyncResult)
    $job.PowerShell.Dispose()
}
$pool.Close()
$pool.Dispose()

# Mostrar resultados
Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "             RESULTADOS DEL ESCANEO" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

if ($foundDevices.Count -eq 0) {
    Write-Host "No se encontraron dispositivos IP activos en los puertos habituales de camaras." -ForegroundColor Red
    Write-Host "Sugerencia: Verifique que las camaras esten en el mismo rango de red o use una IP estatica temporal." -ForegroundColor Yellow
} else {
    # Agrupar por IP para una lectura limpia
    $grouped = $foundDevices | Group-Object IP
    foreach ($group in $grouped) {
        $portsList = ($group.Group | ForEach-Object { "$($_.Port) ($($_.Service))" }) -join ", "
        Write-Host " [+] IP Encontrada: $($group.Name)" -ForegroundColor Green
        Write-Host "     Puertos activos: $portsList" -ForegroundColor White
        
        # Si es Dahua (puerto 37777 abierto) o RTSP (554), destacarla
        if ($portsList -match "37777" -or $portsList -match "554") {
            Write-Host "     >>> Detectada como CAMARA IP / NVR Dahua o compatible" -ForegroundColor Yellow
        }
        Write-Host "----------------------------------------------------" -ForegroundColor Gray
    }
}

Write-Host "`nPresione cualquier tecla para salir..." -ForegroundColor Yellow
pause
