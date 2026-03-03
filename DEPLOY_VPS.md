# تشغيل Orbtasoft على VPS Hostinger

## 📋 المتطلبات

- VPS Hostinger (Ubuntu 20.04+ أو CentOS 8+)
- SSH access
- Domain (اختياري)

---

## 🚀 خطوات التنصيب السريع

### 1️⃣ الاتصال بالـ VPS

```bash
ssh root@your-vps-ip
```

---

### 2️⃣ تحديث السيرفر

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/AlmaLinux/Rocky
dnf update -y
```

---

### 3️⃣ تنصيب Node.js 18+

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# CentOS/AlmaLinux/Rocky
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# تأكد من النسخة
node -v  # يجب أن تكون >= 18.x
npm -v
```

---

### 4️⃣ تنصيب المكتبات المطلوبة

#### Ubuntu/Debian:
```bash
apt install -y \
  git \
  xvfb \
  libgtk-3-0 \
  libgbm1 \
  libnss3 \
  libxss1 \
  libasound2 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm-dev \
  libpango-1.0-0 \
  libcairo2
```

#### CentOS/AlmaLinux/Rocky:
```bash
dnf install -y \
  git \
  xorg-x11-server-Xvfb \
  gtk3 \
  nss \
  libXScrnSaver \
  libXtst \
  xdg-utils \
  at-spi2-core \
  mesa-libgbm \
  alsa-lib \
  libdrm \
  libxkbcommon \
  libXcomposite \
  libXdamage \
  libXfixes \
  libXrandr \
  pango \
  cairo
```

---

### 5️⃣ استنساخ المشروع

```bash
cd /opt
git clone <repository-url> orbtasoft
cd orbtasoft
npm install
```

---

### 6️⃣ إعداد ملف الإعدادات

قم بإنشاء ملف `.env` للإعدادات:

```bash
nano /opt/orbtasoft/.env
```

أضف:
```env
# License key
LICENSE_KEY=your-license-key-here

# Bot settings (optional - يمكن ضبطها من الواجهة)
OFFICE=KAIRO
RESERVATION_TYPE=Bachelor
REFRESH_INTERVAL=30
NAV_DELAY=800

# OpenAI key for CAPTCHA solving (optional)
OPENAI_API_KEY=your-openai-key-here
```

احفظ بـ `Ctrl+O` ثم `Enter` ثم `Ctrl+X`

---

## 🖥️ طريقة التشغيل

### الطريقة 1: Xvfb (Headless - موصى بها)

#### تشغيل مباشر:
```bash
cd /opt/orbtasoft
xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" npm start
```

#### تشغيل في الخلفية:
```bash
nohup xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" npm start > /var/log/orbtasoft.log 2>&1 &
```

#### التحقق من التشغيل:
```bash
ps aux | grep electron
tail -f /var/log/orbtasoft.log
```

---

### الطريقة 2: PM2 (موصى بها للإنتاج)

#### تنصيب PM2:
```bash
npm install -g pm2
```

#### إنشاء ملف ecosystem:
```bash
nano /opt/orbtasoft/ecosystem.config.js
```

أضف:
```javascript
module.exports = {
  apps: [{
    name: 'orbtasoft-bot',
    script: 'src/main.js',
    interpreter: 'node',
    interpreter_args: '--no-deprecation',
    env: {
      NODE_ENV: 'production',
      DISPLAY: ':99'
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/log/orbtasoft-error.log',
    out_file: '/var/log/orbtasoft-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

#### بدء Xvfb + PM2:
```bash
# بدء Xvfb
Xvfb :99 -screen 0 1920x1080x24 &

# بدء التطبيق بـ PM2
cd /opt/orbtasoft
pm2 start ecosystem.config.js

# حفظ قائمة العمليات
pm2 save

# تفعيل التشغيل التلقائي عند إعادة تشغيل السيرفر
pm2 startup
# نفذ الأمر الذي سيظهر لك
```

#### أوامر PM2 المفيدة:
```bash
pm2 list                    # عرض كل العمليات
pm2 logs orbtasoft-bot      # عرض اللوجات
pm2 restart orbtasoft-bot   # إعادة تشغيل
pm2 stop orbtasoft-bot      # إيقاف
pm2 delete orbtasoft-bot    # حذف من PM2
pm2 monit                   # مراقبة مباشرة
```

---

### الطريقة 3: Systemd Service

#### إنشاء ملف service:
```bash
nano /etc/systemd/system/orbtasoft.service
```

أضف:
```ini
[Unit]
Description=Orbtasoft Appointment Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/orbtasoft
Environment="DISPLAY=:99"
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1920x1080x24 &
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:/var/log/orbtasoft.log
StandardError=append:/var/log/orbtasoft-error.log

[Install]
WantedBy=multi-user.target
```

#### تفعيل وتشغيل:
```bash
systemctl daemon-reload
systemctl enable orbtasoft
systemctl start orbtasoft
systemctl status orbtasoft

