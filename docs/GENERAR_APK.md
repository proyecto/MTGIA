# Guía: Generar APK Android (Método "Headless")

Esta guía documenta cómo se configuró el entorno y se generó el APK sin instalar Android Studio completo.

## 🛠️ Entorno Configurado

Se ha configurado un entorno de desarrollo Android "headless" (sin interfaz gráfica) en tu máquina:

- **Java JDK 17**: Instalado vía Homebrew (`/opt/homebrew/opt/openjdk@17`)
- **Android SDK**: Instalado en `~/android-sdk`
- **Android NDK**: Versión 25.2.9519653
- **Variables de Entorno**: Configuradas en `~/.zshrc`

## 📱 Generar Nuevas Versiones

Para generar una nueva versión del APK en el futuro, solo necesitas ejecutar:

```bash
# 1. Cargar variables de entorno (si acabas de abrir la terminal)
source ~/.zshrc

# 2. Ir al directorio del proyecto
cd /Users/rafaelruizlopez/Documents/proyectos/MTGIA

# 3. Compilar APK (Debug - Recomendado para pruebas)
npm run tauri android build -- --debug

# O Compilar APK (Release - Para distribución)
# Nota: Requiere firmar el APK manualmente después
npm run tauri android build
```

## 📍 Ubicación del APK

El archivo APK generado se encuentra en:

```
src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```

Para abrir la carpeta en Finder:
```bash
open src-tauri/gen/android/app/build/outputs/apk/universal/debug/
```

## 📲 Cómo Instalar en tu Móvil

1. **Transferir el archivo**:
   - Envía el archivo `app-universal-debug.apk` a tu móvil (USB, Google Drive, Telegram, etc.)

2. **Instalar**:
   - Abre el archivo en tu móvil.
   - Si te pregunta, permite "Instalar de fuentes desconocidas".
   - Pulsa "Instalar".

## ⚠️ Nota sobre el Tamaño

El APK actual es "Universal" (incluye código para todas las arquitecturas: ARM64, ARM32, x86) y está en modo Debug, por lo que su tamaño es grande (~800MB).
Para producción, se puede optimizar generando APKs específicos por arquitectura (App Bundle) y usando modo release con `minifyEnabled`.
