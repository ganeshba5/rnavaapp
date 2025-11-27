#!/bin/bash
# Android SDK Environment Setup Script for macOS
# Run this after installing Android Studio

echo "Setting up Android SDK environment variables..."

# Determine shell config file
if [ -f ~/.zshrc ]; then
    CONFIG_FILE=~/.zshrc
    echo "Using ~/.zshrc"
elif [ -f ~/.bash_profile ]; then
    CONFIG_FILE=~/.bash_profile
    echo "Using ~/.bash_profile"
else
    CONFIG_FILE=~/.zshrc
    echo "Creating ~/.zshrc"
    touch ~/.zshrc
fi

# Check if already configured
if grep -q "ANDROID_HOME" "$CONFIG_FILE"; then
    echo "⚠️  Android SDK environment variables already exist in $CONFIG_FILE"
    echo "Skipping configuration. If you need to update, edit the file manually."
else
    # Add Android SDK configuration
    cat >> "$CONFIG_FILE" << 'EOF'

# Android SDK Configuration
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
EOF

    echo "✅ Added Android SDK configuration to $CONFIG_FILE"
    echo ""
    echo "To apply changes, run:"
    echo "  source $CONFIG_FILE"
    echo ""
    echo "Or restart your terminal."
fi

# Check if Android SDK exists
if [ -d "$HOME/Library/Android/sdk" ]; then
    echo "✅ Android SDK found at: $HOME/Library/Android/sdk"
else
    echo "⚠️  Android SDK not found at: $HOME/Library/Android/sdk"
    echo "Please install Android Studio first:"
    echo "  1. Download from: https://developer.android.com/studio"
    echo "  2. Install Android Studio"
    echo "  3. Open Android Studio → Tools → SDK Manager"
    echo "  4. Install Android SDK Platform and Tools"
    echo "  5. Run this script again"
fi

