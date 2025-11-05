# 🎮 Bookfolloxa - Telegram Mining & Gaming Bot

![Status](https://img.shields.io/badge/status-ready%20for%20deployment-success)
![Platform](https://img.shields.io/badge/platform-telegram-blue)
![Database](https://img.shields.io/badge/database-postgresql-blue)

## 📖 Overview

**Bookfolloxa** is an interactive Telegram mining and gaming bot featuring a complete **Tap-to-Earn** WebApp game called "Influencer Empire". Build your social media empire by tapping, hiring influencers, completing tasks, and competing on the global leaderboard!

## ✨ Features

### 🎮 Core Gameplay
- **Tap-to-Earn Mechanics**: Tap to earn BFLX coins with energy system
- **Auto-Mining**: Hire 5 levels of influencers for passive income
- **Energy System**: 1000 initial energy, regenerates 1/3 seconds
- **Level Progression**: From Beginner to Legendary (100+ levels)
- **Critical Hits**: 10x rewards with visual effects

### 👥 Social Features
- **Referral System**: 10% commission on friend earnings
- **Global Leaderboard**: Real-time rankings from database
- **Cross-device Sync**: Play on any device with your Telegram account

### 💰 Monetization
- **BFLX Store**: 4 purchase packages
- **Social Services**: Buy Instagram followers, TikTok likes, etc.
- **Rewarded Ads**: +500 BFLX every 5 minutes
- **Daily Rewards**: 7-day streak (1K → 20K BFLX)

### ✅ Tasks System
- **Daily Tasks**: Play daily, invite friends, reach levels
- **Social Tasks**: Follow on Instagram, join Telegram, share bot
- **Achievements**: 12 achievements with rewards

### 🔐 Security
- **Telegram Authentication**: Full WebApp SDK with HMAC validation
- **Anti-cheat System**: Max limits for balance, level, energy
- **Authorization Checks**: User-specific data access only
- **PostgreSQL Database**: Persistent and secure data storage

## 🚀 Deployment

### Prerequisites

1. **Telegram Bot Token**: Get from [@BotFather](https://t.me/BotFather)
2. **PostgreSQL Database**: Auto-configured in Replit
3. **Replit Account**: For hosting

### Environment Variables

Required secrets in Replit:
- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `DATABASE_URL`: Auto-configured by Replit PostgreSQL

### Deploy to Production

**⚠️ IMPORTANT**: The bot uses **polling mode** and requires **Reserved VM** deployment.

**Steps:**

1. **Stop Development Bot** (if running):
   - Workflow will show instructions
   - Must stop before deploying!

2. **Click Deploy** in Replit:
   - Deployment Type: **Reserved VM** ✓ (already configured)
   - Run command: `python main.py` ✓
   - Click **Deploy**

3. **Bot Runs 24/7**:
   - Automatic startup
   - Database connected
   - WebApp accessible

### Test in Development

```bash
# Start bot locally for testing
bash START_BOT.sh
```

**⚠️ Stop development bot before deploying!**

## 📱 Usage

### For Players

1. **Start the Bot**: Search for your bot in Telegram
2. **Send** `/start`
3. **Click** "🎮 Play Now" button
4. **Play** the Influencer Empire game!

### WebApp Direct Link

Access the game directly at:
```
https://[YOUR-REPL-URL]/webapp/
```

## 🏗️ Project Structure

```
bookfolloxa/
├── main.py                 # Main bot + Flask server
├── config.py              # Configuration constants
├── models.py              # Database models (SQLAlchemy)
├── game_logic.py          # Game mechanics
├── requirements.txt       # Python dependencies
├── webapp/                # WebApp frontend
│   ├── index.html        # Main HTML
│   ├── style.css         # Styles with glassmorphism
│   ├── game.js           # Game logic
│   ├── api.js            # Backend API integration
│   ├── telegram_auth.py  # Telegram authentication
│   └── assets/           # Images and icons
├── DEPLOYMENT_GUIDE.md   # Detailed deployment guide
└── START_BOT.sh          # Development start script
```

## 🛠️ Technology Stack

- **Backend**: Python 3.11
- **Bot Framework**: python-telegram-bot 21.0.1
- **Web Server**: Flask
- **Database**: PostgreSQL + SQLAlchemy 2.0.25
- **Frontend**: Vanilla JavaScript
- **Styling**: CSS3 (Glassmorphism design)
- **Authentication**: Telegram WebApp SDK + HMAC

## 📊 Database Models

- **User**: Player profiles and stats
- **MysteryBox**: Mystery boxes inventory
- **UserTask**: Task completion tracking
- **UserAchievement**: Achievement progress
- **SpeedChallenge**: Speed game records
- **Leaderboard**: Rankings and scores

## 🎨 Design

- **Glassmorphism UI**: Purple & cyan gradients
- **Particle Effects**: Tap animations
- **Haptic Feedback**: All interactions
- **Responsive**: Works on all screen sizes
- **Smooth Transitions**: Professional animations

## 📝 Game Mechanics

### Initial Values
- **Energy**: 1000 (max)
- **Click Power**: 1 BFLX per tap
- **Energy Regen**: 1 per 3 seconds
- **Auto-Mining**: 10 BFLX/hour (base)

### Influencer Levels
1. **Nano** (5 BFLX/hr) - 1K BFLX
2. **Micro** (15 BFLX/hr) - 5K BFLX
3. **Mid-Tier** (50 BFLX/hr) - 25K BFLX
4. **Macro** (200 BFLX/hr) - 100K BFLX
5. **Mega** (1000 BFLX/hr) - 500K BFLX

## 🔒 Security Features

- ✅ Telegram WebApp authentication
- ✅ HMAC signature validation
- ✅ Anti-cheat with max limits
- ✅ User authorization checks
- ✅ Input validation
- ✅ Rate limiting ready

## 📄 License

All rights reserved. This project is proprietary.

## 🤝 Support

For issues or questions:
1. Check `DEPLOYMENT_GUIDE.md`
2. Review bot logs in Replit
3. Test in development before deploying

## 🎯 Current Status

✅ **Fully Functional** - Ready for deployment
- All features implemented
- Database integrated
- Security measures in place
- WebApp tested and working
- Deployment configured

---

**Ready to deploy!** 🚀

Made with ❤️ for the Telegram gaming community
