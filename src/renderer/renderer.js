'use strict';

// ─── i18n ─────────────────────────────────────────────────────────────────────
const I18N = {
  ar: {
    // nav
    'nav.bot':      'التشغيل',           'nav.person':   'بيانات الشخص',
    'nav.settings': 'الإعدادات',         'nav.logs':     'السجل',
    'nav.terms':    'سياسة الاستخدام',   'nav.support':  'التواصل مع الدعم',
    // bot tab
    'bot.title':    'لوحة التحكم',       'bot.subtitle': 'تشغيل وإيقاف البوت',
    'bot.stopped.label': 'البوت متوقف',
    'bot.stopped.desc':  'اضغط "تشغيل" لبدء الحجز التلقائي',
    'bot.running.label': 'البوت يعمل الآن',
    'bot.running.desc':  'جاري البحث عن خانة متاحة وإرسال النموذج…',
    'btn.start':    '▶ تشغيل البوت',     'btn.stop':     '■ إيقاف',
    'btn.restart':  '↺ إعادة',
    'status.running':'يعمل',             'status.stopped':'متوقف',
    // info cards
    'info.office':  'المنظمة / الجهة',   'info.type':    'نوع الحجز',
    'info.name':    'الاسم',             'info.refresh': 'إعادة البحث',
    'info.api':     'تفعيل البوت',
    'display.api.set':   'مضبوط ✓',      'display.api.unset': 'غير مضبوط',
    // activity
    'activity.title': 'النشاط المباشر',  'btn.clear': 'مسح',
    'activity.idle':  'البوت متوقف — اضغط "تشغيل" لبدء الحجز',
    // person
    'person.title':   'بيانات الشخص',   'person.subtitle': 'ملء بيانات الشخص في الفورم',
    'person.basic':   'البيانات الأساسية', 'person.address': 'العنوان',
    'person.contact': 'التواصل',         'person.passport': 'جواز السفر والجنسية',
    'p.lastname':     'اللقب (Lastname)', 'p.firstname':    'الاسم الأول (Firstname)',
    'p.dob':          'تاريخ الميلاد (MM/DD/YYYY)',
    'p.sex':          'الجنس',           'p.sex.male': 'ذكر (Male)', 'p.sex.female': 'أنثى (Female)',
    'p.lastname.birth': 'اللقب عند الميلاد', 'p.place.birth': 'مكان الميلاد',
    'p.street':       'الشارع والعنوان', 'p.postcode': 'الرمز البريدي',
    'p.city':         'المدينة',         'p.country.code': 'الدولة (كود)',
    'p.country':      'الدولة (اسم)',    'p.telephone': 'رقم الهاتف',
    'p.email':        'البريد الإلكتروني',
    'p.passport.num': 'رقم جواز السفر',  'p.nationality.code': 'الجنسية (كود)',
    'p.nationality':  'الجنسية (اسم)',
    'p.passport.issue':  'تاريخ إصدار الجواز (MM/DD/YYYY)',
    'p.passport.expiry': 'تاريخ انتهاء الجواز (MM/DD/YYYY)',
    'btn.save.person': 'حفظ البيانات',
    // settings
    'settings.title':      'الإعدادات',   'settings.subtitle': 'إعدادات API والبوت',
    'settings.activation': 'تفعيل البوت', 'settings.bot':      'إعدادات البوت',
    's.apikey':   'مفتاح التفعيل',
    's.office':   'المنظمة / الجهة (Office)',
    's.office.hint': 'الاسم الألماني كما يظهر في الموقع (الافتراضي: KAIRO)',
    's.reservation': 'نوع الحجز (كلمة مفتاحية)',
    's.reservation.hint': 'جزء من اسم نوع الحجز — مثال: Bachelor أو Master أو Visum',
    's.refresh': 'فترة إعادة البحث عند عدم وجود خانات متاحة (ثانية)',
    's.refresh.hint': 'الافتراضي 30 ثانية',
    's.navdelay': 'تأخير الانتقال بين الصفحات (مللي ثانية)',
    's.navdelay.hint': 'الوقت قبل الضغط على Next — الافتراضي 800ms',
    's.url':      'الرابط المستهدف',
    's.url.hint': 'اتركه فارغًا للرابط الافتراضي',
    // sound
    'sound.title':       'صوت الإشعار عند إيجاد خانة متاحة',
    'sound.beep.desc':   'ثلاث نبضات',    'sound.chime.desc': 'نغمة صاعدة',
    'sound.alert.desc':  'تنبيه سريع',    'sound.ding.desc':  'جرس واحد',
    'sound.custom.name': 'مخصص',          'sound.custom.desc':'رفع ملف صوتي',
    'sound.file.label':  'اختر ملف صوتي من جهازك',
    'sound.file.hint':   'MP3 · WAV · OGG · الحجم الأقصى 8 ميجا',
    'btn.save.settings': 'حفظ الإعدادات',
    // logs
    'logs.title':    'سجل النشاط',        'logs.subtitle': 'متابعة ما يفعله البوت',
    'btn.clear.log': 'مسح السجل',
    'log.empty':     'لا يوجد نشاط بعد. قم بتشغيل البوت أولًا.',
    // terms
    'terms.title':   'شروط الاستخدام',   'terms.subtitle': 'سياسة الاستخدام',
    // slot preferences
    'settings.slot':      'اختيار الموعد',
    'settings.slot.hint': 'حدد الموعد المفضل — لو مش موجود هيجرب البديل التالي تلقائياً',
    's.slot.0': 'الاختيار الأساسي',
    's.slot.1': 'البديل الأول',
    's.slot.2': 'البديل الثاني',
    's.slot.3': 'البديل الثالث',
    'slot.n1': 'الموعد الأول',   'slot.n2':  'الموعد الثاني',  'slot.n3':  'الموعد الثالث',
    'slot.n4': 'الموعد الرابع',  'slot.n5':  'الموعد الخامس', 'slot.n6':  'الموعد السادس',
    'slot.n7': 'الموعد السابع',  'slot.n8':  'الموعد الثامن',  'slot.n9':  'الموعد التاسع',
    'slot.n10':'الموعد العاشر',  'slot.random': 'عشوائي',
    'slot.any':'أي موعد متاح',   'slot.none': 'لا يوجد',
    // monitor
    'nav.monitor': 'مراقبة المواعيد',
    'monitor.title':   'مراقبة التوافر',     'monitor.subtitle': 'مراقبة توافر الخانات دون إرسال',
    'monitor.stopped.label': 'المراقبة متوقفة',
    'monitor.stopped.desc':  'اضغط "بدء المراقبة" للبدء',
    'monitor.running.label': 'المراقبة تعمل',
    'monitor.running.desc':  'جاري فحص توافر الخانات…',
    'btn.monitor.start': '◉ بدء المراقبة',
    'btn.monitor.stop':  '■ إيقاف',
    'monitor.settings':  'إعدادات المراقبة',
    'm.office':   'المنظمة / الجهة',     'm.type': 'نوع الحجز (كلمة مفتاحية)',
    'm.refresh':  'فترة إعادة الفحص (ثانية)',
    'm.refresh.hint': 'الحد الأدنى 5 ثوان',
    'm.url':      'الرابط',             'm.url.hint': 'اتركه فارغًا للرابط الافتراضي',
    'm.sound':    'صوت التنبيه عند إيجاد موعد',
    'm.sound.beep':  'Beep — ثلاث نبضات', 'm.sound.chime': 'Chime — نغمة صاعدة',
    'm.sound.alert': 'Alert — تنبيه سريع','m.sound.ding':  'Ding — جرس واحد',
    'btn.save.monitor': 'حفظ إعدادات المراقبة',
    'monitor.feed.title': 'نشاط المراقبة',
    'monitor.idle': 'المراقبة متوقفة — اضغط "بدء" للبدء',
    'msg.monitor.started': 'تم تشغيل المراقبة ← ',
    'msg.monitor.already': 'المراقبة تعمل بالفعل',
    'msg.monitor.error':   'خطأ في تشغيل المراقبة: ',
    'msg.monitor.stopped': 'تم إيقاف المراقبة',
    'msg.monitor.closed':  'نافذة المراقبة أُغلقت',
    'msg.saved.monitor':   'تم حفظ إعدادات المراقبة',
    'mon.no.appts':   'لا توجد خانات متاحة الآن',
    'mon.retry':      'إعادة الفحص خلال ',
    'mon.retry.unit': ' ثانية…',
    'mon.found':      'تم إيجاد خانات متاحة! عدد: ',
    'mon.nav':        'جاري الانتقال للنموذج…',
    // multi-sessions
    'nav.sessions':       'الجلسات المتعددة',
    'sessions.title':     'الجلسات المتعددة',
    'sessions.subtitle':  'تشغيل أكثر من جلسة بإعدادات مختلفة — مع إمكانية تشغيل جلستين خفيتين',
    // license / trial
    'trial.modal.title':    'تفعيل البرنامج',
    'trial.modal.subtitle': 'أدخل مفتاح التفعيل للوصول الكامل',
    'trial.modal.unlock':   'تفعيل',
    'trial.modal.or':       'أو',
    'trial.modal.try':      'تجربة مراقبة المواعيد فقط',
    'trial.modal.error':    'المفتاح فارغ — أدخل مفتاحك أو اختر التجربة',
    'trial.badge':          'باشتراك',
    // placeholders
    'ph.apikey':     'أدخل مفتاح التفعيل…',
    'ph.smith':      'SMITH',             'ph.john':       'JOHN',
    'ph.country.code': 'مثال: 65 (مصر)', 'ph.nat.code':  'مثال: 71 (مصر)',
    // dynamic messages
    'msg.mode.electron':  'وضع Electron',
    'msg.mode.browser':   'وضع المتصفح (localStorage)',
    'msg.saved.person':   'تم حفظ بيانات الشخص: ',
    'msg.save.error':     'خطأ في الحفظ: ',
    'msg.saved.settings': 'تم حفظ الإعدادات',
    // settings nav retry
    's.navretry':      'إعادة المحاولة عند عدم إيجاد الكلمة (ثانية)',
    's.navretry.hint': 'وقت الانتظار لو المنظمة أو نوع الحجز مش موجود — الافتراضي 5 ثوان',
    // activity - nav retry + restart
    'act.nav.retry':   'الكلمة المفتاحية غير موجودة — إعادة المحاولة خلال ',
    'act.restart':     'إعادة تشغيل البوت من البداية…',
    'act.retry.unit':  ' ثانية…',
    // booking success celebration
    'booking.success.title': 'تم إرسال النموذج بنجاح!',
    'booking.success.msg':   'راجع بريدك الإلكتروني للتفاصيل',
    'booking.success.sub':   'سيتم إغلاق البوت تلقائياً…',
    'msg.load.error':     'خطأ في تحميل الإعدادات: ',
    'msg.missing':        '✕ بيانات مطلوبة ناقصة: ',
    'msg.fill.all':       'اذهب لتبويب "البيانات الشخصية" واملأ جميع الحقول ثم اضغط حفظ',
    'msg.no.key':         'تحذير: مفتاح التفعيل غير مضبوط — الكابتشا يدوي',
    'msg.bot.started':    'تم تشغيل البوت ← ',
    'msg.bot.already':    'البوت يعمل بالفعل',
    'msg.bot.error':      'خطأ في التشغيل: ',
    'msg.browser.mode':   'وضع المتصفح — الأتمتة الكاملة تحتاج تطبيق Desktop',
    'msg.open.manual':    'افتح الموقع يدوياً: ',
    'msg.browser.no.auto':'وضع المتصفح: الأتمتة غير متاحة',
    'msg.stop.error':     'خطأ في الإيقاف: ',
    'msg.window.closed':  'نافذة البوت أُغلقت',
    'msg.file.big':       'حجم الملف أكبر من 8 ميجا — اختر ملفاً أصغر',
    // activity messages
    'act.loading':     'البوت انطلق — جاري تحميل الموقع…',
    'act.office.page': 'الصفحة: اختيار المنظمة / الجهة…',
    'act.calendar':    'الصفحة: اختيار نوع الحجز…',
    'act.persons':     'الصفحة: عدد الأشخاص…',
    'act.persons.ok':  'تم اختيار عدد الأشخاص: 1',
    'act.info':        'الصفحة: معلومات — جاري التجاوز…',
    'act.scheduler':   'الصفحة: فحص الخانات المتاحة…',
    'act.no.appts':    'لا توجد خانات متاحة حالياً',
    'act.retry':       'إعادة البحث خلال ',
    'act.retry.unit':  ' ثانية…',
    'act.found':       'تم العثور على خانة! ',
    'act.form':        'الصفحة: ملء البيانات الشخصية…',
    'act.form.done':   'تم ملء جميع البيانات',
    'act.captcha.ok':  'تم حل الكابتشا: ',
    'act.captcha.manual': 'أدخل الكابتشا يدوياً في نافذة البوت',
    'act.booked':      'تم الحجز بنجاح!',
    'act.bot.stopped': 'تم إيقاف البوت',
    'act.idle':        'البوت متوقف — اضغط "تشغيل" لبدء الحجز',
  },
  en: {
    // nav
    'nav.bot':      'Control',            'nav.person':   'Personal Data',
    'nav.settings': 'Settings',           'nav.logs':     'Logs',
    'nav.terms':    'Terms of Use',       'nav.support':  'Contact Support',
    // bot tab
    'bot.title':    'Dashboard',          'bot.subtitle': 'Start and Stop the Bot',
    'bot.stopped.label': 'Bot Stopped',
    'bot.stopped.desc':  'Press "Start" to begin automatic booking',
    'bot.running.label': 'Bot is Running',
    'bot.running.desc':  'Searching for an available slot and submitting the form…',
    'btn.start':    '▶ Start Bot',        'btn.stop':     '■ Stop',
    'btn.restart':  '↺ Restart',
    'status.running':'Running',           'status.stopped':'Stopped',
    // info cards
    'info.office':  'Office / Organization','info.type':  'Booking Type',
    'info.name':    'Name',               'info.refresh': 'Retry Interval',
    'info.api':     'Bot Activation',
    'display.api.set':   'Set ✓',         'display.api.unset': 'Not set',
    // activity
    'activity.title': 'Live Activity',    'btn.clear': 'Clear',
    'activity.idle':  'Bot stopped — press "Start" to begin booking',
    // person
    'person.title':   'Personal Data',    'person.subtitle': 'Fill in your personal details for the form',
    'person.basic':   'Basic Information','person.address': 'Address',
    'person.contact': 'Contact',          'person.passport': 'Passport & Nationality',
    'p.lastname':     'Last Name',        'p.firstname':    'First Name',
    'p.dob':          'Date of Birth (MM/DD/YYYY)',
    'p.sex':          'Gender',           'p.sex.male': 'Male', 'p.sex.female': 'Female',
    'p.lastname.birth': 'Last Name at Birth', 'p.place.birth': 'Place of Birth',
    'p.street':       'Street & Address', 'p.postcode': 'Postal Code',
    'p.city':         'City',             'p.country.code': 'Country (Code)',
    'p.country':      'Country (Name)',   'p.telephone': 'Phone Number',
    'p.email':        'Email Address',
    'p.passport.num': 'Passport Number',  'p.nationality.code': 'Nationality (Code)',
    'p.nationality':  'Nationality (Name)',
    'p.passport.issue':  'Passport Issue Date (MM/DD/YYYY)',
    'p.passport.expiry': 'Passport Expiry Date (MM/DD/YYYY)',
    'btn.save.person': 'Save Data',
    // settings
    'settings.title':      'Settings',    'settings.subtitle': 'API & Bot Settings',
    'settings.activation': 'Bot Activation','settings.bot':   'Bot Settings',
    's.apikey':   'Activation Key',
    's.office':   'Office / Organization',
    's.office.hint': 'German name as shown on the website (default: KAIRO)',
    's.reservation': 'Reservation Type (keyword)',
    's.reservation.hint': 'Part of the reservation type name — e.g. Bachelor or Master or Visum',
    's.refresh': 'Retry interval when no slots available (seconds)',
    's.refresh.hint': 'Default 30 seconds',
    's.navdelay': 'Navigation delay between pages (milliseconds)',
    's.navdelay.hint': 'Time before clicking Next — default 800ms',
    's.url':      'Target URL',
    's.url.hint': 'Leave empty for the default URL',
    // sound
    'sound.title':       'Notification Sound on Slot Found',
    'sound.beep.desc':   'Three pulses',   'sound.chime.desc': 'Rising tone',
    'sound.alert.desc':  'Quick alert',    'sound.ding.desc':  'Single ding',
    'sound.custom.name': 'Custom',         'sound.custom.desc':'Upload audio file',
    'sound.file.label':  'Choose an audio file from your device',
    'sound.file.hint':   'MP3 · WAV · OGG · Max size 8 MB',
    'btn.save.settings': 'Save Settings',
    // logs
    'logs.title':    'Activity Log',       'logs.subtitle': 'Track what the bot is doing',
    'btn.clear.log': 'Clear Log',
    'log.empty':     'No activity yet. Start the bot first.',
    // terms
    'terms.title':   'Terms of Use',       'terms.subtitle': 'Usage Policy',
    // slot preferences
    'settings.slot':      'Slot Selection',
    'settings.slot.hint': 'Set preferred slot — if not available, next fallback is tried automatically',
    's.slot.0': 'Primary Choice',
    's.slot.1': 'Fallback 1',
    's.slot.2': 'Fallback 2',
    's.slot.3': 'Fallback 3',
    'slot.n1': '1st Slot',  'slot.n2':  '2nd Slot',  'slot.n3': '3rd Slot',
    'slot.n4': '4th Slot',  'slot.n5':  '5th Slot',  'slot.n6': '6th Slot',
    'slot.n7': '7th Slot',  'slot.n8':  '8th Slot',  'slot.n9': '9th Slot',
    'slot.n10':'10th Slot', 'slot.random': 'Random',
    'slot.any':'Any available slot', 'slot.none': 'None',
    // monitor
    'nav.monitor': 'Monitor',
    'monitor.title':   'Availability Monitor',   'monitor.subtitle': 'Check slot availability without submitting',
    'monitor.stopped.label': 'Monitor Stopped',
    'monitor.stopped.desc':  'Press "Start Monitor" to begin',
    'monitor.running.label': 'Monitor Running',
    'monitor.running.desc':  'Checking slot availability…',
    'btn.monitor.start': '◉ Start Monitor',
    'btn.monitor.stop':  '■ Stop',
    'monitor.settings':  'Monitor Settings',
    'm.office':   'Office / Organization', 'm.type': 'Reservation Type (keyword)',
    'm.refresh':  'Check interval (seconds)',
    'm.refresh.hint': 'Minimum 5 seconds',
    'm.url':      'Target URL',            'm.url.hint': 'Leave empty for default URL',
    'm.sound':    'Alarm sound when slots found',
    'm.sound.beep':  'Beep — Three pulses', 'm.sound.chime': 'Chime — Rising tone',
    'm.sound.alert': 'Alert — Quick alert', 'm.sound.ding':  'Ding — Single bell',
    'btn.save.monitor': 'Save Monitor Settings',
    'monitor.feed.title': 'Monitor Activity',
    'monitor.idle': 'Monitor stopped — press "Start" to begin',
    'msg.monitor.started': 'Monitor started ← ',
    'msg.monitor.already': 'Monitor is already running',
    'msg.monitor.error':   'Monitor start error: ',
    'msg.monitor.stopped': 'Monitor stopped',
    'msg.monitor.closed':  'Monitor window was closed',
    'msg.saved.monitor':   'Monitor settings saved',
    'mon.no.appts':   'No slots available right now',
    'mon.retry':      'Rechecking in ',
    'mon.retry.unit': ' seconds…',
    'mon.found':      'Slots found! Count: ',
    'mon.nav':        'Navigating to the form…',
    // multi-sessions
    'nav.sessions':       'Multi-Sessions',
    'sessions.title':     'Multi-Sessions',
    'sessions.subtitle':  'Run multiple sessions with different settings — up to 2 stealth sessions',
    // license / trial
    'trial.modal.title':    'Activate Software',
    'trial.modal.subtitle': 'Enter your activation key for full access',
    'trial.modal.unlock':   'Activate',
    'trial.modal.or':       'or',
    'trial.modal.try':      'Try Monitor-Only (Free)',
    'trial.modal.error':    'Key is empty — enter your key or choose trial',
    'trial.badge':          'Subscription',
    // placeholders
    'ph.apikey':     'Enter activation key…',
    'ph.smith':      'SMITH',              'ph.john':       'JOHN',
    'ph.country.code': 'e.g. 65 (Egypt)', 'ph.nat.code':  'e.g. 71 (Egypt)',
    // dynamic messages
    'msg.mode.electron':  'Electron mode',
    'msg.mode.browser':   'Browser mode (localStorage)',
    'msg.saved.person':   'Person data saved: ',
    'msg.save.error':     'Save error: ',
    'msg.saved.settings': 'Settings saved',
    // settings nav retry
    's.navretry':      'Retry interval when keyword not found (seconds)',
    's.navretry.hint': 'Wait time if office or reservation type is not found — default 5s',
    // activity - nav retry + restart
    'act.nav.retry':   'Keyword not found — retrying in ',
    'act.restart':     'Restarting bot from the beginning…',
    'act.retry.unit':  's…',
    // booking success celebration
    'booking.success.title': 'Form Submitted Successfully!',
    'booking.success.msg':   'Check your email for details',
    'booking.success.sub':   'The bot will close automatically…',
    'msg.load.error':     'Error loading settings: ',
    'msg.missing':        '✕ Required fields missing: ',
    'msg.fill.all':       'Go to "Personal Data" tab, fill all fields and press save',
    'msg.no.key':         'Warning: activation key not set — captcha is manual',
    'msg.bot.started':    'Bot started ← ',
    'msg.bot.already':    'Bot is already running',
    'msg.bot.error':      'Start error: ',
    'msg.browser.mode':   'Browser mode — full automation requires Desktop app',
    'msg.open.manual':    'Open the website manually: ',
    'msg.browser.no.auto':'Browser mode: automation not available',
    'msg.stop.error':     'Stop error: ',
    'msg.window.closed':  'Bot window was closed',
    'msg.file.big':       'File size exceeds 8 MB — choose a smaller file',
    // activity messages
    'act.loading':     'Bot started — loading the website…',
    'act.office.page': 'Page: select office / organization…',
    'act.calendar':    'Page: select reservation type…',
    'act.persons':     'Page: number of persons…',
    'act.persons.ok':  'Persons count set: 1',
    'act.info':        'Page: info — skipping…',
    'act.scheduler':   'Page: checking available slots…',
    'act.no.appts':    'No slots available right now',
    'act.retry':       'Retrying in ',
    'act.retry.unit':  ' seconds…',
    'act.found':       'Slot found! ',
    'act.form':        'Page: filling personal data…',
    'act.form.done':   'All data filled successfully',
    'act.captcha.ok':  'Captcha solved: ',
    'act.captcha.manual': 'Enter captcha manually in the bot window',
    'act.booked':      'Booking confirmed!',
    'act.bot.stopped': 'Bot stopped',
    'act.idle':        'Bot stopped — press "Start" to begin booking',
  }
};

