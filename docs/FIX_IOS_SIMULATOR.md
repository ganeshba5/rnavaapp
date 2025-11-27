# Fix: No iOS Devices Available in Simulator

## Problem
You're seeing: `CommandError: No iOS devices available in Simulator.app`

This means Xcode is installed but no iOS Simulator runtimes are downloaded.

## Solution

### Option 1: Install via Xcode (Recommended)

1. **Open Xcode**
   ```bash
   open -a Xcode
   ```

2. **Go to Settings**
   - Click **Xcode** in menu bar → **Settings** (or **Preferences** in older versions)
   - Click **Platforms** tab (or **Components** in older versions)

3. **Download iOS Simulator**
   - You'll see a list of available iOS versions
   - Click the **Download** button (⬇️) next to the latest iOS version (e.g., iOS 18.0)
   - Wait for download to complete (this can take 10-30 minutes depending on your internet)

4. **Verify Installation**
   ```bash
   xcrun simctl list runtimes
   ```
   You should see iOS runtimes listed.

5. **Create a Simulator**
   - Open Xcode
   - Go to **Window → Devices and Simulators**
   - Click the **+** button
   - Choose a device (e.g., iPhone 15)
   - Choose the iOS version you just downloaded
   - Click **Create**

### Option 2: Install via Command Line

```bash
# List available runtimes to download
xcodebuild -downloadPlatform iOS

# Or use xcode-select to install
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Option 3: Quick Fix - Use Web or Physical Device

While you're setting up iOS Simulator, you can use:

**Web Browser (Works Immediately):**
```bash
cd AvaApp
npm run web
```

**Physical iPhone/iPad with Expo Go:**
1. Install "Expo Go" from App Store on your device
2. Run `npm start`
3. Scan QR code with Expo Go app

## Verify Simulator is Working

After installing iOS runtime:

```bash
# List available simulators
xcrun simctl list devices

# Start a simulator manually
open -a Simulator

# Or let Expo handle it
cd AvaApp
npm run ios
```

## Alternative: Use Android Emulator

If iOS setup is taking too long, you can use Android:

1. Install Android Studio: https://developer.android.com/studio
2. Create an AVD (Android Virtual Device)
3. Run: `npm run android`

