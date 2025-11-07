# Bookfolloxa - Telegram Mining and Gaming Bot

### Overview
Bookfolloxa is an interactive Telegram mining and gaming bot built on the Solana platform. It combines gamified mining mechanics, competitive games, and a powerful platform for increasing followers. The project aims to provide an engaging user experience with a clear path for future expansion into social influence and Web3 integrations.

### User Preferences
- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

### System Architecture

**UI/UX Decisions:**
- Professional interface inspired by "Bums" bot, utilizing ASCII art, decorative boxes, and clear information display with separators.
- Glassmorphism design with purple and cyan gradients for the WebApp, featuring haptic feedback, responsive design, smooth transitions, particle effects, level-up animations, floating numbers, tap pulse effects, and critical hits animations.

**Technical Implementations:**
- **Gamified Mining:** Interactive tapping, 2x critical clicks, and automatic mining.
- **Core Game Mechanics:** Energy system, Daily Fortune Wheel, Mystery Boxes (four rarity levels), Challenge Games (Speed tap rush, daily challenges with Streak system).
- **Upgrade System:** Enhancements for click power, energy capacity, automatic mining rate, and energy regeneration.
- **Social Features:** 3-level referral system and bonus for new friends.
- **Personal Statistics:** Comprehensive player progress display.
- **Influencer Empire WebApp:** Tap-to-Earn game with social media theme, influencer hiring (5 levels), smart energy, passive income, daily/social tasks, achievements, and auto-save.
- **Security:** Telegram WebApp SDK authentication with HMAC validation, anti-cheat system, authorization checks, input validation, and rate limiting readiness.
- **Real-time Features:** Live leaderboard, cross-device sync, and persistent server-side progress.
- **Monetization:** Integrated Telegram Stars payments, BFLX packages, social media services, rewarded ads, and 7-day daily rewards.
- **Campaigns:** Social Media Boost, Influencer Collab, Viral Challenge, Brand Partnership.
- **Wallet Management:** For BFLX, SOL, USDT.
- **Settings:** Language, Sound, Notifications, Theme.
- **3-Currency Economy:** BFLX (soft), Diamonds (premium, purchasable with Telegram Stars), and Influence Points (experience/progression). Includes Diamond to BFLX exchange.
- **Offline Earnings:** Notification system for earnings while away.
- **Statistics & Balance Tracking:** Comprehensive tracking of current balance vs. total lifetime earned BFLX.
- **Advanced Level System (50 Levels):** Balanced exponential progression with level-based bonuses, rewards, and titles.
- **Dynamic Character Scaling:** Character visual size increases with player level.
- **TON Connect Integration:** Real wallet connection for Tonkeeper, MyTonWallet, Telegram Wallet, and Trust Wallet.
- **Enhanced Interactive Effects & UX:** Web Audio API sounds, critical hits with animations/particles, enhanced haptic feedback, visual effects (particle explosions, floating numbers, character shake), and gender selection.

**Feature Specifications:**
- **Initial Energy:** 1000, Regeneration: 1 energy/3 seconds.
- **Initial Click Power:** 5 BFLX (scales with level).
- **Initial Auto-Mining:** 10 BFLX/hour.
- **Max Energy:** 1000 (scales with level).
- **Level System:** 50 levels with balanced exponential progression (early, mid, late game phases).
- **Character Scaling:** Grows from 1.0x to 1.8x size across 50 levels.

**System Design Choices:**
- **Backend:** Python 3.11.
- **Bot Framework:** `python-telegram-bot` 21.0.1.
- **ORM:** SQLAlchemy 2.0.25.
- **Scheduler:** APScheduler 3.10.4.
- **Deployment:** Reserved VM on Replit using **Webhook mode**.
- **Code Organization:** Modular structure with `main.py`, `models.py`, `game_logic.py`, `config.py`, `requirements.txt`, `webapp/`, and `.env`.
- **Data Handling:** Defensive defaults, Nullish coalescing, and object spread for safe data merging.

### External Dependencies
- **Telegram Bot API:** For bot interaction and WebApp integration.
- **PostgreSQL:** Database hosted via Replit.
- **Solana blockchain:** Underlying platform for the bot.
- **Flask:** Web server for serving the Influencer Empire WebApp.
- **@tonconnect/ui library:** For TON blockchain wallet connections.