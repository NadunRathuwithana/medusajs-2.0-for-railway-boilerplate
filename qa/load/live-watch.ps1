# Live canary: 1 request per 10 seconds to LIVE (home page + API health), printing latency.
# Run in a SECOND PowerShell window while a dev load test runs. This is NOT a load test.
# Press Ctrl+C when live latency climbs or you see any non-200.
param(
  [string]$HomeUrl = "https://cardle.lk/lk",
  [string]$Api  = "https://api.cardle.lk/health",
  [int]$EverySeconds = 10,
  [int]$WarnMs = 1500
)
function Probe($url) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  try { $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20; $code = [int]$r.StatusCode }
  catch { $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 } }
  $sw.Stop()
  [pscustomobject]@{ Code = $code; Ms = [int]$sw.ElapsedMilliseconds }
}
Write-Host "Baseline first: run this for 2 minutes BEFORE starting k6 and note the typical ms."
while ($true) {
  $h = Probe $HomeUrl; $a = Probe $Api
  $bad = ($h.Code -ne 200) -or ($a.Code -ne 200) -or ($h.Ms -gt $WarnMs) -or ($a.Ms -gt $WarnMs)
  $line = "{0}  home {1} {2}ms   api {3} {4}ms" -f (Get-Date -Format HH:mm:ss), $h.Code, $h.Ms, $a.Code, $a.Ms
  if ($bad) { Write-Host "$line   <-- STOP THE TEST" -ForegroundColor Red; [console]::beep(1000,300) } else { Write-Host $line }
  Start-Sleep -Seconds $EverySeconds
}
