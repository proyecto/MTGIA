# Guía: Usar Emulador Android (Headless)

Esta guía explica cómo iniciar y usar el emulador de Android configurado en este proyecto.

## 🚀 Iniciar el Emulador

Para iniciar el emulador (Pixel 6 con Android 13):

```bash
# 1. Cargar variables de entorno
source ~/.zshrc

# 2. Iniciar emulador (se abrirá una ventana)
$ANDROID_HOME/emulator/emulator -avd Pixel_6_API_33 -netdelay none -netspeed full
```

## 📲 Instalar/Actualizar App

Una vez que el emulador esté corriendo:

```bash
# Instalar el APK generado
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```

## 🛠️ Comandos Útiles

```bash
# Ver dispositivos conectados
adb devices

# Ver logs del dispositivo (útil para debug)
adb logcat | grep "com.mtgcollectionmanager"

# Desinstalar la app
adb uninstall com.mtgcollectionmanager.app
```

## 📱 Detalles del Dispositivo Virtual

- **Nombre AVD**: `Pixel_6_API_33`
- **Dispositivo**: Pixel 6
- **Sistema**: Android 13 (API 33)
- **Arquitectura**: arm64-v8a (Nativo para Apple Silicon)
