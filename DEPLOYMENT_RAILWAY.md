# 🚀 نقل Bookfolloxa من Replit إلى Railway.app

## لماذا Railway؟
✅ **غير محظور في سوريا والشرق الأوسط**  
✅ سريع وسهل الاستخدام  
✅ دعم PostgreSQL مدمج  
✅ SSL مجاني  
✅ نشر تلقائي من GitHub  

---

## 💰 التكلفة
- **Railway**: $5/شهر (Hobby Plan)
- **Domain** (اختياري): $10/سنة
- **المجموع**: ~$70/سنة

---

## 📋 الخطوات (خطوة بخطوة)

### **المرحلة 1: تحضير الكود**

#### 1.1 تحميل الكود من Replit
```bash
# في Replit Shell
git init
git add .
git commit -m "Prepare for Railway deployment"

# أو حمّل المشروع كملف ZIP من Replit
```

#### 1.2 رفع الكود على GitHub
1. اذهب إلى https://github.com/new
2. أنشئ repository جديد (مثلاً: `bookfolloxa-bot`)
3. في terminal/shell:
```bash
git remote add origin https://github.com/YOUR_USERNAME/bookfolloxa-bot.git
git branch -M main
git push -u origin main
```

---

### **المرحلة 2: إنشاء حساب على Railway**

#### 2.1 التسجيل
1. اذهب إلى https://railway.app
2. اضغط **"Login"** → سجّل دخول بحساب GitHub
3. اربط حساب GitHub الخاص بك

#### 2.2 إنشاء مشروع جديد
1. اضغط **"New Project"**
2. اختر **"Deploy from GitHub repo"**
3. اختر repository: `bookfolloxa-bot`
4. Railway سيبدأ النشر تلقائياً (سيفشل الآن - طبيعي!)

---

### **المرحلة 3: إعداد قاعدة البيانات**

#### 3.1 إضافة PostgreSQL
1. في مشروعك على Railway، اضغط **"+ New"**
2. اختر **"Database"** → **"Add PostgreSQL"**
3. انتظر حتى تنشأ قاعدة البيانات

#### 3.2 نسخ رابط الاتصال
1. اضغط على PostgreSQL service
2. اذهب إلى **"Variables"** tab
3. انسخ **"DATABASE_URL"** (مثال: `postgresql://postgres:password@server.railway.app:5432/railway`)

---

### **المرحلة 4: إعداد المتغيرات البيئية (Environment Variables)**

#### 4.1 في Railway Project
1. اضغط على **service الرئيسي** (bookfolloxa-bot)
2. اذهب إلى **"Variables"** tab
3. أضف المتغيرات التالية:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
DATABASE_URL=${{Postgres.DATABASE_URL}}
WALLET_PAY_TOKEN=your_wallet_pay_token_here
PORT=5000
```

**ملاحظات مهمة:**
- **TELEGRAM_BOT_TOKEN**: احصل عليه من @BotFather على Telegram
- **DATABASE_URL**: اكتب `${{Postgres.DATABASE_URL}}` بالضبط (Railway سيستبدله تلقائياً)
- **PORT**: اتركه 5000

---

### **المرحلة 5: تحديث رابط WebApp في الكود**

#### 5.1 احصل على رابط Railway
1. في Railway service، اذهب لـ **"Settings"** tab
2. تحت **"Environment"** → **"Domains"**
3. اضغط **"Generate Domain"**
4. انسخ الرابط (مثال: `bookfolloxa-production.up.railway.app`)

#### 5.2 حدّث main.py
في ملف `main.py`، سطر 48 تقريباً:

**قبل:**
```python
webapp_url = 'https://raaik-hal-tastaie-anass111173.replit.app/webapp/'
```

**بعد:**
```python
webapp_url = 'https://bookfolloxa-production.up.railway.app/webapp/'
```

#### 5.3 ارفع التغييرات
```bash
git add main.py
git commit -m "Update webapp URL for Railway"
git push
```

Railway سيعيد النشر تلقائياً! 🎉

---

### **المرحلة 6: إعداد Webhook للبوت**

#### 6.1 إيقاف البوت على Replit
في Replit:
```bash
# أوقف الـ workflow
# أو احذف الـ webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

#### 6.2 تفعيل Railway
انتظر حتى ينتهي النشر على Railway (شيك **"Deployments"** tab)

#### 6.3 اختبار البوت
1. افتح Telegram
2. ابحث عن البوت الخاص بك
3. اكتب `/start`
4. اضغط **"🎮 Play Now"**

**يجب أن تفتح اللعبة بدون مشاكل!** 🎊

---

## 🔧 استكشاف الأخطاء (Troubleshooting)

### ❌ البوت لا يرد
**الحل:**
```bash
# تحقق من الـ logs في Railway:
# اذهب لـ "Deployments" → اختر آخر deployment → شاهد logs

# تأكد من Webhook:
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### ❌ خطأ قاعدة البيانات
**الحل:**
- تأكد أن `DATABASE_URL` صحيح في Variables
- تأكد أن PostgreSQL service شغال (أخضر)

### ❌ اللعبة لا تفتح (404)
**الحل:**
- تحقق من `webapp_url` في `main.py`
- تأكد أن مجلد `webapp/` موجود في المشروع

---

## 🌐 إضافة Domain مخصص (اختياري)

### 7.1 شراء Domain
من Namecheap، GoDaddy، أو Cloudflare

### 7.2 إعداد DNS
في لوحة تحكم Domain الخاص بك:
```
Type: CNAME
Name: @
Value: bookfolloxa-production.up.railway.app
```

### 7.3 إضافة Domain في Railway
1. في **"Settings"** → **"Domains"**
2. اضغط **"Custom Domain"**
3. أدخل domain الخاص بك: `bookfolloxa.com`
4. انتظر حتى يتم التحقق (DNS propagation)

### 7.4 تحديث main.py مرة أخرى
```python
webapp_url = 'https://bookfolloxa.com/webapp/'
```

---

## ✅ Checklist النهائي

قبل ما تنتهي، تأكد:

- [ ] الكود على GitHub
- [ ] PostgreSQL شغال على Railway
- [ ] Environment Variables كلها صحيحة
- [ ] `webapp_url` محدّث في `main.py`
- [ ] البوت يرد على `/start`
- [ ] اللعبة تفتح بدون أخطاء
- [ ] الدفع بـ Telegram Stars يشتغل
- [ ] Webhook active (تحقق بـ getWebhookInfo)

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. شيك الـ **logs** في Railway (Deployments tab)
2. تحقق من **Environment Variables**
3. تأكد أن **PostgreSQL** شغال
4. راجع **webhook status** بـ Telegram API

---

## 🎉 مبروك!

اللعبة الآن شغالة على Railway وتشتغل من سوريا بدون VPN! 🚀

**روابط مهمة:**
- Railway Dashboard: https://railway.app/dashboard
- Telegram Bot API: https://core.telegram.org/bots/api
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**ملاحظة:** Railway يعطيك $5 credit مجاني شهرياً في البداية، لكن بعدين لازم تضيف بطاقة دفع.