let _appLang = 'ar'; // default

function t(key) {
  return (I18N[_appLang] || I18N.ar)[key] || (I18N.ar)[key] || key;
}

function setLang(lang) {
  _appLang = lang;
  try { localStorage.setItem('orbtasoft_app_lang', lang); } catch (_) {}

  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const dict = I18N[lang] || I18N.ar;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  document.querySelectorAll('option[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = lang === 'ar' ? 'EN' : 'عربي';

  // Re-apply dynamic bot & monitor state
  setBotState(botRunning);
  setMonitorState(monitorRunning);

  // Update log empty placeholder if still shown
  const logEmpty = document.querySelector('#logs-container .log-empty');
  if (logEmpty) logEmpty.textContent = t('log.empty');
}

function toggleLang() {
  setLang(_appLang === 'ar' ? 'en' : 'ar');
}

// ─── Environment detection ────────────────────────────────────────────────────
const IS_ELECTRON = typeof window !== 'undefined' && !!window.electronAPI;

// ─── Storage abstraction (Electron IPC  OR  localStorage) ────────────────────
const Storage = (() => {
  const LS_KEY = 'austria_bot_v1';

  function lsGet() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch { return {}; }
  }

  function lsSet(patch) {
    const current = lsGet();
    Object.entries(patch).forEach(([k, v]) => { current[k] = v; });
    localStorage.setItem(LS_KEY, JSON.stringify(current));
  }

  return {
    async get() {
      if (IS_ELECTRON) return window.electronAPI.getSettings();
      return lsGet();
    },
    async save(patch) {
      if (IS_ELECTRON) return window.electronAPI.saveSettings(patch);
      lsSet(patch);
      return { success: true };
    }
  };
})();