# عرض اللوجات
journalctl -u orbtasoft -f
```

---

## 🔧 إدارة الجلسات المتعددة

### تشغيل عدة جلسات في نفس الوقت

إذا كنت تريد تشغيل 5 جلسات مثلاً، أنشئ 5 خدمات منفصلة:

```bash
# جلسة 1
nano /etc/systemd/system/orbtasoft-session1.service
```

```ini
[Unit]
Description=Orbtasoft Session 1
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/orbtasoft
Environment="DISPLAY=:99"
Environment="SESSION_ID=1"
ExecStart=/usr/bin/xvfb-run --auto-servernum npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

كرر لـ session2, session3, إلخ.

```bash
systemctl daemon-reload
systemctl enable orbtasoft-session{1..5}
systemctl start orbtasoft-session{1..5}
```

---

## 📊 مراقبة الأداء

### استخدام htop:
```bash
apt install htop -y  # Ubuntu
dnf install htop -y  # CentOS

htop
```

### مراقبة استهلاك الذاكرة:
```bash
free -h
```

### مراقبة المساحة:
```bash
df -h
```

### مراقبة اللوجات:
```bash
tail -f /var/log/orbtasoft.log
```

---

## 🔐 الأمان

### 1. Firewall (UFW):
```bash
# Ubuntu
apt install ufw -y
ufw allow ssh
ufw allow 80/tcp   # إذا كنت ستستخدم واجهة ويب
ufw allow 443/tcp
ufw enable
ufw status
```

### 2. Fail2Ban:
```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. تحديث منتظم:
```bash
# أضف cron job للتحديثات الأمنية
crontab -e
```

أضف:
```cron
0 2 * * * apt update && apt upgrade -y
```

---

## 🌐 إعداد Domain (اختياري)

### 1. تثبيت Nginx:
```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### 2. إعداد reverse proxy:
```bash
nano /etc/nginx/sites-available/orbtasoft
```

أضف:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/orbtasoft /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. SSL مع Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

---

## 🐛 حل المشاكل

### مشكلة: "Cannot open display"
```bash
# تأكد من تشغيل Xvfb
ps aux | grep Xvfb

# إذا لم يكن يعمل:
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99
```

### مشكلة: "libgbm.so: cannot open shared object"
```bash
# Ubuntu
apt install libgbm1 libgbm-dev -y

# CentOS
dnf install mesa-libgbm -y
```

### مشكلة: Out of Memory
```bash
# إنشاء swap file (2GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### مشكلة: الكابتشا لا تُحل
تأكد من:
1. `OPENAI_API_KEY` مضبوط في `.env`
2. لديك رصيد في حساب OpenAI API
3. الانترنت يعمل على السيرفر

```bash
curl -I https://api.openai.com
```

---

## 📈 تحسين الأداء

### 1. زيادة حد ملفات النظام:
```bash
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf
```

### 2. تحسين إعدادات Node.js:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. تنظيف اللوجات القديمة:
```bash
# أضف cron job
crontab -e
```

أضف:
```cron
0 0 * * 0 find /var/log -name "orbtasoft*.log" -mtime +7 -delete
```

---

## 🔄 التحديث

```bash
cd /opt/orbtasoft

# حفظ الإعدادات
cp -r ~/.config/Orbtasoft* ~/orbtasoft-backup/

# تحديث الكود
git pull origin main
npm install

# إعادة تشغيل
pm2 restart orbtasoft-bot
# أو
systemctl restart orbtasoft
```

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من اللوجات: `journalctl -u orbtasoft -n 100`
2. تحقق من PM2: `pm2 logs orbtasoft-bot`
3. تحقق من موارد السيرفر: `htop`
4. راسل الدعم: https://orbtasoft.com/support

---

## ✅ Checklist التثبيت

- [ ] VPS جاهز مع Ubuntu/CentOS
- [ ] Node.js 18+ منصّب
- [ ] المكتبات المطلوبة منصّبة (Xvfb, gtk3, etc.)
- [ ] المشروع مستنسخ في `/opt/orbtasoft`
- [ ] `npm install` تم تنفيذه
- [ ] ملف `.env` معدّل بالإعدادات
- [ ] Xvfb يعمل
- [ ] PM2 أو systemd service معدّ
- [ ] التطبيق يعمل: `pm2 status` أو `systemctl status orbtasoft`
- [ ] اللوجات تظهر بدون أخطاء: `pm2 logs` أو `journalctl -u orbtasoft`
- [ ] Firewall معدّ
- [ ] (اختياري) Domain + SSL معدّ

---

**ملاحظة:** Hostinger VPS عادة يأتي مع Ubuntu 20.04 أو 22.04، فالتعليمات أعلاه متوافقة مع معظم خطط Hostinger.

للمساعدة: https://orbtasoft.com | البريد: support@orbtasoft.com
