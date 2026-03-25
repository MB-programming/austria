# Extension Icons

Due to the limitations of the command-line environment, icon files need to be created separately. You can use any of these methods:

## Method 1: Use Online Icon Generator
1. Go to https://www.favicon-generator.org/
2. Upload an image or use emoji: 🇦🇹
3. Generate icons in sizes: 16x16, 32x32, 48x48, 128x128
4. Download and place them in this folder

## Method 2: Use Figma/Canva
1. Create a new project with sizes: 16x16, 32x32, 48x48, 128x128
2. Add Austrian flag 🇦🇹 or a custom design
3. Background: Red (#c41e3a) and white
4. Export as PNG
5. Place in this folder

## Method 3: Use ImageMagick (Command Line)
```bash
# Create a simple red icon with 'A' letter
convert -size 128x128 xc:'#c41e3a' -pointsize 80 -fill white -gravity center -annotate +0+0 'A' icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 32x32 icon32.png
convert icon128.png -resize 16x16 icon16.png
```

## Method 4: Use Placeholder Icons (Quick Start)
For testing purposes, you can use simple colored squares:
```bash
# Red squares
convert -size 128x128 xc:'#c41e3a' icon128.png
convert -size 48x48 xc:'#c41e3a' icon48.png
convert -size 32x32 xc:'#c41e3a' icon32.png
convert -size 16x16 xc:'#c41e3a' icon16.png
```

## Required Files:
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

All icons should have a transparent or red background with a white symbol.