// ─── Bot / Monitor state ──────────────────────────────────────────────────────
let botRunning     = false;
let monitorRunning = false;
let trialMode      = false;
let TARGET_URL     = 'https://appointment.bmeia.gv.at/';

// ─── Tab navigation ──────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (trialMode && btn.hasAttribute('data-trial-locked')) {
      // Open subscription page
      const url = 'https://orbtasoft.com';
      if (IS_ELECTRON && window.electronAPI.openExternal) window.electronAPI.openExternal(url);
      else window.open(url, '_blank');
      return;
    }
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  startStatusPolling();

  if (IS_ELECTRON) {
    window.electronAPI.onBotLog(({ type, message }) => {
      const clean = message.replace(/\[AustriaBot\]\s*(ERROR:\s*)?/, '');
      routeBotMessage(clean);
      addLog(message.includes('ERROR') ? 'error' : 'info', clean);
    });
    window.electronAPI.onBotStopped(() => {
      setBotState(false);
      addActivity('error', '⛔', t('msg.window.closed'));
      addLog('warn', t('msg.window.closed'));
    });
    window.electronAPI.onMonitorLog(({ type, message }) => {
      const clean = message.replace(/\[AustriaMonitor\]\s*(ERROR:\s*)?/, '');
      routeMonitorMessage(clean);
      addLog(message.includes('ERROR') ? 'error' : 'info', '[Monitor] ' + clean);
    });
    window.electronAPI.onMonitorStopped(() => {
      setMonitorState(false);
      addMonitorFeed('error', '⛔', t('msg.monitor.closed'));
      addLog('warn', t('msg.monitor.closed'));
    });

    window.electronAPI.onBookingComplete(() => {
      setBotState(false);
      showBookingSuccess();
    });

    window.electronAPI.onSessionLog(({ id, type, message }) => {
      const clean = message.replace(/\[AustriaBot\]\s*(ERROR:\s*)?/, '');
      addSessionLog(id, message.includes('ERROR') ? 'error' : type, clean);
    });
    window.electronAPI.onSessionStopped(({ id }) => {
      _sessionRunning[id] = false;
      updateSessionButtons(id, false);
      addSessionLog(id, 'warn', `نافذة الجلسة ${id} أُغلقت`);
    });
  }

});

