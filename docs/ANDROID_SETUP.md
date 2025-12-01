# Android Development Environment Setup (macOS)

## Prerequisites Status

Based on environment check:
- ❌ Java JDK not installed
- ❌ Android SDK not configured
- ❌ Android NDK not configured
- ✅ Rust installed (Android targets available)

## Installation Steps

### 1. Install Java JDK 17+

Using Homebrew (recommended):
```bash
brew install openjdk@17
```

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"
```

Reload shell:
```bash
source ~/.zshrc
```

Verify:
```bash
java -version
```

### 2. Install Android Studio (Easiest Method)

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
4. Install:
   - Android SDK Platform 33 (or latest)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
5. Go to SDK Tools tab and install:
   - NDK (Side by side) - version 25.c or later
   - CMake

### 3. Configure Environment Variables

Add to `~/.zshrc` or `~/.bash_profile`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Android NDK (adjust version number as needed)
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export PATH=$PATH:$ANDROID_NDK_HOME
```

Reload shell:
```bash
source ~/.zshrc
```

Verify:
```bash
echo $ANDROID_HOME
echo $ANDROID_NDK_HOME
adb --version
```

### 4. Install Rust Android Targets

```bash
# Install Android targets for Rust
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### 5. Install Tauri CLI with Mobile Support

```bash
# Already installed, but ensure it's the latest version
npm install --save-dev @tauri-apps/cli@latest
```

### 6. Initialize Tauri Android Project

```bash
# From project root
npm run tauri android init
```

This will:
- Create `src-tauri/gen/android` directory
- Generate Android project files
- Set up Gradle configuration

## Verification

After installation, verify everything:

```bash
# Check Java
java -version

# Check Android SDK
echo $ANDROID_HOME
ls $ANDROID_HOME

# Check Android NDK
echo $ANDROID_NDK_HOME
ls $ANDROID_NDK_HOME

# Check Rust targets
rustup target list --installed | grep android

# Check Tauri CLI
npm run tauri --version
```

## Alternative: Command-line Only Installation

If you don't want Android Studio:

```bash
# Install command-line tools only
brew install --cask android-commandlinetools

# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk
mkdir -p $ANDROID_HOME

# Install SDK components
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
sdkmanager "ndk;25.2.9519653"
```

## Troubleshooting

### "Unable to locate a Java Runtime"
- Ensure Java is installed: `brew install openjdk@17`
- Set JAVA_HOME correctly in shell profile
- Reload shell: `source ~/.zshrc`

### "ANDROID_HOME not set"
- Add export to `~/.zshrc`
- Verify path exists: `ls $ANDROID_HOME`
- Reload shell

### "NDK not found"
- Install via Android Studio SDK Manager
- Or use: `sdkmanager "ndk;25.2.9519653"`
- Set ANDROID_NDK_HOME to correct version path

### Rust target installation fails
- Update rustup: `rustup update`
- Try installing targets one by one

## Next Steps

Once environment is set up:
1. Run `npm run tauri android init` to initialize Android project
2. Run `npm run tauri android dev` to test on emulator
3. Run `npm run tauri android build` to create APK

## Estimated Setup Time

- With Android Studio: ~30-45 minutes (including downloads)
- Command-line only: ~15-20 minutes
