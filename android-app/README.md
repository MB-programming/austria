# Orbtasoft Automation — Android APK

Capacitor wrapper for the Android version of the app.

## Prerequisites

- Node.js ≥ 18
- Android Studio (for building the APK)
- JDK 17+

## خطوات بناء الـ APK

### 1. تثبيت الـ dependencies

```bash
cd android-app
npm install
```

### 2. مزامنة ملفات الـ UI

```bash
npm run sync
```

يقوم هذا الأمر بـ:
- نسخ `src/renderer/` → `www/`
- إضافة CSS للموبايل
- مزامنة الملفات مع مشروع Android

### 3. فتح Android Studio

```bash
npm run open
```

### 4. بناء الـ APK في Android Studio

1. افتح Android Studio
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. الـ APK موجود في: `android/app/build/outputs/apk/debug/`

---

## ملاحظات

- **الأتمتة الكاملة** (فتح متصفح وحجز تلقائي) تعمل على **Desktop فقط**
- على Android، الـ app يعمل كـ **companion app**: تحفظ الإعدادات والبيانات وتشوف الـ logs
- البيانات محفوظة في `localStorage` على الجهاز
- إذا غيرت الـ UI في `src/renderer/`، شغّل `npm run sync` لتحديث الـ Android

## الملفات

```
android-app/
├── capacitor.config.json   # إعدادات Capacitor
├── sync-www.js             # سكريبت مزامنة ملفات الـ UI
├── package.json
└── android/                # مشروع Android Studio
```
