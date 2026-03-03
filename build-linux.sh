#!/bin/bash
# Script لبناء تطبيق Orbtasoft Automation لنظام Linux
# يقوم بتثبيت Dependencies وبناء كل الحزم

set -e  # توقف عند أي خطأ

echo "🚀 بدء بناء تطبيق Orbtasoft Automation..."
echo ""

# 1. تثبيت Dependencies
echo "📦 [1/3] تثبيت Dependencies..."
npm install
echo "✅ Dependencies تم تثبيتها بنجاح!"
echo ""

# 2. بناء الحزم
echo "🔨 [2/3] بناء الحزم..."
echo "   - AppImage (يعمل على أي Linux)"
echo "   - .deb (Ubuntu, Debian, Kali)"
echo "   - .tar.gz (نسخة محمولة)"
echo ""

# بناء AppImage, deb, tar.gz (بدون snap و rpm لأنهم محتاجين dependencies إضافية)
npm run build:linux:deb 2>&1 | grep -E "•|✓|⨯|building|file=" || true

# محاولة بناء AppImage إذا لم يتم بناؤه مع .deb
if [ ! -f "dist/Orbtasoft Automation-1.0.0.AppImage" ]; then
    echo ""
    echo "🔨 بناء AppImage..."
    electron-builder --linux AppImage --x64 2>&1 | grep -E "•|✓|⨯|building|file=" || true
fi

echo ""
echo "✅ [3/3] البناء اكتمل!"
echo ""

# عرض الملفات المبنية
echo "📂 الملفات الجاهزة في dist/:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh dist/*.{AppImage,deb,tar.gz} 2>/dev/null | awk '{printf "   %-12s %s\n", $5, $9}' | sed 's|dist/|   📦 |g' || echo "   ❌ لا توجد ملفات"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# تعليمات الاستخدام
echo "📖 كيفية الاستخدام:"
echo ""
echo "   🔹 على Kali/Ubuntu/Debian:"
echo "      sudo dpkg -i dist/orbtasoft-automation_1.0.0_amd64.deb"
echo ""
echo "   🔹 AppImage (أي Linux):"
echo "      chmod +x dist/Orbtasoft*.AppImage"
echo "      ./dist/Orbtasoft*.AppImage"
echo ""
echo "   🔹 tar.gz (محمولة):"
echo "      tar -xzf dist/orbtasoft-automation-1.0.0.tar.gz"
echo "      cd orbtasoft-automation-1.0.0/"
echo "      ./orbtasoft-automation"
echo ""
echo "🎉 تم بنجاح! استمتع بالتطبيق"
