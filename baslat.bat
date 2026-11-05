@echo off
setlocal EnableDelayedExpansion

title Solution Vault

cd /d "%~dp0"

echo.
echo ============================================================
echo   Solution Vault - Gelistirme Modu
echo ============================================================
echo.

REM --- Node.js yuklu mu? ---
where node >nul 2>&1
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi.
    echo.
    echo Lutfen Node.js 20 veya ustunu yukleyin:
    echo     https://nodejs.org/
    echo.
    echo Kurulumdan sonra bu pencereyi kapatip yeniden calistirin.
    echo.
    pause
    exit /b 1
)

REM --- npm yuklu mu? ---
where npm >nul 2>&1
if errorlevel 1 (
    echo [HATA] npm bulunamadi. Node.js kurulumunuzu kontrol edin.
    echo.
    pause
    exit /b 1
)

REM --- Surumleri yazdir ---
for /f "delims=" %%v in ('node --version') do echo Node.js surumu : %%v
for /f "delims=" %%v in ('npm --version')  do echo npm surumu     : %%v
echo.

REM --- node_modules var mi? Yoksa kur ---
if not exist "node_modules" (
    echo [1/2] Bagimliliklar yuklu degil. npm install calistiriliyor...
    echo       Bu islem ilk seferde birkac dakika surebilir.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [HATA] npm install basarisiz oldu.
        echo.
        echo Onerilen kontroller:
        echo   - Internet baglantiniz var mi?
        echo   - Antivirus/proxy npm'i engelliyor olabilir.
        echo   - "npm cache clean --force" deneyin.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Bagimliliklar yuklendi.
    echo.
) else (
    echo [OK] Bagimliliklar mevcut.
    echo.
)

REM --- Uygulamayi baslat ---
echo [2/2] Uygulama baslatiliyor: npm run dev
echo       Cikmak icin bu pencerede Ctrl+C tuslayin.
echo.
echo ============================================================
echo.

call npm run dev
set EXITCODE=%errorlevel%

echo.
echo ============================================================
if %EXITCODE% NEQ 0 (
    echo Uygulama hata ile kapandi. Cikis kodu: %EXITCODE%
) else (
    echo Uygulama kapatildi.
)
echo ============================================================
echo.
pause
endlocal