// ─── Load saved data ──────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const stored = await Storage.get();
    const p = stored.person   || {};
    const s = stored.settings || {};

    setField('p-lastname',         p.lastname);
    setField('p-firstname',        p.firstname);
    setField('p-dob',              p.dateOfBirth);
    setField('p-sex',              p.sex);
    setField('p-lastname-birth',   p.lastnameAtBirth);
    setField('p-place-birth',      p.placeOfBirth);
    setField('p-street',           p.street);
    setField('p-postcode',         p.postcode);
    setField('p-city',             p.city);
    setField('p-country-code',     p.countryCode);
    setField('p-country',          p.country);
    setField('p-telephone',        p.telephone);
    setField('p-email',            p.email);
    setField('p-passport-num',     p.passportNumber);
    setField('p-nationality-code', p.nationalityCode);
    setField('p-nationality',      p.nationality);
    setField('p-passport-issue',   p.passportIssueDate);
    setField('p-passport-expiry',  p.passportExpiry);

    setField('s-openai-key',       s.openaiApiKey);
    setField('s-office',           s.office);
    setField('s-reservation-type', s.reservationType);
    setField('s-refresh-interval', s.refreshIntervalSec);
    setField('s-nav-delay',        s.navigationDelayMs);
    setField('s-nav-retry',        s.navRetryIntervalSec);
    setField('s-target-url',       s.targetUrl);

    // Restore slot preferences
    const prefs = s.slotPreferences || ['random', 'none', 'none', 'none'];
    ['s-slot-0','s-slot-1','s-slot-2','s-slot-3'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && prefs[i] !== undefined) el.value = prefs[i];
    });

    // Restore monitor settings
    const ms = stored.monitorSettings || {};
    setField('m-office',           ms.office);
    setField('m-reservation-type', ms.reservationType);
    setField('m-refresh-interval', ms.refreshIntervalSec);
    setField('m-target-url',       ms.targetUrl);
    if (ms.notificationSound) {
      const mSnd = document.getElementById('m-sound');
      if (mSnd) mSnd.value = ms.notificationSound;
    }

    // Restore custom sound from store into memory
    if (s.customSoundB64)     _customSoundB64      = s.customSoundB64;
    if (s.customSoundFileName) _customSoundFileName = s.customSoundFileName;

    // Load sound setting
    const sndVal = s.notificationSound || 'beep';
    const sndRadio = document.querySelector(`input[name="s-sound"][value="${sndVal}"]`);
    if (sndRadio) sndRadio.checked = true;
    if (sndVal === 'custom') {
      document.getElementById('custom-file-row').style.display = '';
      if (s.customSoundB64) {
        document.getElementById('custom-preview-btn').style.display = '';
        const nameEl = document.getElementById('custom-sound-name');
        if (nameEl) nameEl.textContent = s.customSoundFileName || 'ملف مخصص محمّل';
      }
    }
    // Toggle custom file row on radio change
    document.querySelectorAll('input[name="s-sound"]').forEach(r => {
      r.addEventListener('change', () => {
        const row = document.getElementById('custom-file-row');
        row.style.display = r.value === 'custom' ? '' : 'none';
      });
    });

    if (s.targetUrl) TARGET_URL = s.targetUrl;

    updateInfoCards(stored);
    addLog('info', IS_ELECTRON ? t('msg.mode.electron') : t('msg.mode.browser'));
    // Load saved language preference
    try {
      const savedLang = localStorage.getItem('orbtasoft_app_lang') || 'ar';
      setLang(savedLang);
    } catch (_) { setLang('ar'); }

    // Check license / trial gate
    await checkLicense(stored);

    // Load multi-sessions
    await loadSessions();
  } catch (e) {
    addLog('error', t('msg.load.error') + e.message);
  }
}

// ─── License / Trial ──────────────────────────────────────────────────────────
async function checkLicense(stored) {
  // Mode is set by the auth window (auth.html) before the main window opens.
  // 'full'  → valid key was entered in auth.html
  // 'trial' → user clicked trial button in auth.html
  // unset   → fallback (should not happen in packaged app; default to full)
  const mode = (stored || {}).mode;

  if (mode === 'trial') {
    setTrialMode();
    return;
  }
  // 'full' or anything else → full access
  setFullMode(false);
}

function setFullMode(switchToBot) {
  trialMode = false;
  document.body.classList.remove('trial-mode');

  if (switchToBot) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const botBtn = document.querySelector('.nav-btn[data-tab="bot"]');
    if (botBtn) {
      botBtn.classList.add('active');
      document.getElementById('tab-bot').classList.add('active');
    }
  }
}

function setTrialMode() {
  trialMode = true;
  document.body.classList.add('trial-mode');

  // Switch to monitor tab
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const monBtn = document.querySelector('.nav-btn[data-tab="monitor"]');
  if (monBtn) monBtn.classList.add('active');
  const monTab = document.getElementById('tab-monitor');
  if (monTab) monTab.classList.add('active');
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (!el || val === undefined || val === null || val === '') return;
  el.value = val;
}

// ─── Save person ──────────────────────────────────────────────────────────────
async function savePerson() {
  const person = {
    lastname:          getField('p-lastname'),
    firstname:         getField('p-firstname'),
    dateOfBirth:       getField('p-dob'),
    sex:               getField('p-sex'),
    lastnameAtBirth:   getField('p-lastname-birth') || getField('p-lastname'),
    placeOfBirth:      getField('p-place-birth'),
    street:            getField('p-street'),
    postcode:          getField('p-postcode'),
    city:              getField('p-city'),
    countryCode:       parseInt(getField('p-country-code'))     || 65,
    country:           getField('p-country'),
    telephone:         getField('p-telephone'),
    email:             getField('p-email'),
    passportNumber:    getField('p-passport-num'),
    nationalityCode:   parseInt(getField('p-nationality-code')) || 71,
    nationality:       getField('p-nationality'),
    passportIssueDate: getField('p-passport-issue'),
    passportExpiry:    getField('p-passport-expiry')
  };

  try {
    await Storage.save({ person });
    showSaved('person-saved', '✓ تم الحفظ');
    const stored = await Storage.get();
    updateInfoCards(stored);
    addLog('success', t('msg.saved.person') + person.firstname + ' ' + person.lastname);
  } catch (e) {
    addLog('error', t('msg.save.error') + e.message);
  }
}

// ─── Sound helpers ────────────────────────────────────────────────────────────
let _customSoundB64 = '';
let _customSoundFileName = '';

function loadCustomSound(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    alert(t('msg.file.big'));
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    _customSoundB64 = e.target.result;
    _customSoundFileName = file.name;
    document.getElementById('custom-preview-btn').style.display = '';
    const nameEl = document.getElementById('custom-sound-name');
    if (nameEl) nameEl.textContent = file.name;
    // Auto-select custom radio
    const r = document.getElementById('sound-custom-radio');
    if (r) r.checked = true;
  };
  reader.readAsDataURL(file);
}

