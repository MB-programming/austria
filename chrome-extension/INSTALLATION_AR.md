# 📦 دليل التثبيت - Austria Bot Extension

## 🎯 خطوات التثبيت (5 دقائق)

### الخطوة 1: تحميل المشروع ✅

إذا عندك المشروع على GitHub:
```bash
git clone https://github.com/MB-programming/austria.git
cd austria/chrome-extension
```

أو حمّل ملف ZIP:
- من GitHub → Code → Download ZIP
- فك الضغط
- افتح مجلد `chrome-extension/`

---

### الخطوة 2: إنشاء الأيقونات 🎨

**الأيقونات ضرورية لتشغيل Extension!**

#### طريقة 1: استخدام موقع إلكتروني (الأسهل) ⭐

1. اذهب إلى: **https://www.favicon-generator.org/**

2. في خانة "Select Image":
   - اكتب emoji: `🇦🇹` أو `A`
   - أو ارفع صورة من جهازك

3. اضغط "Create Favicon"

4. حمّل الأيقونات:
   - `16x16`
   - `32x32`
   - `48x48`
   - `128x128`

5. سمّي الملفات:
   ```
   icon16.png
   icon32.png
   icon48.png
   icon128.png
   ```

6. ضعها في مجلد `chrome-extension/icons/`

**النتيجة:**
```
chrome-extension/icons/
├── icon16.png   ✅
├── icon32.png   ✅
├── icon48.png   ✅
└── icon128.png  ✅
```

#### طريقة 2: استخدام ImageMagick (للمحترفين)

إذا عندك ImageMagick مثبّت:
```bash
cd chrome-extension/icons/
./create-icons.sh
```

سينشئ أيقونات حمراء مع حرف "A" أبيض تلقائياً.

#### طريقة 3: استخدام Canva (للمبدعين)

1. اذهب إلى: **https://www.canva.com/**
2. أنشئ تصميمات بالأحجام: 128×128, 48×48, 32×32, 16×16
3. استخدم:
   - خلفية حمراء: `#c41e3a` (لون علم النمسا)
   - حرف "A" أبيض في المنتصف
4. حمّل كـ PNG
5. ضعها في مجلد `icons/`

---

### الخطوة 3: فتح Chrome Extensions 🌐

**في متصفح Chrome/Edge/Brave:**

1. افتح صفحة جديدة

2. اكتب في شريط العنوان:
   ```
   chrome://extensions/
   ```
   واضغط Enter

   **(أو Edge: `edge://extensions/` أو Brave: `brave://extensions/`)**

3. ستفتح صفحة "Extensions"

---

### الخطوة 4: تفعيل Developer Mode 🔧

في صفحة Extensions:

1. ابحث عن مفتاح "Developer mode" في **الزاوية العلوية اليمنى**

2. شغّله → سيتحول إلى **ON** (أزرق)

3. ستظهر أزرار جديدة في الأعلى:
   - Load unpacked
   - Pack extension
   - Update

---

### الخطوة 5: تحميل Extension 📂

1. اضغط على زر **"Load unpacked"** (تحميل بدون حزم)

2. سيفتح نافذة اختيار مجلد

3. اذهب إلى مجلد المشروع

4. اختر مجلد **`chrome-extension/`** (المجلد الذي فيه `manifest.json`)

5. اضغط **"Select Folder"** أو **"اختيار"**

6. **تم!** 🎉

   Extension ستظهر في القائمة مع:
   - الاسم: "Austria Appointment Bot"
   - الأيقونة (الحرف A الأحمر)
   - الحالة: Enabled (مفعّل)

---

### الخطوة 6: تثبيت الأيقونة في الشريط 📌

1. في شريط الأدوات بجانب شريط العنوان، ابحث عن أيقونة **puzzle piece** (قطعة البازل)

2. اضغط عليها → ستظهر قائمة Extensions

3. ابحث عن "Austria Appointment Bot"

4. اضغط على أيقونة **الدبوس 📌** بجانبها

5. **الأيقونة ستظهر دائماً** في شريط الأدوات

---

## ✅ التحقق من التثبيت

### تأكد أن كل شيء شغال:

