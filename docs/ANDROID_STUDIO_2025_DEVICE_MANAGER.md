# Finding Device Manager in Android Studio 2025.2.1

In Android Studio 2025.2.1, the Device Manager location has changed.

## Method 1: From Welcome Screen

1. **Open Android Studio**
2. If you see the **Welcome Screen**:
   - Look for **More Actions** button (bottom right)
   - Click **More Actions → Virtual Device Manager**
   - Or click **Device Manager** icon in the sidebar

## Method 2: From Project View

1. **Open any project** (or create a new one)
2. Look for the **Device Manager** icon in the **right sidebar** (toolbar area)
   - It looks like a phone/tablet icon
   - Usually located near the top right of the window

## Method 3: Via Menu (New Location)

1. **Go to menu bar**
2. Try these locations:
   - **View → Tool Windows → Device Manager**
   - **Tools → Device Manager** (if available)
   - **Window → Device Manager** (on some versions)

## Method 4: Keyboard Shortcut

- Press **Shift + Cmd + A** (Mac) to open "Find Action"
- Type "Device Manager"
- Select it from the list

## Method 5: Settings/Preferences

1. **Android Studio → Settings** (or **Preferences** on Mac)
2. Look for **Appearance & Behavior → System Settings**
3. Check for **Device Manager** or **Virtual Device** options

## Alternative: Use Command Line

If you can't find it in the UI, you can create an AVD via command line:

```bash
# List available system images
sdkmanager --list | grep "system-images"

# Create AVD via command line (after SDK is installed)
avdmanager create avd -n Pixel_5_API_33 -k "system-images;android-33;google_apis;x86_64"
```

## Visual Guide for Android Studio 2025.2.1

The Device Manager is typically found in one of these locations:

1. **Right Sidebar** - Look for a phone/tablet icon
2. **Bottom Toolbar** - Device Manager tab
3. **Welcome Screen** - "More Actions" → "Virtual Device Manager"
4. **Menu Bar** - View → Tool Windows → Device Manager

## If Still Can't Find It

1. **Check if Android Emulator is installed**:
   - Go to **Tools → SDK Manager**
   - **SDK Tools** tab
   - Make sure **Android Emulator** is checked and installed

2. **Restart Android Studio** after installing emulator

3. **Update Android Studio** to latest version if needed

## Quick Test: Check if SDK is Installed

```bash
# Check if SDK exists
ls ~/Library/Android/sdk

# Check if emulator exists
ls ~/Library/Android/sdk/emulator

# List available AVDs (if any exist)
emulator -list-avds
```

