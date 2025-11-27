# Create Android Virtual Device (AVD) via Command Line

If you can't find Device Manager in Android Studio UI, you can create an AVD using command line.

## Prerequisites

1. Android SDK must be installed
2. Environment variables must be set (run `setup-android-env.sh`)

## Step 1: Check Available System Images

```bash
# List all available system images
sdkmanager --list | grep "system-images"
```

You should see something like:
```
system-images;android-33;google_apis;x86_64
system-images;android-33;google_apis_playstore;x86_64
```

## Step 2: Install a System Image (if needed)

```bash
# Install Android 13 (API 33) system image
sdkmanager "system-images;android-33;google_apis;x86_64"
```

## Step 3: Create AVD

```bash
# Create a Pixel 5 AVD with Android 13
avdmanager create avd \
  -n Pixel_5_API_33 \
  -k "system-images;android-33;google_apis;x86_64" \
  -d "pixel_5"
```

If "pixel_5" device definition doesn't exist, use:

```bash
# Create AVD without specific device definition
avdmanager create avd \
  -n Pixel_5_API_33 \
  -k "system-images;android-33;google_apis;x86_64"
```

When prompted:
- **Do you wish to create a custom hardware profile?** → Type `no` and press Enter
- **Android Virtual Device will be created** → Press Enter

## Step 4: Verify AVD was Created

```bash
# List all AVDs
emulator -list-avds
```

You should see: `Pixel_5_API_33`

## Step 5: Start the Emulator

```bash
# Start the emulator
emulator -avd Pixel_5_API_33 &
```

Or let Expo handle it:
```bash
cd AvaApp
npm run android
```

## Alternative: Use Default AVD Creation

If the above doesn't work, try this simpler approach:

```bash
# Create AVD interactively
avdmanager create avd -n MyAVD -k "system-images;android-33;google_apis;x86_64"
```

Follow the prompts to configure the device.

## Troubleshooting

**Problem: "sdkmanager: command not found"**
- Make sure you've run `setup-android-env.sh`
- Reload shell: `source ~/.zshrc`
- Check: `echo $ANDROID_HOME`

**Problem: "avdmanager: command not found"**
- Same as above - check environment variables

**Problem: "No system images installed"**
- Install via: `sdkmanager "system-images;android-33;google_apis;x86_64"`

**Problem: "Device definition not found"**
- Use the simpler command without `-d` parameter
- Or list available devices: `avdmanager list device`

## Quick Reference

```bash
# List system images
sdkmanager --list | grep "system-images"

# Install system image
sdkmanager "system-images;android-33;google_apis;x86_64"

# List device definitions
avdmanager list device

# Create AVD
avdmanager create avd -n MyAVD -k "system-images;android-33;google_apis;x86_64"

# List AVDs
emulator -list-avds

# Start AVD
emulator -avd MyAVD
```

