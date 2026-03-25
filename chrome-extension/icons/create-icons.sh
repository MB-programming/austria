#!/bin/bash
# Create simple placeholder icons for Austria Bot Extension

# Colors
RED='#c41e3a'

echo "Creating extension icons..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    convert -size 128x128 xc:"$RED" -pointsize 80 -fill white -gravity center -annotate +0+0 'A' icon128.png
    convert icon128.png -resize 48x48 icon48.png
    convert icon128.png -resize 32x32 icon32.png
    convert icon128.png -resize 16x16 icon16.png
    echo "✅ Icons created successfully!"
else
    echo "⚠️ ImageMagick not found!"
    echo ""
    echo "Install ImageMagick:"
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    echo ""
    echo "Or create icons online:"
    echo "  1. Go to: https://www.favicon-generator.org/"
    echo "  2. Use emoji: 🇦🇹"
    echo "  3. Download sizes: 16, 32, 48, 128"
    echo "  4. Place in this folder"
    exit 1
fi
