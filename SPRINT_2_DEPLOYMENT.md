# Sprint 2: 3-Currency Economy System - Deployment Guide

## ✅ What's New in Sprint 2

### 🎯 Three-Currency Economy
1. **BFLX** - Soft currency (earned by tapping, tasks, mining)
2. **Diamonds 💎** - Premium currency (purchased with Telegram Stars)
3. **Influence Points ✨** - Progression/experience metric (renamed from "Followers")

### 💎 Diamond Store System
- **Buy Diamonds with Telegram Stars:**
  - Starter Pack: 50 ⭐ → 50 💎
  - Pro Pack: 200 ⭐ → 200 💎
  - King Pack: 800 ⭐ → 800 💎
  - Legend Pack: 2000 ⭐ → 2000 💎

- **Exchange Diamonds for BFLX:**
  - Small Pack: 10 💎 → 2,500 BFLX
  - Medium Pack: 40 💎 → 10,000 BFLX
  - Large Pack: 160 💎 → 50,000 BFLX
  - Mega Pack: 400 💎 → 150,000 BFLX

### 🎨 UI Improvements
- 3-currency header display (BFLX, Diamonds, Influence Points)
- Enhanced offline earnings notification with time calculation
- English-only interface (HTML lang="en")
- Improved statistics page

---

## 🚀 Deployment Steps to Railway

### Step 1: Run Database Migration on Production
**CRITICAL:** Before deploying code, run this SQL on your Railway PostgreSQL database:

```bash
# Connect to Railway database
railway login
railway link
railway run psql $DATABASE_URL
```

Then run:
```sql
-- Add new columns for diamond payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS amount_diamonds INTEGER DEFAULT 0;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'bflx';

-- Verify migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name IN ('amount_diamonds', 'payment_type');
```

You should see:
```
amount_diamonds | integer | 0
payment_type    | character varying | 'bflx'::character varying
```

### Step 2: Deploy Code to Railway

```bash
# Add all changes
git add -A

# Commit with descriptive message
git commit -m "Sprint 2: 3-Currency Economy (BFLX + Diamonds + Influence Points)

- Added Diamond premium currency with Telegram Stars payment
- Implemented Diamond→BFLX exchange system  
- Renamed Followers to Influence Points
- Enhanced offline earnings notification
- Updated UI to show 3 currencies in header
- Changed interface language to English
- Added Payment model support for diamonds"

# Push to Railway
git push origin main
```

### Step 3: Verify Deployment

1. **Check Railway logs:**
   ```bash
   railway logs
   ```
   Look for: "✅ Bot started successfully"

2. **Test Diamond Purchase:**
   - Open bot: https://t.me/YOUR_BOT_NAME
   - Click "🎮 Play Now"
   - Navigate to Store
   - Try buying a Starter Diamond Pack (50 ⭐)
   - Verify diamonds appear in header

3. **Test Diamond Exchange:**
   - Click "Exchange" on Small Pack (10 💎 → 2,500 BFLX)
   - Verify BFLX balance increases
   - Verify diamonds decrease

4. **Test Offline Earnings:**
   - Close app
   - Wait 5+ minutes
   - Reopen app
   - Should see: "⛏️ Welcome back! Your Influencers earned X BFLX while you were away (Y minutes)!"

---

## 📋 Files Changed

### Backend:
- `models.py` - Added `amount_diamonds` and `payment_type` to Payment model
- `main.py` - Added DIAMOND_PACKAGES, updated create_invoice, successful_payment_handler, new /api/exchange_diamonds endpoint

### Frontend:
- `webapp/game.js` - Added buyDiamonds(), exchangeDiamondsForBFLX(), showOfflineEarningsModal()
- `webapp/index.html` - Changed lang to "en", updated Store section, renamed Followers to Influence Points
- `webapp/style.css` - Updated header stats for 3-currency display

### Database:
- `migration_add_diamonds.sql` - Migration script for new Payment columns

---

## 🔧 Troubleshooting

### Issue: "no such column: amount_diamonds"
**Solution:** Run the database migration (Step 1) before deploying code.

### Issue: Diamond purchase doesn't credit diamonds
**Solution:** 
1. Check Railway logs for errors
2. Verify payload format in logs (should be "diamonds_starter_123456...")
3. Check if successful_payment_handler is detecting payment_type correctly

### Issue: Exchange doesn't work
**Solution:**
1. Verify /api/exchange_diamonds endpoint is accessible
2. Check network tab in browser for 401/403 errors
3. Ensure HMAC validation is passing

---

## 🎮 Next Steps (Future Sprints)

- [ ] Speed up auto-mining with Diamonds
- [ ] Unlock special influencers with Diamonds
- [ ] Add Diamond-only cosmetic items
- [ ] Implement Diamond gift system
- [ ] Add Diamond leaderboard

---

## 📊 Current Status

✅ Development database migrated  
⏳ Awaiting production deployment  
⏳ Awaiting user testing

---

**Last Updated:** November 07, 2025  
**Sprint:** 2  
**Version:** 2.0.0
