# Setting Up Expo Simulators on macOS

This guide will help you set up iOS and Android simulators for Expo development on your Mac.

## Prerequisites

1. **Node.js** (v18 or later recommended)
   - Check if installed: `node --version`
   - Download from: https://nodejs.org/

2. **npm or yarn**
   - Usually comes with Node.js
   - Check: `npm --version`

3. **Expo CLI**
   - Install globally: `npm install -g expo-cli` (optional, Expo Go app works too)

## iOS Simulator Setup

### Option 1: Using Xcode (Recommended for iOS)

1. **Install Xcode from Mac App Store**
   - Open App Store
   - Search for "Xcode"
   - Install (this is large, ~15GB, takes time)

2. **Install Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```
   - If prompted, click "Install"

3. **Accept Xcode License**
   ```bash
   sudo xcodebuild -license accept
   ```

4. **Install iOS Simulator**
   - Open Xcode
   - Go to **Xcode → Settings → Platforms** (or **Components** in older versions)
   - Download iOS Simulator for your desired iOS version

5. **Start iOS Simulator**
   ```bash
   # From your project directory
   cd AvaApp
   npx expo start
   # Then press 'i' to open iOS simulator
   ```

   Or manually:
   ```bash
   open -a Simulator
   ```

### Option 2: Using Expo Go App (Easier, but limited)

1. **Install Expo Go from App Store**
   - Search "Expo Go" in App Store
   - Install on your iPhone/iPad

2. **Run Expo**
   ```bash
   cd AvaApp
   npx expo start
   ```
   - Scan QR code with your device's camera
   - Or use the Expo Go app to scan

## Android Emulator Setup

### Option 1: Using Android Studio (Recommended)

1. **Download Android Studio**
   - Go to: https://developer.android.com/studio
   - Download for Mac
   - Install the .dmg file

2. **Install Android Studio**
   - Drag Android Studio to Applications
   - Open Android Studio
   - Complete the setup wizard:
     - Choose "Standard" installation
     - Accept licenses
     - Let it download SDK components

3. **Create an Android Virtual Device (AVD)**
   - Open Android Studio
   - Click **More Actions → Virtual Device Manager** (or **Tools → AVD Manager**)
   - Click **Create Device**
   - Choose a device (e.g., Pixel 5)
   - Choose a system image (e.g., Android 13 - API 33)
   - Click **Finish**

4. **Start Android Emulator**
   ```bash
   # From your project directory
   cd AvaApp
   npx expo start
   # Then press 'a' to open Android emulator
   ```

   Or manually:
   - Open Android Studio
   - Go to **Tools → Device Manager**
   - Click the ▶️ play button next to your AVD

### Option 2: Using Expo Go App (Easier)

1. **Install Expo Go from Google Play Store**
   - Search "Expo Go" in Play Store
   - Install on your Android device

2. **Run Expo**
   ```bash
   cd AvaApp
   npx expo start
   ```
   - Scan QR code with Expo Go app
   - Or use the Expo Go app to scan

## Quick Start Commands

### Start Expo Development Server

```bash
cd AvaApp
npx expo start
```

### Platform-Specific Commands

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web Browser
npx expo start --web
```

### Keyboard Shortcuts (when Expo is running)

- `i` - Open iOS simulator
- `a` - Open Android emulator
- `w` - Open web browser
- `r` - Reload app
- `m` - Toggle menu
- `j` - Open debugger

## Troubleshooting

### iOS Simulator Issues

**Problem: "xcrun: error: unable to find utility 'simctl'"**
```bash
# Solution: Reinstall Xcode Command Line Tools
sudo xcode-select --reset
xcode-select --install
```

**Problem: Simulator won't start**
```bash
# Kill all simulator processes
killall Simulator
# Then restart
open -a Simulator
```

**Problem: "No devices found"**
- Make sure you've installed at least one iOS version in Xcode
- Go to Xcode → Settings → Platforms and download iOS Simulator

### Android Emulator Issues

**Problem: "ANDROID_HOME is not set"**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Then reload
source ~/.zshrc  # or source ~/.bash_profile
```

**Problem: Emulator is slow**
- Increase RAM allocation in AVD settings
- Enable hardware acceleration (HAXM/Intel HAXM)
- Use a lighter system image

**Problem: "adb: command not found"**
```bash
# Install Android SDK Platform Tools
# Or add to PATH (see ANDROID_HOME above)
```

### General Issues

**Problem: Port 8081 already in use**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx expo start --port 8082
```

**Problem: Metro bundler cache issues**
```bash
# Clear cache and restart
npx expo start --clear
```

**Problem: "Unable to resolve module"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
# Or
yarn install
```

## System Requirements

### iOS Simulator
- macOS 10.15 (Catalina) or later
- Xcode 12 or later
- At least 8GB RAM (16GB recommended)
- ~20GB free disk space for Xcode

### Android Emulator
- macOS 10.14 (Mojave) or later
- Android Studio
- At least 8GB RAM (16GB recommended)
- ~10GB free disk space for Android SDK

## Recommended Setup for AVA App

For the AVA app, we recommend:

1. **iOS Simulator** (via Xcode) - Best for testing iOS-specific features
2. **Android Emulator** (via Android Studio) - Best for testing Android-specific features
3. **Expo Go** (on physical device) - Best for testing real-world performance

## Next Steps

Once simulators are set up:

1. **Test the app**
   ```bash
   cd AvaApp
   npx expo start
   ```

2. **Run on iOS**
   - Press `i` or run `npx expo start --ios`

3. **Run on Android**
   - Press `a` or run `npx expo start --android`

4. **Run on Web**
   - Press `w` or run `npx expo start --web`

## Additional Resources

- Expo Documentation: https://docs.expo.dev/
- iOS Simulator Guide: https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device
- Android Emulator Guide: https://developer.android.com/studio/run/emulator
- Expo CLI Reference: https://docs.expo.dev/more/expo-cli/

## Need Help?

If you encounter issues:
1. Check Expo documentation: https://docs.expo.dev/
2. Check Expo forums: https://forums.expo.dev/
3. Check GitHub issues: https://github.com/expo/expo/issues

