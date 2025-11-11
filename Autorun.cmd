@echo off
setlocal

:: Step 1: Check if caddy.exe exists
if exist caddy.exe (
    echo caddy.exe found.
) else (
    echo caddy.exe not found. Downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://caddyserver.com/api/download?os=windows&arch=amd64' -OutFile 'caddy_windows_amd64.exe'"
    if exist caddy_windows_amd64.exe (
        echo Download successful. Renaming file...
        ren caddy_windows_amd64.exe caddy.exe
    ) else (
        echo ERROR: Download failed.
        pause
        exit /b 1
    )
)

:: Step 2: Run caddy file server
echo Starting Caddy file server on port 80...
start "" caddy.exe file-server --listen :80 --root .

:: Step 3: Open localhost in browser
timeout /t 3 >nul
start http://localhost

endlocal
