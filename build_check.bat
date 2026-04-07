@echo off
set PATH=c:\Users\Capacitacion - QRO\Desktop\Capacitación\Nuevo\NODE JS;%PATH%
cd /d "c:\Users\Capacitacion - QRO\Desktop\Capacitación\Nuevo"
npm run build > build_output.txt 2>&1
echo Exit code: %ERRORLEVEL% >> build_output.txt
