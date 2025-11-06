# ✅ قائمة نقل Bookfolloxa إلى Railway - خطوات سريعة

## قبل ما تبدأ
- [ ] عندك حساب GitHub
- [ ] عندك بطاقة دفع (Visa/Mastercard) للـ Railway

---

## الخطوات الرئيسية (30 دقيقة)

### 1️⃣ رفع الكود على GitHub (5 دقائق)
```bash
# في Replit Shell
git init
git add .
git commit -m "Prepare for Railway"
git remote add origin https://github.com/YOUR_USERNAME/bookfolloxa-bot.git
git push -u origin main
```

**أو** حمّل ZIP من Replit ورفعه يدوياً على GitHub

---

### 2️⃣ Railway - إنشاء مشروع (5 دقائق)
1. https://railway.app → Login بـ GitHub
2. **New Project** → **Deploy from GitHub repo**
3. اختر `bookfolloxa-bot`

---

### 3️⃣ PostgreSQL - إضافة قاعدة بيانات (2 دقائق)
1. في المشروع → **+ New** → **Database** → **PostgreSQL**
2. انتظر حتى تنشأ

---

### 4️⃣ Environment Variables (5 دقائق)
اضغط على service الرئيسي → **Variables** → أضف:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
DATABASE_URL=${{Postgres.DATABASE_URL}}
WALLET_PAY_TOKEN=your_wallet_pay_token_here
PORT=5000
```

**احصل على TELEGRAM_BOT_TOKEN:**
- Telegram → ابحث عن @BotFather
- `/mybots` → اختر بوتك → **API Token**

---

### 5️⃣ تحديث رابط WebApp (5 دقائق)

**في Railway:**
- **Settings** → **Domains** → **Generate Domain**
- انسخ الرابط: `bookfolloxa-production.up.railway.app`

**في GitHub:**
- افتح `main.py` → سطر 48
- غيّر من:
  ```python
  webapp_url = 'https://raaik-hal-tastaie-anass111173.replit.app/webapp/'
  ```
- إلى:
  ```python
  webapp_url = 'https://bookfolloxa-production.up.railway.app/webapp/'
  ```
- **Commit and Push**

---

### 6️⃣ إيقاف Replit وتفعيل Railway (5 دقائق)

**إيقاف Replit Webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

**انتظر Railway ينشر** (شيك Deployments tab - لازم يكون أخضر ✅)

---

### 7️⃣ اختبار البوت (3 دقائق)
1. Telegram → البوت الخاص بك
2. `/start`
3. **🎮 Play Now**
4. **يجب أن تفتح اللعبة!** 🎉

---

## 🔍 التحقق النهائي

- [ ] البوت يرد على `/start` ✅
- [ ] اللعبة تفتح بدون أخطاء ✅
- [ ] الـ Tap يشتغل ويجمع BFLX ✅
- [ ] الدفع بـ Telegram Stars يشتغل ✅
- [ ] اللعبة تشتغل **بدون VPN** من سوريا ✅

---

## ❌ إذا في مشكلة

### البوت ما يرد:
```bash
# تحقق من webhook:
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# شيك logs في Railway:
Railway Dashboard → Deployments → آخر deployment → View logs
```

### اللعبة ما تفتح:
- تحقق من `webapp_url` في `main.py`
- تأكد أن مجلد `webapp/` موجود في GitHub

### خطأ Database:
- تحقق أن PostgreSQL service شغال (أخضر)
- تحقق من `DATABASE_URL` في Variables

---

## 💰 التكلفة

| الخدمة | السعر |
|--------|-------|
| Railway Hobby Plan | $5/شهر |
| Domain (اختياري) | $10/سنة |
| **المجموع** | **~$70/سنة** |

**ملاحظة:** Railway يعطيك $5 credit مجاني في البداية

---

## 📚 مصادر إضافية

- **الدليل الشامل:** اقرأ `DEPLOYMENT_RAILWAY.md` للتفاصيل الكاملة
- **Railway Docs:** https://docs.railway.app
- **Telegram Bot API:** https://core.telegram.org/bots/api

---

## 🎊 بعد النقل

**مبروك!** اللعبة الآن:
- ✅ تشتغل من سوريا **بدون VPN**
- ✅ استقرار أعلى
- ✅ أداء أفضل
- ✅ SSL مجاني
- ✅ رابط احترافي

**الخطوة التالية (اختيارية):**
شراء domain مخصص → `bookfolloxa.com` 🌟