function previewSound(type) {
  try {
    if (type === 'custom') {
      if (!_customSoundB64) return;
      new Audio(_customSoundB64).play();
      return;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    function tone(freq, start, dur, vol, waveType) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = waveType || 'sine';
      gain.gain.setValueAtTime(vol, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.01);
    }
    if (type === 'beep') {
      tone(880, 0, 0.18, 0.55); tone(1100, 0.22, 0.18, 0.55); tone(880, 0.44, 0.18, 0.55);
    } else if (type === 'chime') {
      tone(523, 0, 0.35, 0.5); tone(659, 0.18, 0.35, 0.5); tone(784, 0.36, 0.45, 0.5);
    } else if (type === 'alert') {
      [0, 0.12, 0.24, 0.36, 0.48].forEach(t => tone(1400, t, 0.09, 0.6, 'square'));
    } else if (type === 'ding') {
      tone(1047, 0, 0.6, 0.7); tone(1319, 0, 0.3, 0.3);
    }
  } catch (_) {}
}

function openSupport() {
  const url = 'https://orbtasoft.com';
  if (IS_ELECTRON && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

// ─── Save settings ────────────────────────────────────────────────────────────
async function saveSettings() {
  // Build slot preferences array (filter out 'none' from end)
  const rawPrefs = ['s-slot-0','s-slot-1','s-slot-2','s-slot-3'].map(id => getField(id) || 'none');
  // Keep at least the primary; trim trailing 'none'
  const slotPreferences = rawPrefs.reduce((acc, val, i) => {
    if (i === 0) return [val];
    if (acc.length > 0 || val !== 'none') acc.push(val);
    return acc;
  }, []);
  if (slotPreferences.length === 0) slotPreferences.push('random');

  const s = {
    openaiApiKey:       getField('s-openai-key'),
    office:             getField('s-office')            || 'KAIRO',
    reservationType:    getField('s-reservation-type')  || 'Bachelor',
    refreshIntervalSec: parseFloat(getField('s-refresh-interval')) || 30,
    navigationDelayMs:   parseInt(getField('s-nav-delay'))       || 800,
    navRetryIntervalSec: parseInt(getField('s-nav-retry'))       || 5,
    targetUrl:           getField('s-target-url')       || 'https://appointment.bmeia.gv.at/',
    notificationSound:  (document.querySelector('input[name="s-sound"]:checked') || {}).value || 'beep',
    customSoundB64:     _customSoundB64  || '',
    customSoundFileName: _customSoundFileName || '',
    slotPreferences
  };

  if (s.targetUrl) TARGET_URL = s.targetUrl;

  try {
    await Storage.save({ settings: s });
    showSaved('settings-saved', '✓ تم الحفظ');
    const stored = await Storage.get();
    updateInfoCards(stored);
    addLog('success', t('msg.saved.settings'));
    // If key was just added and we're in trial → upgrade to full
    if (s.openaiApiKey && trialMode) {
      localStorage.setItem('orbtasoft_mode', 'full');
      setFullMode(true);
    }
  } catch (e) {
    addLog('error', t('msg.save.error') + e.message);
  }
}

// ─── Bot control ──────────────────────────────────────────────────────────────
async function startBot() {
  const stored   = await Storage.get();
  const person   = stored.person   || {};
  const settings = stored.settings || {};

  // Block start if critical person fields are missing
  const missing = ['lastname','firstname','dateOfBirth','passportNumber',
                   'street','city','country','telephone','email',
                   'nationality','passportIssueDate','passportExpiry']
    .filter(f => !person[f]);
  if (missing.length) {
    addLog('error', t('msg.missing') + missing.join(', '));
    addLog('warn',  t('msg.fill.all'));
    return;
  }
  if (!settings.openaiApiKey) addLog('warn', t('msg.no.key'));

  TARGET_URL = settings.targetUrl || 'https://appointment.bmeia.gv.at/';

  clearActivity();

  if (IS_ELECTRON) {
    const config = { person, settings, targetUrl: TARGET_URL };
    try {
      const res = await window.electronAPI.startBot(config);
      if (res.success) {
        setBotState(true);
        addActivity('step', '▶', t('act.loading'));
        addLog('info', t('msg.bot.started') + TARGET_URL);
      } else {
        addActivity('error', '⚠', res.message || t('msg.bot.already'));
        addLog('warn', res.message);
      }
    } catch (e) {
      addActivity('error', '✕', t('msg.bot.error') + e.message);
      addLog('error', e.message);
    }
  } else {
    setBotState(true);
    addActivity('wait', 'ℹ', t('msg.browser.mode'));
    addActivity('step', '⊕', t('msg.open.manual') + TARGET_URL);
    addLog('warn', t('msg.browser.no.auto'));
  }
}

async function stopBot() {
  if (IS_ELECTRON) {
    try { await window.electronAPI.stopBot(); }
    catch (e) { addLog('error', t('msg.stop.error') + e.message); }
  }
  setBotState(false);
  addActivity('error', '◼', t('act.bot.stopped'));
  addLog('warn', t('act.bot.stopped'));
}

// ─── Monitor control ──────────────────────────────────────────────────────────
async function saveMonitorSettings() {
  const ms = {
    office:             getField('m-office')            || 'KAIRO',
    reservationType:    getField('m-reservation-type')  || 'Bachelor',
    refreshIntervalSec: parseFloat(getField('m-refresh-interval')) || 30,
    navigationDelayMs:  800,
    targetUrl:          getField('m-target-url')        || 'https://appointment.bmeia.gv.at/',
    notificationSound:  (document.getElementById('m-sound') || {}).value || 'beep'
  };
  try {
    await Storage.save({ monitorSettings: ms });
    showSaved('monitor-saved', '✓ تم الحفظ');
    addLog('success', t('msg.saved.monitor'));
  } catch (e) {
    addLog('error', t('msg.save.error') + e.message);
  }
}

async function startMonitor() {
  const stored = await Storage.get();
  const ms = stored.monitorSettings || {};

  const targetUrl = (ms.targetUrl || '').trim() || 'https://appointment.bmeia.gv.at/';
  clearMonitorFeed();

  if (IS_ELECTRON) {
    const config = { settings: ms, targetUrl };
    try {
      const res = await window.electronAPI.startMonitor(config);
      if (res.success) {
        setMonitorState(true);
        addMonitorFeed('step', '◉', t('mon.nav'));
        addLog('info', t('msg.monitor.started') + targetUrl);
      } else {
        addMonitorFeed('error', '⚠', res.message || t('msg.monitor.already'));
        addLog('warn', res.message);
      }
    } catch (e) {
      addMonitorFeed('error', '✕', t('msg.monitor.error') + e.message);
      addLog('error', e.message);
    }
  } else {
    addMonitorFeed('wait', 'ℹ', t('msg.browser.mode'));
    addLog('warn', t('msg.browser.no.auto'));
  }
}

async function stopMonitor() {
  if (IS_ELECTRON) {
    try { await window.electronAPI.stopMonitor(); }
    catch (e) { addLog('error', t('msg.stop.error') + e.message); }
  }
  setMonitorState(false);
  addMonitorFeed('error', '◼', t('msg.monitor.stopped'));
  addLog('warn', t('msg.monitor.stopped'));
}

function setMonitorState(running) {
  monitorRunning = running;

  const startBtn = document.getElementById('monitor-start-btn');
  const stopBtn  = document.getElementById('monitor-stop-btn');
  const label    = document.getElementById('monitor-state-label');
  const desc     = document.getElementById('monitor-state-desc');
  const visual   = document.getElementById('monitor-animation');

  if (!startBtn) return; // tab not rendered yet

  if (running) {
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    if (label) label.textContent = t('monitor.running.label');
    if (desc)  desc.textContent  = t('monitor.running.desc');
    if (visual) visual.classList.add('running');
  } else {
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    if (label) label.textContent = t('monitor.stopped.label');
    if (desc)  desc.textContent  = t('monitor.stopped.desc');
    if (visual) visual.classList.remove('running');
  }
}

function addMonitorFeed(type, icon, text) {
  const feed = document.getElementById('monitor-feed');
  if (!feed) return;
  const idle = feed.querySelector('.activity-idle');
  if (idle) idle.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const el = document.createElement('div');
  el.className = 'activity-msg ' + (type || 'step');
  el.innerHTML =
    `<span class="a-icon">${icon}</span>` +
    `<span class="a-body">` +
    `<span class="a-text">${escapeHtml(text)}</span>` +
    `<span class="a-time">${time}</span>` +
    `</span>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

function clearMonitorFeed() {
  const feed = document.getElementById('monitor-feed');
  if (!feed) return;
  feed.innerHTML =
    '<div class="activity-idle"><span class="idle-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span><span>' + escapeHtml(t('monitor.idle')) + '</span></div>';
}

// Monitor countdown card reference
let _monitorCountdownCard = null;

function routeMonitorMessage(msg) {
  const m = msg.toLowerCase();

  if (m.startsWith('page:')) {
    const page = msg.split(':')[1]?.trim();
    if (page !== 'scheduler') {
      addMonitorFeed('step', '◈', t('mon.nav') + ' (' + page + ')');
    }
    return;
  }

  if (m.startsWith('monitor_no_appts:')) {
    const secs = parseInt(msg.split(':')[1]) || 30;
    addMonitorFeed('wait', '✕', t('mon.no.appts'));
    _monitorCountdownCard = addMonitorFeed('wait', '◌', t('mon.retry') + secs + t('mon.retry.unit'));
    return;
  }

  if (m.startsWith('monitor_countdown:')) {
    const secs = parseInt(msg.split(':')[1]) || 0;
    if (_monitorCountdownCard) {
      _monitorCountdownCard.querySelector('.a-text').textContent =
        t('mon.retry') + secs + t('mon.retry.unit');
    }
    return;
  }

  if (m.startsWith('monitor_found:')) {
    const count = parseInt(msg.split(':')[1]) || 0;
    _monitorCountdownCard = null;
    addMonitorFeed('found', '◆', t('mon.found') + count);
    return;
  }

  if (m.includes('error') || m.includes('not found'))
    addMonitorFeed('error', '✕', msg);
}

// ─── Activity feed ────────────────────────────────────────────────────────────
// type: 'step' | 'success' | 'wait' | 'found' | 'error' | 'confirm'
function addActivity(type, icon, text) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  // Remove idle placeholder
  const idle = feed.querySelector('.activity-idle');
  if (idle) idle.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const el = document.createElement('div');
  el.className = 'activity-msg ' + (type || 'step');
  el.innerHTML =
    `<span class="a-icon">${icon}</span>` +
    `<span class="a-body">` +
    `<span class="a-text">${escapeHtml(text)}</span>` +
    `<span class="a-time">${time}</span>` +
    `</span>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

function clearActivity() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  feed.innerHTML = '<div class="activity-idle"><span class="idle-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span><span>' + escapeHtml(t('act.idle')) + '</span></div>';
}

// ─── Countdown card management ────────────────────────────────────────────────
let _countdownCardEl = null;
let _noApptCardEl    = null;

function routeBotMessage(msg) {
  const m = msg.toLowerCase();

  // ── Navigation steps ──
  if (m.includes('page detected: office')) {
    _noApptCardEl = null; _countdownCardEl = null;
    return addActivity('step', '◈', t('act.office.page'));
  }
  if (m.includes('office selected'))
    return addActivity('success', '✓', msg);

  if (m.includes('page detected: calendar'))
    return addActivity('step', '≡', t('act.calendar'));
  if (m.includes('reservation type selected'))
    return addActivity('success', '✓', msg);

  if (m.includes('page detected: persons'))
    return addActivity('step', '◉', t('act.persons'));
  if (m.includes('personcount'))
    return addActivity('success', '✅', t('act.persons.ok'));

  if (m.includes('page detected: info'))
    return addActivity('step', '◻', t('act.info'));

  if (m.includes('page detected: scheduler')) {
    _noApptCardEl = null; _countdownCardEl = null;
    return addActivity('step', '◷', t('act.scheduler'));
  }

  // ── No appointments + countdown ──
  if (m.startsWith('no_appointments:')) {
    const secs = parseInt(msg.split(':')[1]) || 30;
    _noApptCardEl = addActivityCard('wait', '✕', t('act.no.appts'));
    _countdownCardEl = addActivityCard('wait', '◌', t('act.retry') + secs + t('act.retry.unit'));
    return;
  }
  if (m.startsWith('countdown:')) {
    const secs = parseInt(msg.split(':')[1]) || 0;
    if (_countdownCardEl) {
      _countdownCardEl.querySelector('.a-text').textContent =
        t('act.retry') + secs + t('act.retry.unit');
    }
    return;
  }

  // ── Appointment found ──
  if (m.includes('appointment slot selected')) {
    _noApptCardEl = null; _countdownCardEl = null;
    const slotTime = msg.split('→')[1]?.trim() || '';
    return addActivity('found', '◆', t('act.found') + slotTime);
  }

  // ── Form ──
  if (m.includes('page detected: form'))
    return addActivity('step', '✎', t('act.form'));
  if (m.includes('form filled'))
    return addActivity('success', '✅', t('act.form.done'));
  if (m.includes('captcha solved'))
    return addActivity('success', '✓', t('act.captcha.ok') + msg.split('→')[1]?.trim());
  if (m.includes('no openai key') || m.includes('manual captcha'))
    return addActivity('wait', '⌨', t('act.captcha.manual'));

  // ── Nav retry ──
  if (m.startsWith('nav_retry:')) {
    const parts = msg.split(':');
    const secs = parseInt(parts[2]) || 5;
    return addActivity('wait', '↺', t('act.nav.retry') + secs + t('act.retry.unit'));
  }

  // ── Confirmation ──
  if (m.includes('booking confirmed'))
    return addActivity('confirm', '★', t('act.booked'));

  // ── Errors ──
  if (m.includes('error') || m.includes('not found'))
    return addActivity('error', '✕', msg);
}

// addActivityCard returns the DOM element (for updating)
function addActivityCard(type, icon, text) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return null;
  const idle = feed.querySelector('.activity-idle');
  if (idle) idle.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const el = document.createElement('div');
  el.className = 'activity-msg ' + (type || 'step');
  el.innerHTML =
    `<span class="a-icon">${icon}</span>` +
    `<span class="a-body">` +
    `<span class="a-text">${escapeHtml(text)}</span>` +
    `<span class="a-time">${time}</span>` +
    `</span>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

// ─── Status polling ───────────────────────────────────────────────────────────
function startStatusPolling() {
  if (!IS_ELECTRON) return;
  setInterval(async () => {
    try {
      const { running } = await window.electronAPI.getBotStatus();
      if (running !== botRunning) setBotState(running);
    } catch (_) {}
    try {
      const { running } = await window.electronAPI.getMonitorStatus();
      if (running !== monitorRunning) setMonitorState(running);
    } catch (_) {}
  }, 2000);
}

function setBotState(running) {
  botRunning = running;

  const startBtn  = document.getElementById('start-btn');
  const stopBtn   = document.getElementById('stop-btn');
  const label     = document.getElementById('bot-state-label');
  const desc      = document.getElementById('bot-state-desc');
  const visual    = document.getElementById('bot-animation');
  const dot       = document.querySelector('.status-dot');
  const statusTxt = document.getElementById('status-text');

  if (running) {
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    label.textContent = t('bot.running.label');
    desc.textContent  = t('bot.running.desc');
    visual.classList.add('running');
    dot.className     = 'status-dot running';
    statusTxt.textContent = t('status.running');
  } else {
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    label.textContent = t('bot.stopped.label');
    desc.textContent  = t('bot.stopped.desc');
    visual.classList.remove('running');
    dot.className     = 'status-dot stopped';
    statusTxt.textContent = t('status.stopped');
  }
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
function addLog(type, msg) {
  const container = document.getElementById('logs-container');
  const empty = container.querySelector('.log-empty');
  if (empty) empty.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const line = document.createElement('div');
  line.className = 'log-line ' + (type || 'info');
  line.innerHTML =
    `<span class="log-time">${time}</span><span class="log-msg">${escapeHtml(msg)}</span>`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function clearLogs() {
  document.getElementById('logs-container').innerHTML =
    '<div class="log-empty" data-i18n="log.empty">' + escapeHtml(t('log.empty')) + '</div>';
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function getField(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (!el || val === undefined || val === null || val === '') return;
  el.value = val;
}

function showSaved(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function toggleApiVisibility() {
  const input = document.getElementById('s-openai-key');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function updateInfoCards(stored) {
  if (!stored) return;
  const p = stored.person   || {};
  const s = stored.settings || {};
  const el = id => document.getElementById(id);

  const name = ((p.firstname || '') + ' ' + (p.lastname || '')).trim();
  if (el('display-name'))    el('display-name').textContent    = name || '—';
  if (el('display-api'))     el('display-api').textContent     = s.openaiApiKey ? t('display.api.set') : t('display.api.unset');
  if (el('display-office'))  el('display-office').textContent  = s.office || 'KAIRO';
  if (el('display-type'))    el('display-type').textContent    = s.reservationType || 'Bachelor';
  if (el('display-refresh')) el('display-refresh').textContent = (s.refreshIntervalSec || 30) + 's';
}

// ─── Booking success celebration ──────────────────────────────────────────────
function showBookingSuccess() {
  const overlay = document.getElementById('booking-success-overlay');
  if (overlay) overlay.style.display = 'flex';
  playCelebrationSound();
  addActivity('confirm', '🎉', t('booking.success.title'));
  // Auto-hide overlay after bot closes (6s)
  setTimeout(() => {
    if (overlay) overlay.style.display = 'none';
  }, 6000);
}

function playCelebrationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    function tone(freq, start, dur, vol, type) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type || 'sine';
      gain.gain.setValueAtTime(vol, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    }
    // Triumphant fanfare
    tone(523, 0,    0.15, 0.5); tone(659, 0.10, 0.15, 0.5); tone(784, 0.20, 0.15, 0.5);
    tone(1047,0.32, 0.4,  0.6); tone(784, 0.55, 0.2,  0.4); tone(1047,0.65, 0.55, 0.5);
    tone(1319,0.70, 0.15, 0.4); tone(1047,0.80, 0.6,  0.5);
  } catch (_) {}
}

// ─── Restart Bot ──────────────────────────────────────────────────────────────
async function restartBot() {
  if (IS_ELECTRON) {
    await window.electronAPI.stopBot();
  }
  setBotState(false);
  addActivity('warn', '↺', t('act.restart'));
  setTimeout(() => startBot(), 800);
}

// ─── Multi-Session management ─────────────────────────────────────────────────
const MAX_SESSIONS = 10;
const MIN_SESSIONS = 5;
const MAX_STEALTH  = 2;

let _sessions       = [];
let _sessionRunning = {}; // id -> bool

const SESSION_COLORS = [
  '#7986cb','#4db6ac','#ff8a65','#81c784',
  '#ce93d8','#ffb74d','#64b5f6','#f06292',
  '#a5d6a7','#ffcc02'
];

function sessionColor(id) {
  return SESSION_COLORS[(id - 1) % SESSION_COLORS.length];
}

function makeDefaultSession(id, type = null) {
  // Auto-assign type if not specified
  if (!type) {
    type = id <= 2 ? 'stealth' : 'normal';
  }

  let refreshSec = 30;
  let delayMs = 800;

  if (type === 'stealth') {
    refreshSec = 15;
    delayMs = 400;
  } else if (type === 'rocket') {
    refreshSec = 5;
    delayMs = 100;  // ultra-fast
  }

  return {
    id,
    name: type === 'rocket' ? `🚀 صاروخ ${id}` : `جلسة ${id}`,
    type,
    office: '',
    reservationType: '',
    refreshIntervalSec: refreshSec,
    navigationDelayMs: delayMs,
    targetUrl: '',
    slotPreference: String(id <= 10 ? id : 1)
  };
}

async function loadSessions() {
  try {
    let stored = [];
    if (IS_ELECTRON) {
      stored = await window.electronAPI.getSessions();
    } else {
      stored = JSON.parse(localStorage.getItem('orbtasoft_sessions') || '[]');
    }
    _sessions = Array.isArray(stored) && stored.length ? stored : [];

    // Ensure all sessions have slotPreference (migration for old sessions)
    _sessions.forEach(sess => {
      if (!sess.slotPreference) sess.slotPreference = String(sess.id <= 10 ? sess.id : 1);
    });

    while (_sessions.length < MIN_SESSIONS) {
      _sessions.push(makeDefaultSession(_sessions.length + 1));
    }
    renderSessionCards();
  } catch (e) {
    console.error('Error loading sessions:', e);
  }
}

async function _persistSessions() {
  try {
    if (IS_ELECTRON) {
      await window.electronAPI.saveSessions(_sessions);
    } else {
      localStorage.setItem('orbtasoft_sessions', JSON.stringify(_sessions));
    }
  } catch (e) {
    console.error('Error saving sessions:', e);
  }
}

function stealthCount() {
  return _sessions.filter(s => s.type === 'stealth').length;
}

function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSessionCards() {
  const grid = document.getElementById('sessions-grid');
  if (!grid) return;
  grid.innerHTML = '';

  _sessions.forEach(sess => {
    const running = !!_sessionRunning[sess.id];
    const isRocket = sess.type === 'rocket';
    const isStealth = sess.type === 'stealth';

    let cardClass = 'session-card';
    if (isStealth) cardClass += ' session-stealth';
    if (isRocket) cardClass += ' session-rocket';

    let typeLabel = '🌐 عادي';
    let typeTitle = 'عادية — نافذة مرئية';
    let typeBtnClass = 'normal';

    if (isStealth) {
      typeLabel = '🔒 خفي';
      typeTitle = 'خفية — بدون نافذة مرئية';
      typeBtnClass = 'stealth';
    } else if (isRocket) {
      typeLabel = '🚀 صاروخ';
      typeTitle = 'صاروخ — سرعة قصوى';
      typeBtnClass = 'rocket';
    }

    const card = document.createElement('div');
    card.className = cardClass;
    card.id = `session-card-${sess.id}`;
    card.innerHTML = `
      <div class="session-card-header">
        <div class="session-name-wrap">
          <span class="session-status-indicator ${running ? 'running' : 'stopped'}" id="sess-${sess.id}-dot"></span>
          <input type="text" class="session-name-input" id="sess-${sess.id}-name"
                 value="${escAttr(sess.name)}"
                 onchange="onSessNameChange(${sess.id}, this.value)" />
        </div>
        <button class="session-type-btn ${typeBtnClass}"
                onclick="toggleSessionType(${sess.id})"
                title="${typeTitle}">
          ${typeLabel}
        </button>
      </div>

      <div class="session-fields">
        <div class="session-field-row">
          <label>المنظمة (Office)</label>
          <input type="text" class="session-input" id="sess-${sess.id}-office"
                 value="${escAttr(sess.office)}" placeholder="KAIRO" />
        </div>
        <div class="session-field-row">
          <label>نوع الحجز</label>
          <input type="text" class="session-input" id="sess-${sess.id}-restype"
                 value="${escAttr(sess.reservationType)}" placeholder="Bachelor" />
        </div>
        <div class="session-field-row">
          <label>الموعد المفضل</label>
          <select class="session-input" id="sess-${sess.id}-slot">
            <option value="1" ${sess.slotPreference === '1' ? 'selected' : ''}>الموعد الأول</option>
            <option value="2" ${sess.slotPreference === '2' ? 'selected' : ''}>الموعد الثاني</option>
            <option value="3" ${sess.slotPreference === '3' ? 'selected' : ''}>الموعد الثالث</option>
            <option value="4" ${sess.slotPreference === '4' ? 'selected' : ''}>الموعد الرابع</option>
            <option value="5" ${sess.slotPreference === '5' ? 'selected' : ''}>الموعد الخامس</option>
            <option value="6" ${sess.slotPreference === '6' ? 'selected' : ''}>الموعد السادس</option>
            <option value="7" ${sess.slotPreference === '7' ? 'selected' : ''}>الموعد السابع</option>
            <option value="8" ${sess.slotPreference === '8' ? 'selected' : ''}>الموعد الثامن</option>
            <option value="9" ${sess.slotPreference === '9' ? 'selected' : ''}>الموعد التاسع</option>
            <option value="10" ${sess.slotPreference === '10' ? 'selected' : ''}>الموعد العاشر</option>
            <option value="random" ${sess.slotPreference === 'random' ? 'selected' : ''}>عشوائي</option>
            <option value="any" ${sess.slotPreference === 'any' ? 'selected' : ''}>أي موعد متاح</option>
          </select>
        </div>
        <div class="session-field-row two-col">
          <div>
            <label>إعادة البحث (ث)</label>
            <input type="number" class="session-input" id="sess-${sess.id}-refresh"
                   value="${sess.refreshIntervalSec}" min="5" step="5" />
          </div>
          <div>
            <label>تأخير التنقل (ms)</label>
            <input type="number" class="session-input" id="sess-${sess.id}-delay"
                   value="${sess.navigationDelayMs}" min="200" step="100" />
          </div>
        </div>
      </div>

      <div class="session-card-actions">
        <button class="btn-sess-start" id="sess-${sess.id}-start-btn"
                onclick="startSession(${sess.id})" ${running ? 'disabled' : ''}>▶ تشغيل</button>
        <button class="btn-sess-stop" id="sess-${sess.id}-stop-btn"
                onclick="stopSession(${sess.id})" ${running ? '' : 'disabled'}>■ إيقاف</button>
        <button class="btn-sess-icon" onclick="saveSessionCard(${sess.id})" title="حفظ الإعدادات">💾</button>
        <button class="btn-sess-icon" id="sess-${sess.id}-delete-btn"
                onclick="deleteSession(${sess.id})" ${running ? 'disabled' : ''} title="حذف الجلسة">🗑</button>
      </div>`;

    grid.appendChild(card);
  });

  // Update toolbar count
  const countEl = document.getElementById('sessions-count');
  if (countEl) {
    const sc = stealthCount();
    const rc = _sessions.filter(s => s.type === 'rocket').length;
    let label = `${_sessions.length} جلسات`;
    if (sc > 0) label += ` (${sc} خفية)`;
    if (rc > 0) label += ` (${rc} صاروخ)`;
    countEl.textContent = label;
  }
  // Disable add stealth button if max reached
  const addStealthBtn = document.getElementById('sessions-add-stealth-btn');
  if (addStealthBtn) addStealthBtn.disabled = stealthCount() >= MAX_STEALTH;
}

function onSessNameChange(id, val) {
  const sess = _sessions.find(s => s.id === id);
  if (sess) sess.name = val.trim() || sess.name;
}

function toggleSessionType(id) {
  const sess = _sessions.find(s => s.id === id);
  if (!sess) return;

  // Cycle: normal → stealth → rocket → normal
  if (sess.type === 'normal') {
    if (stealthCount() >= MAX_STEALTH) {
      // Skip stealth, go to rocket
      sess.type = 'rocket';
      sess.refreshIntervalSec = 5;
      sess.navigationDelayMs  = 100;
      sess.name = `🚀 صاروخ ${sess.id}`;
    } else {
      sess.type = 'stealth';
      sess.refreshIntervalSec = 15;
      sess.navigationDelayMs  = 400;
      sess.name = `جلسة ${sess.id}`;
    }
  } else if (sess.type === 'stealth') {
    sess.type = 'rocket';
    sess.refreshIntervalSec = 5;
    sess.navigationDelayMs  = 100;
    sess.name = `🚀 صاروخ ${sess.id}`;
  } else if (sess.type === 'rocket') {
    sess.type = 'normal';
    sess.refreshIntervalSec = 30;
    sess.navigationDelayMs  = 800;
    sess.name = `جلسة ${sess.id}`;
  }

  renderSessionCards();
}

// ───────────────────────────────────────────────────────────────────────────
// Grid Session
// ───────────────────────────────────────────────────────────────────────────
async function openGridSettings() {
  if (window.electronAPI) {
    const result = await window.electronAPI.openGridSettings();
    if (!result.success) {
      console.error('Failed to open grid settings:', result.message);
    }
  }
}

async function addSession(type = 'normal') {
  if (_sessions.length >= MAX_SESSIONS) return;
  if (type === 'stealth' && stealthCount() >= MAX_STEALTH) {
    alert(`الحد الأقصى للجلسات الخفية هو ${MAX_STEALTH}`);
    return;
  }
  const nextId = (_sessions.length ? Math.max(..._sessions.map(s => s.id)) : 0) + 1;
  _sessions.push(makeDefaultSession(nextId, type));
  renderSessionCards();
  await _persistSessions();
}

async function deleteSession(id) {
  if (_sessions.length <= MIN_SESSIONS) {
    addSessionLog(id, 'error', `الحد الأدنى ${MIN_SESSIONS} جلسات`);
    return;
  }
  if (_sessionRunning[id]) {
    addSessionLog(id, 'error', 'أوقف الجلسة قبل الحذف');
    return;
  }
  _sessions = _sessions.filter(s => s.id !== id);
  renderSessionCards();
  await _persistSessions();
}

function _collectSession(id) {
  const sess = _sessions.find(s => s.id === id);
  if (!sess) return null;
  const office  = document.getElementById(`sess-${id}-office`)?.value.trim()  || sess.office;
  const restype = document.getElementById(`sess-${id}-restype`)?.value.trim() || sess.reservationType;
  const refresh = parseInt(document.getElementById(`sess-${id}-refresh`)?.value) || sess.refreshIntervalSec;
  const delay   = parseInt(document.getElementById(`sess-${id}-delay`)?.value)   || sess.navigationDelayMs;
  const name    = document.getElementById(`sess-${id}-name`)?.value.trim()       || sess.name;
  const slot    = document.getElementById(`sess-${id}-slot`)?.value             || sess.slotPreference;
  return { ...sess, office, reservationType: restype, refreshIntervalSec: refresh, navigationDelayMs: delay, name, slotPreference: slot };
}

async function saveSessionCard(id) {
  const latest = _collectSession(id);
  if (!latest) return;
  const sess = _sessions.find(s => s.id === id);
  if (sess) Object.assign(sess, latest);
  await _persistSessions();
  // Brief visual feedback
  const btn = document.querySelector(`#session-card-${id} .btn-sess-icon`);
  if (btn) { const orig = btn.textContent; btn.textContent = '✓'; setTimeout(() => { btn.textContent = orig; }, 900); }
}

async function startSession(id) {
  const sessConfig = _collectSession(id);
  if (!sessConfig) return;

  const stored = await Storage.get();
  const p = stored.person   || {};
  const s = stored.settings || {};

  const config = {
    type:      sessConfig.type,
    targetUrl: sessConfig.targetUrl || s.targetUrl || 'https://appointment.bmeia.gv.at/',
    person:    p,
    settings: {
      office:             sessConfig.office             || s.office             || 'KAIRO',
      reservationType:    sessConfig.reservationType    || s.reservationType    || 'Bachelor',
      refreshIntervalSec: sessConfig.refreshIntervalSec,
      navigationDelayMs:  sessConfig.navigationDelayMs,
      openaiApiKey:       s.openaiApiKey       || '',
      notificationSound:  s.notificationSound  || 'beep',
      customSoundB64:     s.customSoundB64     || '',
      slotPreferences:    [sessConfig.slotPreference || '1'],  // each session has its own slot preference
      navRetryIntervalSec: s.navRetryIntervalSec || 5
    }
  };

  if (!IS_ELECTRON) {
    addSessionLog(id, 'error', 'الجلسات المتعددة تحتاج تطبيق Desktop');
    return;
  }

  const result = await window.electronAPI.startSession(id, config);
  if (result.success) {
    _sessionRunning[id] = true;
    updateSessionButtons(id, true);
    addSessionLog(id, 'success', `▶ الجلسة ${id} انطلقت — ${sessConfig.type === 'stealth' ? 'خفية بلا نافذة' : 'عادية مع نافذة'}`);
    // Update stored session name/office in case changed
    const sess = _sessions.find(s => s.id === id);
    if (sess) Object.assign(sess, sessConfig);
    await _persistSessions();
  } else {
    addSessionLog(id, 'error', 'خطأ في التشغيل: ' + (result.message || ''));
  }
}

async function stopSession(id) {
  if (IS_ELECTRON) await window.electronAPI.stopSession(id);
  _sessionRunning[id] = false;
  updateSessionButtons(id, false);
  addSessionLog(id, 'warn', `■ الجلسة ${id} توقفت`);
}

function updateSessionButtons(id, running) {
  const dot       = document.getElementById(`sess-${id}-dot`);
  const startBtn  = document.getElementById(`sess-${id}-start-btn`);
  const stopBtn   = document.getElementById(`sess-${id}-stop-btn`);
  const deleteBtn = document.getElementById(`sess-${id}-delete-btn`);
  if (dot)       dot.className = `session-status-indicator ${running ? 'running' : 'stopped'}`;
  if (startBtn)  startBtn.disabled  = running;
  if (stopBtn)   stopBtn.disabled   = !running;
  if (deleteBtn) deleteBtn.disabled = running;
}

function addSessionLog(id, type, msg) {
  const sess      = _sessions.find(s => s.id === id);
  const isStealth = sess?.type === 'stealth';
  const cid       = isStealth ? 'sessions-stealth-log' : 'sessions-normal-log';
  const container = document.getElementById(cid);
  if (!container) return;

  const empty = container.querySelector('.log-empty');
  if (empty) empty.remove();

  const time  = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const entry = document.createElement('div');
  entry.className = `session-log-entry ${type}`;
  entry.innerHTML =
    `<span class="log-time">${time}</span>` +
    `<span class="log-session-badge" style="color:${sessionColor(id)}">ج${id}</span>` +
    `<span class="log-msg">${escapeHtml(msg)}</span>`;

  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function clearNormalLog() {
  const c = document.getElementById('sessions-normal-log');
  if (c) c.innerHTML = '<p class="log-empty">لا يوجد نشاط بعد — شغّل إحدى الجلسات العادية</p>';
}

function clearStealthLog() {
  const c = document.getElementById('sessions-stealth-log');
  if (c) c.innerHTML = '<p class="log-empty">لا يوجد نشاط بعد — شغّل إحدى الجلستين الخفيتين</p>';
}
