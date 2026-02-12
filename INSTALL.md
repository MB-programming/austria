# طريقة تشغيل وبناء التطبيق

## المتطلبات

- **Node.js** نسخة 18 أو أحدث → https://nodejs.org
- **Git** (اختياري)

---

## تشغيل التطبيق (للتجربة)

```bash
# 1. تثبيت الـ packages
npm install

# 2. تشغيل التطبيق مباشرة
npm start
```

---

## بناء تطبيق Desktop

### على Mac (ينتج DMG)
```bash
npm install
npm run build:mac
```
الملف هيكون في: `dist/Austria Appointment Bot-1.0.0.dmg`

### على Windows (ينتج EXE Installer)
```bash
npm install
npm run build:win
```
الملف هيكون في: `dist/Austria Appointment Bot Setup 1.0.0.exe`

### بناء الاثنين معاً (من Mac فقط)
```bash
npm install
npm run build:all
```

---

## ملاحظات مهمة

| البيئة | الحفظ | الأتمتة |
|--------|-------|---------|
| Desktop (بعد `npm start` أو بعد البناء) | electron-store | كاملة ✅ |
| متصفح عادي (Hostinger/web) | localStorage | عرض فقط ❌ |

**الأتمتة الكاملة (ملء الفورم + حل الكابتشا + التنقل التلقائي) تشتغل فقط في نسخة Desktop.**

---

## مشاكل شائعة

### خطأ `electron: command not found`
```bash
npm install -g electron
```

### خطأ في البناء على Windows بخصوص Python/Visual C++
```bash
npm install --global windows-build-tools
```
