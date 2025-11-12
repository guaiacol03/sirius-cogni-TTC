@echo off
setlocal

echo Starting Caddy file server on port 80...
start "" caddy.exe file-server --listen :80 --root .

timeout /t 3 >nul
start http://localhost

endlocal
