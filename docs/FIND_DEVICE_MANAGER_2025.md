# Finding Device Manager in Android Studio 2025.2.1

## Quick Solutions

### Solution 1: Look for Device Manager Icon (Easiest)

1. **Open Android Studio**
2. **Look at the RIGHT side of the window**
3. You should see icons/tabs on the right edge
4. Look for an icon that looks like a **phone or tablet** 📱
5. **Click that icon** - that's Device Manager!

### Solution 2: Use Search (Fastest)

1. **Press `Shift + Cmd + A`** (Mac) or `Shift + Ctrl + A` (Windows/Linux)
2. Type: **"Device Manager"**
3. Select it from the results
4. Device Manager window will open

### Solution 3: From Menu Bar

1. **View → Tool Windows → Device Manager**
   - If you don't see it, try:
   - **Window → Device Manager** (some versions)

### Solution 4: Welcome Screen

1. If you're on the **Welcome Screen**:
   - Look for **"More Actions"** button (usually bottom right)
   - Click it
   - Select **"Virtual Device Manager"** or **"Device Manager"**

### Solution 5: Settings Path

1. **Android Studio → Settings** (Mac) or **File → Settings** (Windows)
2. Navigate to: **Appearance & Behavior → System Settings**
3. Look for **Device Manager** or **Virtual Device** section

## Visual Location Guide

In Android Studio 2025.2.1, Device Manager is typically:

```
┌─────────────────────────────────────────┐
│  File  Edit  View  ...                  │
├─────────────────────────────────────────┤
│                                         │
│  [Project View]    [Editor]    [📱] ← Device Manager icon here
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

The Device Manager icon is usually on the **right sidebar**, near the top.

## If You Still Can't Find It

### Check if Emulator is Installed

1. **Tools → SDK Manager**
2. **SDK Tools** tab
3. Make sure **Android Emulator** is checked ✅
4. If not checked, check it and click **Apply**
5. **Restart Android Studio** after installation

### Alternative: Use Physical Device

While setting up emulator, use a physical Android device:

1. Install **Expo Go** from Google Play Store
2. Enable **USB Debugging** on your device
3. Connect via USB
4. Run `npm start` in your project
5. Scan QR code with Expo Go app

## Quick Test

Once you find Device Manager:

1. Click **Create Device** or **+** button
2. Choose **Pixel 5** or **Pixel 6**
3. Choose **Android 13.0 (Tiramisu)** - API 33
4. Click **Finish**
5. Click the ▶️ play button to start emulator

## Still Having Issues?

Try these:

1. **Update Android Studio** to latest version
2. **Reinstall Android Emulator** via SDK Manager
3. **Restart Android Studio**
4. **Check Android Studio logs**: Help → Show Log in Finder/Explorer

