@echo off
title ChessMaster Academy
set "PATH=%PATH%;C:\Program Files\nodejs"
cd /d "%~dp0frontend"

echo.
echo   ============================================
echo    ChessMaster Academy is starting...
echo    Your browser will open automatically.
echo.
echo    KEEP THIS WINDOW OPEN while you play.
echo    Close this window to stop the app.
echo   ============================================
echo.

rem Open the browser as soon as the server answers on port 3000
start "" /min powershell -NoProfile -Command "for(;;){try{$c=New-Object Net.Sockets.TcpClient('localhost',3000);$c.Close();break}catch{Start-Sleep -Milliseconds 500}}; Start-Process 'http://localhost:3000'"

npm run dev
