# 🔗 Backend API Documentation

## نظرة عامة
اللعبة الآن متكاملة بشكل كامل مع Backend PostgreSQL عبر RESTful API endpoints.

## 🔌 API Endpoints

### 1. جلب بيانات المستخدم
```
GET /api/user/<telegram_id>
```

**Response:**
```json
{
  "id": 123456789,
  "username": "user123",
  "balance": 15000,
  "followers": 250,
  "energy": 800,
  "max_energy": 1000,
  "tap_power": 10,
  "mining_per_hour": 500,
  "level": 5,
  "total_earned": 50000,
  "referral_count": 3,
  "last_active": "2025-11-05T19:00:00"
}
```

### 2. مزامنة بيانات المستخدم
```
POST /api/user/<telegram_id>/sync
Content-Type: application/json

{
  "balance": 15500,
  "followers": 260,
  "energy": 950,
  "level": 5,
  "total_earned": 50500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data synced"
}
```

### 3. جلب Leaderboard
```
GET /api/leaderboard
```

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "id": 123456,
      "username": "user1",
      "first_name": "Mohammed",
      "total_earned": 5000000,
      "level": 30
    },
    ...
  ]
}
```

## 🔄 Auto-Sync System

### كيف يعمل
- **Auto-load on start**: يحمّل البيانات من Backend عند فتح اللعبة
- **Auto-sync every 30s**: يزامن البيانات تلقائياً كل 30 ثانية
- **On every save**: يزامن عند كل حفظ (كل 5 ثوانٍ)
- **Fallback to localStorage**: إذا فشل الـ Backend، يستخدم التخزين المحلي

### Functions المسؤولة
```javascript
// في api.js
- getTelegramUserId()        // جلب معرّف المستخدم من Telegram
- loadUserFromBackend()      // تحميل البيانات من Server
- syncUserToBackend()        // مزامنة البيانات مع Server
- loadRealLeaderboard()      // جلب الترتيب الحقيقي
- initBackendIntegration()   // تهيئة التكامل
- startAutoSync()            // بدء المزامنة التلقائية
```

## 🔐 التوثيق (Authentication)

يتم التوثيق عبر Telegram WebApp SDK:
```javascript
window.Telegram.WebApp.initDataUnsafe.user.id
```

## 📊 تدفق البيانات

```
1. User opens game
   ↓
2. Load from localStorage (instant)
   ↓
3. Check Telegram user ID
   ↓
4. Fetch from backend (if available)
   ↓
5. Merge backend data (backend wins)
   ↓
6. Start auto-sync every 30s
   ↓
7. On user action → Save to localStorage + Sync to backend
```

## ⚠️ Error Handling

جميع الـ API calls لديها error handling:
- **Network errors**: تُسجّل في console ولا توقف اللعبة
- **User not found**: تُنشئ مستخدم جديد عند أول sync
- **Offline mode**: تشتغل اللعبة بدون backend (localStorage only)

## 🚀 للتطوير المستقبلي

### الأولويات:
1. ✅ **Backend sync** - تم
2. ⏳ **Telegram Payments API** - قادم
3. ⏳ **Webhook for real-time updates** - قادم
4. ⏳ **Server-side validation** - قادم
5. ⏳ **Anti-cheat system** - قادم

### API Endpoints المقترحة:
- `POST /api/purchase` - معالجة الشراء
- `POST /api/ad/watch` - تسجيل مشاهدة إعلان
- `POST /api/daily/claim` - استلام المكافأة اليومية
- `POST /api/influencer/hire` - توظيف مؤثر
- `POST /api/task/complete` - إكمال مهمة

## 📝 Notes

- البيانات تُحفظ في قاعدة بيانات PostgreSQL (Replit)
- التكامل يعمل في Telegram WebApp فقط (يحتاج user ID)
- في المتصفح العادي، تعمل اللعبة بـ localStorage فقط
- جميع التواريخ UTC
- Auto-sync يمنع فقدان البيانات

---

**Created**: November 2025  
**Status**: ✅ Production Ready