1. **اضغط على أيقونة Austria Bot** في شريط الأدوات

2. **يجب أن تفتح نافذة popup** مع:
   - عنوان: "🇦🇹 Austria Bot"
   - ثلاثة tabs: الإعدادات، البيانات الشخصية، عن التطبيق
   - حالة: "معطّل" 🔴
   - زرين: "حفظ الإعدادات" و "تفعيل البوت"

3. **إذا فتحت بنجاح** → **التثبيت تمام!** ✅

### إذا ظهر خطأ:

**"Manifest file is missing or unreadable"**
- تأكد اخترت مجلد `chrome-extension/` الصحيح
- تأكد ملف `manifest.json` موجود في المجلد

**"Could not load icon"**
- تأكد أنشأت الأيقونات في مجلد `icons/`
- الأسماء: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

**Extension لا تظهر**
- تأكد Developer mode مفعّل
- جرب Reload Extension (زر التحديث)

---

## ⚙️ الخطوة التالية: الإعداد

بعد التثبيت:

1. **اضغط على أيقونة Extension**

2. **املأ الإعدادات** (tab "الإعدادات"):
   - المنظمة: `KAIRO`
   - نوع الحجز: `Bachelor`
   - إعادة البحث: `30` ثانية
   - الموعد المفضل: `أي موعد متاح`

3. **املأ البيانات الشخصية** (tab "البيانات الشخصية"):
   - الاسم
   - تاريخ الميلاد (DD.MM.YYYY)
   - رقم الجواز
   - باقي الحقول...

4. **احفظ** → "💾 حفظ الإعدادات"

5. **افتح موقع السفارة**:
   ```
   https://appointment.bmeia.gv.at/
   ```

6. **فعّل البوت** → "▶ تفعيل البوت"

7. **استرخِ!** 😎

---

## 📊 ملخص سريع

```
1️⃣ حمّل المشروع
2️⃣ أنشئ الأيقونات (icons/)
3️⃣ افتح chrome://extensions/
4️⃣ فعّل Developer mode
5️⃣ Load unpacked → اختر chrome-extension/
6️⃣ ثبّت الأيقونة (📌)
7️⃣ املأ الإعدادات
8️⃣ افتح الموقع وفعّل البوت
9️⃣ استمتع! 🎉
```

---

## 🎥 فيديو توضيحي (قريباً)

سنضيف فيديو يوضح كل الخطوات قريباً.

---

## 🐛 مشاكل التثبيت؟

### Extension لا تظهر بعد Load unpacked:

```bash
# تحقق من بنية الملفات:
chrome-extension/
├── manifest.json     ✅ موجود؟
├── icons/
│   ├── icon16.png    ✅ موجود؟
│   ├── icon32.png    ✅ موجود؟
│   ├── icon48.png    ✅ موجود؟
│   └── icon128.png   ✅ موجود؟
├── popup/
│   ├── popup.html    ✅ موجود؟
│   ├── popup.css     ✅ موجود؟
│   └── popup.js      ✅ موجود؟
├── content/
│   └── bot-automation.js ✅ موجود؟
└── background/
    └── background.js ✅ موجود؟
```

إذا أي ملف مفقود → حمّل المشروع من جديد.

### الأيقونات مش ظاهرة:

- افتح `chrome-extension/icons/`
- تأكد الملفات موجودة:
  - `icon16.png` (16×16 pixels)
  - `icon32.png` (32×32 pixels)
  - `icon48.png` (48×48 pixels)
  - `icon128.png` (128×128 pixels)

### Popup لا يفتح:

1. اذهب لـ `chrome://extensions/`
2. ابحث عن "Austria Appointment Bot"
3. اضغط "Reload" (زر التحديث)
4. جرب مرة تانية

---

## 📞 الدعم

مشكلة ما زالت موجودة؟
- افتح issue على GitHub
- راسل: MB-programming

---

## 🎉 تم التثبيت بنجاح!

**الآن جاهز للاستخدام!**

اذهب لـ **[QUICK_START.md](QUICK_START.md)** لمعرفة كيفية الاستخدام.

**حظ سعيد في حجز موعدك! 🍀**
