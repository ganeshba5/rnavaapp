# Quick Android SDK Setup

## Current Status
- ❌ Android SDK: Not installed
- ❌ ANDROID_HOME: Not set

## Installation Steps

### 1. Download Android Studio

```bash
# Open download page
open https://developer.android.com/studio
```

Or manually:
- Visit: https://developer.android.com/studio
- Click "Download Android Studio"
- Download the .dmg file (~1GB)

### 2. Install Android Studio

1. **Open the .dmg file** you downloaded
2. **Drag Android Studio to Applications**
3. **Launch Android Studio** from Applications
4. **Complete Setup Wizard**:
   - Choose "Standard" installation
   - Accept licenses
   - Let it download SDK components (10-20 minutes)

### 3. Install SDK Components

1. In Android Studio, go to **Tools → SDK Manager**
2. **SDK Platforms** tab:
   - ✅ Check **Android 13.0 (Tiramisu)** - API 33
   - Click **Apply** and wait for download
3. **SDK Tools** tab:
   - ✅ Check **Android SDK Build-Tools**
   - ✅ Check **Android SDK Platform-Tools**
   - ✅ Check **Android Emulator**
   - Click **Apply**

### 4. Set Environment Variables

After Android Studio installs the SDK, run:

```bash
cd "/Users/ganeshb/Library/CloudStorage/OneDrive-VERITECHINFOSYSTEMSPVTLTD/Macair Documents/Cursor AI/RNAva/AvaApp"
./setup-android-env.sh
```

This will automatically add the required environment variables to your shell config.

Then reload your shell:
```bash
source ~/.zshrc
```

### 5. Verify Installation

```bash
# Check ANDROID_HOME
echo $ANDROID_HOME
# Should show: /Users/your-username/Library/Android/sdk

# Check adb
adb version
# Should show version number
```

### 6. Create Android Virtual Device (AVD)

1. In Android Studio: **Tools → Device Manager**
2. Click **Create Device**
3. Choose **Pixel 5** or **Pixel 6**
4. Choose **Android 13.0 (Tiramisu)** - API 33
5. Click **Finish**

### 7. Test with Expo

```bash
cd "/Users/ganeshb/Library/CloudStorage/OneDrive-VERITECHINFOSYSTEMSPVTLTD/Macair Documents/Cursor AI/RNAva/AvaApp"
npm start
# Press 'a' to open Android emulator
```

## Quick Commands

```bash
# Start Expo with Android
npm run android

# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_33
```

## Troubleshooting

**If ANDROID_HOME is still not set after running setup script:**
1. Make sure Android Studio has installed the SDK
2. Check SDK location: `ls ~/Library/Android/sdk`
3. Manually add to `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/emulator
   ```
4. Reload: `source ~/.zshrc`

## Alternative: Use Physical Device

While setting up emulator, you can use a physical Android device:

1. Install **Expo Go** from Google Play Store
2. Enable **USB Debugging** on your device
3. Connect via USB
4. Run `npm start` and scan QR code

