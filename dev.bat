@echo off
echo Iniciando AVI Smart...

:: Reiniciar adb
C:\Users\FranX\Downloads\platform-tools\adb.exe kill-server
C:\Users\FranX\Downloads\platform-tools\adb.exe start-server

:: Esperar que detecte el dispositivo
timeout /t 3 /nobreak >nul

:: Reverse por USB
C:\Users\FranX\Downloads\platform-tools\adb.exe -s 105074035T000067 reverse tcp:8081 tcp:8081

:: Abrir app
C:\Users\FranX\Downloads\platform-tools\adb.exe -s 105074035T000067 shell am start -a android.intent.action.VIEW -d "exp+avi://expo-development-client/?url=http%%3A%%2F%%2F127.0.0.1%%3A8081" com.franx_dev.avi

echo Listo!
pause