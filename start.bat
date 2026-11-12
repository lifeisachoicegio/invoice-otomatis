@echo off
title HypeZone Studio Invoice - Launcher
echo ===================================================
echo HYPEZONE STUDIO INVOICE MANAGEMENT SYSTEM
echo Menyalakan Server API dan Dashboard Frontend...
echo ===================================================
echo.

:: Tutup instance lama jika masih ada di port 5000 / 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul

echo Menjalankan Backend API (Port 5000)...
start "HypeZone Backend [Port 5000]" cmd /k "cd /d "%~dp0server" && npx tsx src/server.ts"

ping 127.0.0.1 -n 3 >nul

echo Menjalankan Frontend Web Client (Port 3000)...
start "HypeZone Frontend [Port 3000]" cmd /k "cd /d "%~dp0client" && npx vite --port 3000 --host"

ping 127.0.0.1 -n 3 >nul

echo.
echo ===================================================
echo Sistem Berhasil Dijalankan!
echo Buka browser pada URL:
echo http://localhost:3000
echo ===================================================
echo.
echo Membuka aplikasi di browser...
start http://localhost:3000

echo Tekan sembarang tombol untuk menutup jendela launcher ini (Server tetap berjalan di latar belakang).
pause >nul
