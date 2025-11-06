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
- Professional interface inspired by "Bums" bot.
- Extensive use of ASCII art and decorative boxes for messages.
- Clear and organized information display with decorative separators.
- Glassmorphism design with purple and cyan gradients for WebApp.
- Haptic feedback for all interactions.
- Responsive design with smooth transitions.
- Particle effects, level-up animations, floating numbers, tap pulse effects, and critical hits animations for enhanced visual feedback.

**Technical Implementations:**
- **Gamified Mining:** Interactive tapping system with instant rewards, 2x critical click opportunities, and automatic mining (up to 12 hours).
- **Energy System:** Limited energy that regenerates automatically every 3 seconds.
- **Daily Fortune Wheel:** Daily random prizes.
- **Mystery Boxes:** Four rarity levels (Bronze, Silver, Gold, Diamond).
- **Challenge Games:** Speed tap rush (30 seconds), daily challenges with Streak system.
- **Upgrade System:** Enhancements for click power, energy capacity, automatic mining rate, and energy regeneration speed.
- **Social Features:** 3-level referral system (10%, 5%, 2%) and 1000 BFLX bonus per new friend.
- **Personal Statistics:** Comprehensive player progress display.
- **Influencer Empire WebApp:** Tap-to-Earn game with social media theme, influencer hiring (5 levels), smart energy system, passive income, daily/social tasks, achievements, critical hits (x10 chance), visual effects, and auto-save.
- **Security:** Full Telegram WebApp SDK authentication with HMAC validation, anti-cheat system (max balance, level, energy limits), authorization checks, input validation, and rate limiting readiness.
- **Real-time Features:** Live leaderboard, cross-device sync, and persistent progress saved on the server.
- **Monetization:** 
  - **Telegram Stars Payments:** Integrated real payment system using Telegram Stars (XTR currency)
  - **BFLX Packages:** 4 packages (Starter: 50⭐/2.5K BFLX, Pro: 200⭐/10K BFLX, King: 800⭐/50K BFLX, Legend: 2000⭐/150K BFLX)
  - Social media services (Instagram followers, TikTok likes)
  - Rewarded ads (+500 BFLX every 5 mins)
  - 7-day daily rewards (1K → 20K BFLX)
- **Campaigns:** Social Media Boost, Influencer Collab, Viral Challenge, Brand Partnership.
- **Wallet Management:** For BFLX, SOL, USDT.
- **Settings:** Language, Sound, Notifications, Theme.

**Feature Specifications:**
- **Initial Energy:** 1000, Regeneration: 1 energy/3 seconds.
- **Initial Click Power:** 1 BFLX.
- **Initial Auto-Mining:** 10 BFLX/hour.
- **Level System:** Beginner (1-10), Intermediate (11-25), Advanced (26-50), Expert (51-100), Legendary (100+).

**System Design Choices:**
- **Backend:** Python 3.11.
- **Bot Framework:** `python-telegram-bot` 21.0.1.
- **ORM:** SQLAlchemy 2.0.25.
- **Scheduler:** APScheduler 3.10.4.
- **Deployment:** Reserved VM on Replit using **Webhook mode** (November 2025).
- **Code Organization:** Modular structure with `main.py` (bot and Flask server), `models.py` (DB models), `game_logic.py`, `config.py`, `requirements.txt`, `webapp/` for WebApp, and `.env` for environment variables.
- **Data Handling:** Defensive defaults in `localStorage`, Nullish coalescing (`??`), and object spread pattern for safe data merging.

**Recent Changes (November 2025):**
- **✅ Telegram Stars Integration (Latest):** Implemented real payment system using Telegram Stars API
  - Added Payment model to track all transactions in database
  - Created pre_checkout_query and successful_payment handlers
  - Built /api/create_invoice endpoint for generating payment links
  - Updated WebApp to use real Telegram payment flow (openInvoice)
  - Replaced fake/simulated purchases with authentic Telegram Stars payments
- Converted bot from Polling mode to Webhook mode for better stability on Replit
- Resolved "Conflict: terminated by other getUpdates request" issue
- Enhanced authentication logging for better debugging
- Cleaned up unused code and imports

### External Dependencies
- **Telegram Bot API:** For bot interaction and WebApp integration.
- **PostgreSQL:** Database hosted via Replit.
- **Solana blockchain:** Underlying platform for the bot.
- **Flask:** Web server for serving the Influencer Empire WebApp.