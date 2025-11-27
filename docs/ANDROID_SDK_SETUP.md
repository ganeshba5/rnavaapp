# Android SDK Setup Guide for macOS

This guide will help you install Android SDK and set up Android emulator for Expo development.

## Step 1: Download Android Studio

1. **Go to Android Studio website**
   - Visit: https://developer.android.com/studio
   - Click **Download Android Studio**

2. **Download for Mac**
   - The file will be: `android-studio-*.dmg`
   - File size: ~1GB

## Step 2: Install Android Studio

1. **Open the .dmg file**
   - Double-click the downloaded file
   - Drag **Android Studio** to **Applications** folder

2. **Launch Android Studio**
   - Open Applications folder
   - Double-click **Android Studio**
   - If you see a security warning, go to **System Settings → Privacy & Security** and click **Open Anyway**

3. **Complete Setup Wizard**
   - Choose **Standard** installation (recommended)
   - Click **Next** through the wizard
   - Accept all licenses when prompted
   - Let it download SDK components (this takes 10-20 minutes)

## Step 3: Install Android SDK Components

1. **Open SDK Manager**
   - In Android Studio, go to **Tools → SDK Manager**
   - Or click **More Actions → SDK Manager** from welcome screen

2. **Install Required Components**
   - **SDK Platforms** tab:
     - Check **Android 13.0 (Tiramisu)** - API Level 33 (or latest)
     - Check **Android 12.0 (S)** - API Level 31 (optional but recommended)
   - **SDK Tools** tab:
     - Check **Android SDK Build-Tools**
     - Check **Android SDK Command-line Tools**
     - Check **Android SDK Platform-Tools**
     - Check **Android Emulator**
     - Check **Intel x86 Emulator Accelerator (HAXM installer)** (if on Intel Mac)
   - Click **Apply** and wait for installation

## Step 4: Set Environment Variables

The Android SDK needs to be in your PATH. Add these to your shell configuration file.

### For Zsh (macOS default since Catalina):

1. **Open your zsh config file**
   ```bash
   nano ~/.zshrc
   ```
   
   Or if you prefer:
   ```bash
   open -e ~/.zshrc
   ```

2. **Add these lines at the end of the file:**
   ```bash
   # Android SDK
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

3. **Save and reload**
   ```bash
   # Save (if using nano: Ctrl+O, Enter, Ctrl+X)
   # Then reload:
   source ~/.zshrc
   ```

### For Bash (if you're using bash):

1. **Open your bash config file**
   ```bash
   nano ~/.bash_profile
   ```

2. **Add the same lines as above**

3. **Save and reload**
   ```bash
   source ~/.bash_profile
   ```

## Step 5: Verify Installation

1. **Check ANDROID_HOME is set**
   ```bash
   echo $ANDROID_HOME
   ```
   Should output: `/Users/your-username/Library/Android/sdk`

2. **Check adb (Android Debug Bridge)**
   ```bash
   adb version
   ```
   Should show version number

3. **Check emulator**
   ```bash
   emulator -version
   ```
   Should show emulator version

## Step 6: Create an Android Virtual Device (AVD)

1. **Open AVD Manager**
   - In Android Studio: **Tools → Device Manager**
   - Or from welcome screen: **More Actions → Virtual Device Manager**

2. **Create Device**
   - Click **Create Device** button
   - Choose a device (e.g., **Pixel 5** or **Pixel 6**)
   - Click **Next**

3. **Select System Image**
   - Choose **Android 13.0 (Tiramisu)** - API Level 33
   - If not downloaded, click **Download** next to it
   - Click **Next**

4. **Configure AVD**
   - Name: Keep default or change (e.g., "Pixel_5_API_33")
   - Verify settings look good
   - Click **Finish**

## Step 7: Test Android Emulator

1. **Start Emulator**
   - In Device Manager, click the ▶️ play button next to your AVD
   - Wait for emulator to boot (first time takes 2-3 minutes)

2. **Test with Expo**
   ```bash
   cd "/Users/ganeshb/Library/CloudStorage/OneDrive-VERITECHINFOSYSTEMSPVTLTD/Macair Documents/Cursor AI/RNAva/AvaApp"
   npm start
   # Then press 'a' to open Android emulator
   ```

   Or directly:
   ```bash
   npm run android
   ```

## Troubleshooting

### Problem: "ANDROID_HOME is not set"

**Solution:**
1. Make sure you added the export lines to `~/.zshrc` or `~/.bash_profile`
2. Reload your shell: `source ~/.zshrc`
3. Verify: `echo $ANDROID_HOME`

### Problem: "adb: command not found"

**Solution:**
1. Check if platform-tools is installed in SDK Manager
2. Verify PATH includes `$ANDROID_HOME/platform-tools`
3. Reload shell: `source ~/.zshrc`

### Problem: "emulator: command not found"

**Solution:**
1. Check if Android Emulator is installed in SDK Manager
2. Verify PATH includes `$ANDROID_HOME/emulator`
3. Reload shell: `source ~/.zshrc`

### Problem: Emulator is very slow

**Solutions:**
1. **Enable Hardware Acceleration**
   - In AVD settings, enable "Hardware - GLES 2.0"
   - Use "Automatic" graphics option

2. **Increase RAM**
   - Edit AVD → Show Advanced Settings
   - Increase RAM to 2048 MB or 4096 MB

3. **Use x86_64 system image** (faster than ARM)

### Problem: "HAXM not installed" (Intel Macs)

**Solution:**
1. Install HAXM from SDK Manager → SDK Tools
2. Or download from: https://github.com/intel/haxm/releases
3. Install the .pkg file

### Problem: "No emulators found"

**Solution:**
1. Make sure you created an AVD in Device Manager
2. List available emulators: `emulator -list-avds`
3. Start manually: `emulator -avd YourAVDName`

## Quick Commands Reference

```bash
# Check Android SDK location
echo $ANDROID_HOME

# List installed AVDs
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_33

# Check adb devices
adb devices

# Restart adb server
adb kill-server
adb start-server

# Check SDK components
sdkmanager --list
```

## Alternative: Use Physical Android Device

If emulator setup is complex, you can use a physical device:

1. **Enable Developer Options** on your Android device:
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
   - Go back to **Settings → Developer Options**
   - Enable **USB Debugging**

2. **Connect device via USB**
   - Connect phone to Mac
   - Accept USB debugging prompt on phone

3. **Test with Expo**
   ```bash
   npm start
   # Scan QR code with Expo Go app
   ```

## Next Steps

Once Android SDK is set up:

1. **Start Expo**
   ```bash
   cd AvaApp
   npm start
   ```

2. **Press 'a'** to launch Android emulator

3. **Or use physical device** with Expo Go app

## System Requirements

- **macOS 10.14 (Mojave)** or later
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Android SDK
- **Java Development Kit (JDK)** - comes with Android Studio

## Additional Resources

- Android Studio Docs: https://developer.android.com/studio
- Android Emulator Guide: https://developer.android.com/studio/run/emulator
- Expo Android Guide: https://docs.expo.dev/workflow/android-studio-emulator/

