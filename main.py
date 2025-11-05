import logging
import os
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from sqlalchemy.orm import Session
from models import User, MysteryBox, get_db, init_db
import game_logic
import config
from flask import Flask, send_from_directory
import threading

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

logging.getLogger('httpx').setLevel(logging.WARNING)

def get_or_create_user(telegram_user, db: Session, referrer_id=None) -> User:
    user = db.query(User).filter(User.id == telegram_user.id).first()
    
    if not user:
        user = User(
            id=telegram_user.id,
            username=telegram_user.username,
            first_name=telegram_user.first_name,
            referrer_id=referrer_id
        )
        db.add(user)
        
        if referrer_id:
            referrer = db.query(User).filter(User.id == referrer_id).first()
            if referrer:
                referrer.referral_count += 1
                referrer.balance += config.REFERRAL_BONUS
                referrer.total_earned += config.REFERRAL_BONUS
        
        db.commit()
    
    user.last_active = datetime.utcnow()
    db.commit()
    
    return user

def get_main_menu_keyboard():
    # Get the webapp URL from environment
    # Format: https://{REPL_SLUG}.{REPL_OWNER}.repl.co/webapp/
    repl_slug = os.getenv('REPL_SLUG', 'bookfolloxa')
    repl_owner = os.getenv('REPL_OWNER', 'username')
    webapp_url = f'https://{repl_slug}.{repl_owner}.repl.co/webapp/'
    
    # قائمة مبسطة - فقط زر اللعبة
    keyboard = [
        [
            InlineKeyboardButton("🎮 العب الآن - Play Now 🎮", web_app=WebAppInfo(url=webapp_url))
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    db = get_db()
    
    referrer_id = None
    if context.args and len(context.args) > 0:
        try:
            referrer_id = int(context.args[0])
        except:
            pass
    
    user = get_or_create_user(update.effective_user, db, referrer_id)
    
    welcome_text = f"""
🎮 **Bookfolloxa - Influencer Empire** 🎮

⚡️ مرحباً {user.first_name}! ⚡️

🎯 **ابني إمبراطوريتك على السوشيال ميديا!**

📱 انقر على الزر بالأسفل لبدء اللعبة
💰 اجمع المتابعين و BFLX
👥 وظّف المؤثرين وابنِ فريقك
🏆 كن الأول في الترتيب العالمي!

━━━━━━━━━━━━━━━━━━━━━━
   ✨ اضغط العب الآن! ✨
━━━━━━━━━━━━━━━━━━━━━━
"""
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=get_main_menu_keyboard()
    )
    
    db.close()

async def mine_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    game_logic.calculate_energy_regen(user)
    db.commit()
    
    keyboard = [
        [InlineKeyboardButton("⛏ نقرة واحدة", callback_data="tap_once")],
        [InlineKeyboardButton("⛏⛏ 10 نقرات", callback_data="tap_10")],
        [InlineKeyboardButton("⛏⛏⛏ 50 نقرة", callback_data="tap_50")],
        [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
    ]
    
    energy_bar = "█" * int((user.energy / user.max_energy) * 10) + "░" * (10 - int((user.energy / user.max_energy) * 10))
    
    mining_text = f"""
╔════════════════════════╗
║     ⛏ التعدين ⛏     ║
╚════════════════════════╝

┌─────── حالة اللاعب ───────┐
│                                                │
│  💰  {user.balance:,} BFLX                  │
│  🔨  قوة النقرة: +{user.tap_power}           │
│                                                │
│  ⚡ الطاقة: {user.energy}/{user.max_energy}         │
│  [{energy_bar}]                              │
│                                                │
└────────────────────────────┘

💡 اختر عدد النقرات للبدء!
"""
    
    await query.edit_message_text(
        mining_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def tap_action(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    tap_count_map = {
        'tap_once': 1,
        'tap_10': 10,
        'tap_50': 50
    }
    
    tap_count = tap_count_map.get(query.data, 1)
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    total_reward = 0
    critical_hits = 0
    taps_performed = 0
    
    for i in range(tap_count):
        result = game_logic.perform_tap(user, db)
        if result['success']:
            total_reward += result['reward']
            taps_performed += 1
            if result.get('is_critical'):
                critical_hits += 1
        else:
            break
    
    if taps_performed == 0:
        result_text = "❌ لا توجد طاقة كافية! انتظر قليلاً لتتجدد الطاقة. ⚡"
    else:
        critical_text = f"\n🎯 نقرات حرجة: {critical_hits} ⚡" if critical_hits > 0 else ""
        result_text = f"""
╔════════════════════════╗
║  ✅ نجح التعدين! ✅  ║
╚════════════════════════╝

┌─────── النتيجة ───────┐
│                                        │
│  ⛏  النقرات: {taps_performed}              │
│  💎  المكافأة: +{total_reward:,} BFLX  │{critical_text}
│                                        │
└──────────────────────┘

╭───── الحالة الجديدة ─────╮
│  💰  {user.balance:,} BFLX
│  ⚡  {user.energy}/{user.max_energy}
╰────────────────────────╯

🎉 استمر في التعدين!
"""
    
    keyboard = [
        [InlineKeyboardButton("⛏ نقرة أخرى", callback_data="tap_once")],
        [InlineKeyboardButton("⛏⛏ 10 نقرات", callback_data="tap_10")],
        [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
    ]
    
    await query.edit_message_text(
        result_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def claim_auto_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    result = game_logic.claim_auto_mining(user, db)
    
    if result['success']:
        result_text = f"""
╔═══════════════════════════╗
║  💰 تم جمع المكافآت! 💰  ║
╚═══════════════════════════╝

┌─────── التفاصيل ───────┐
│                                          │
│  ⏰  المدة: {result['hours']} ساعة           │
│  💎  المكافأة: +{result['reward']:,} BFLX  │
│  ⛏  المعدل: {user.auto_mining_rate}/ساعة      │
│                                          │
└────────────────────────┘

╭───── رصيدك الجديد ─────╮
│  💰  {result['balance']:,} BFLX
╰─────────────────────────╯

━━━━━━━━━━━━━━━━━━━━━
⚡ التعدين مستمر! عد لاحقاً
━━━━━━━━━━━━━━━━━━━━━
"""
    else:
        result_text = result['message']
    
    keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    
    await query.edit_message_text(
        result_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def daily_spin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    result = game_logic.spin_daily_wheel(user, db)
    
    keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    
    await query.edit_message_text(
        result['message'],
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def my_boxes_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    boxes = db.query(MysteryBox).filter(
        MysteryBox.user_id == user.id,
        MysteryBox.is_opened == False
    ).all()
    
    if not boxes:
        boxes_text = "📦 ليس لديك صناديق حالياً!\n\nاحصل على صناديق من:\n• دولاب الحظ اليومي\n• إكمال التحديات\n• الإنجازات"
        keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    else:
        boxes_text = f"📦 **صناديقك** ({len(boxes)} صندوق)\n\nاختر صندوقاً لفتحه:\n"
        
        keyboard = []
        for box in boxes:
            box_info = config.BOX_TYPES[box.box_type]
            keyboard.append([
                InlineKeyboardButton(
                    f"{box_info['emoji']} {box_info['name']} (#{box.id})",
                    callback_data=f"open_box_{box.id}"
                )
            ])
        keyboard.append([InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")])
    
    await query.edit_message_text(
        boxes_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def open_box_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    box_id = int(query.data.split('_')[2])
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    box = db.query(MysteryBox).filter(MysteryBox.id == box_id).first()
    
    if not box:
        await query.edit_message_text("❌ الصندوق غير موجود!")
        db.close()
        return
    
    result = game_logic.open_mystery_box(box, user, db)
    
    keyboard = [
        [InlineKeyboardButton("📦 صناديقي", callback_data="my_boxes")],
        [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
    ]
    
    await query.edit_message_text(
        result['message'],
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def upgrades_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    upgrades_text = f"""
╔══════════════════════════╗
║    ⬆️ الترقيات ⬆️    ║
╚══════════════════════════╝

╭───── 💰 رصيدك ─────╮
│  {user.balance:,} BFLX
╰─────────────────────╯

📈 طوّر قدراتك لزيادة أرباحك!

┌─────────────────────┐
│ 🔨 قوة النقرة       Lv.{user.tap_power_level}  │
│ ⚡ سعة الطاقة        Lv.{user.energy_capacity_level}  │
│ ⛏ التعدين التلقائي   Lv.{user.auto_mining_level}  │
│ 🔋 تجديد الطاقة      Lv.{user.energy_regen_level}  │
└─────────────────────┘

💡 اختر الترقية المناسبة!
"""
    
    keyboard = [
        [InlineKeyboardButton(
            f"🔨 قوة النقرة (المستوى {user.tap_power_level})",
            callback_data="upgrade_tap_power"
        )],
        [InlineKeyboardButton(
            f"⚡ سعة الطاقة (المستوى {user.energy_capacity_level})",
            callback_data="upgrade_energy_capacity"
        )],
        [InlineKeyboardButton(
            f"⛏ التعدين التلقائي (المستوى {user.auto_mining_level})",
            callback_data="upgrade_auto_mining"
        )],
        [InlineKeyboardButton(
            f"🔋 تجديد الطاقة (المستوى {user.energy_regen_level})",
            callback_data="upgrade_energy_regen"
        )],
        [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
    ]
    
    await query.edit_message_text(
        upgrades_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def upgrade_feature_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    feature = query.data.replace('upgrade_', '')
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    result = game_logic.upgrade_feature(user, feature, db)
    
    if result['success']:
        result_text = f"✅ تمت الترقية بنجاح!\n\n{result['feature']} → المستوى {result['new_level']}\nالتكلفة: {result['cost']} BFLX"
    else:
        result_text = result['message']
    
    keyboard = [
        [InlineKeyboardButton("⬆️ ترقيات أخرى", callback_data="upgrades")],
        [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
    ]
    
    await query.edit_message_text(
        result_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def stats_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    stats = game_logic.get_user_stats(user, db)
    
    level_bar = "⭐" * stats['level'] if stats['level'] <= 10 else f"⭐×{stats['level']}"
    
    stats_text = f"""
╔══════════════════════════╗
║    📊 ملفك الشخصي 📊    ║
╚══════════════════════════╝

┏━━━━━━━ 👤 اللاعب ━━━━━━━┓
┃  {user.first_name}
┃  المستوى: {stats['level']} {level_bar}
┃  الخبرة: {stats['xp']:,} XP
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭───── 💰 الثروة ─────╮
│  الرصيد: {stats['balance']:,} BFLX
│  الأرباح الكلية: {stats['total_earned']:,} BFLX
╰───────────────────────╯

╭───── ⚡ القوة ─────╮
│  الطاقة: {stats['energy']}/{stats['max_energy']}
│  قوة النقرة: +{stats['tap_power']} BFLX
╰───────────────────────╯

╭───── ⛏ التعدين ─────╮
│  إجمالي النقرات: {stats['total_taps']:,}
│  معدل التلقائي: {stats['auto_mining_rate']} BFLX/ساعة
│  في الانتظار: {stats['pending_auto_reward']:,} BFLX
╰───────────────────────╯

╭───── 👥 المجتمع ─────╮
│  الأصدقاء: {stats['referral_count']}
│  الصناديق: {stats['unopened_boxes']}
│  الإنجازات: {stats['achievements']}
│  سلسلة الأيام: {stats['daily_streak']} 🔥
╰───────────────────────╯
"""
    
    keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    
    await query.edit_message_text(
        stats_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def referrals_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    bot_username = context.bot.username
    referral_link = f"https://t.me/{bot_username}?start={user.id}"
    
    referral_text = f"""
╔════════════════════════════╗
║   👥 ادعُ الأصدقاء 👥   ║
╚════════════════════════════╝

┏━━━━━━━ 🎁 المكافآت ━━━━━━━┓
┃                                                    ┃
┃  🥇 المستوى 1: 10%                   ┃
┃     من أرباح أصدقائك المباشرين    ┃
┃                                                    ┃
┃  🥈 المستوى 2: 5%                    ┃
┃     من أرباح المستوى الثاني         ┃
┃                                                    ┃
┃  🥉 المستوى 3: 2%                    ┃
┃     من أرباح المستوى الثالث         ┃
┃                                                    ┃
┃  💰 مكافأة فورية: {config.REFERRAL_BONUS:,} BFLX       ┃
┃     لكل صديق جديد!                       ┃
┃                                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭─────── 📊 إنجازاتك ───────╮
│                                                │
│  👥  الأصدقاء: {user.referral_count}                   │
│  💎  الأرباح: {user.referral_earnings:,} BFLX   │
│                                                │
╰───────────────────────────╯

🔗 رابط الدعوة الخاص بك:
{referral_link}

━━━━━━━━━━━━━━━━━━━━━━
شارك واربح معاً! 🚀
━━━━━━━━━━━━━━━━━━━━━━
"""
    
    keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    
    await query.edit_message_text(
        referral_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def games_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    games_text = """
╔═══════════════════════╗
║   🎮 مركز الألعاب 🎮   ║
╚═══════════════════════╝

🏆 اختبر مهاراتك واربح جوائز!

┌───────────────────┐
│  ⚡ تحدي السرعة      │
│  انقر بأسرع ما يمكن!  │
└───────────────────┘

┌───────────────────┐
│  🎯 التحديات اليومية │
│  مهام جديدة كل يوم!  │
└───────────────────┘

💡 اختر لعبتك المفضلة!
"""
    
    keyboard = [
        [InlineKeyboardButton("⚡ تحدي السرعة", callback_data="speed_challenge")],
        [InlineKeyboardButton("🎯 التحديات اليومية", callback_data="challenges")],
        [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
    ]
    
    await query.edit_message_text(
        games_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def speed_challenge_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    challenge_text = """
⚡ **تحدي السرعة**

🎯 انقر بأسرع ما يمكن خلال 30 ثانية!
💰 كل نقرة = 2 BFLX

هل أنت مستعد؟
"""
    
    keyboard = [
        [InlineKeyboardButton("🚀 ابدأ التحدي!", callback_data="start_speed")],
        [InlineKeyboardButton("🔙 رجوع", callback_data="games")]
    ]
    
    await query.edit_message_text(
        challenge_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def start_speed_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    context.user_data['speed_taps'] = 0
    context.user_data['speed_start'] = datetime.utcnow()
    
    speed_text = """
⚡⚡⚡ **ابدأ النقر الآن!** ⚡⚡⚡

انقر على "نقرة" بأسرع ما يمكن!
الوقت: 30 ثانية
"""
    
    keyboard = [[InlineKeyboardButton("⚡ نقرة!", callback_data="speed_tap")]]
    
    await query.edit_message_text(
        speed_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def speed_tap_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if 'speed_taps' not in context.user_data:
        context.user_data['speed_taps'] = 0
        context.user_data['speed_start'] = datetime.utcnow()
    
    elapsed = (datetime.utcnow() - context.user_data['speed_start']).total_seconds()
    
    if elapsed > 30:
        db = get_db()
        user = get_or_create_user(update.effective_user, db)
        
        score = context.user_data['speed_taps']
        result = game_logic.complete_speed_challenge(user, score, db)
        
        keyboard = [
            [InlineKeyboardButton("🔁 العب مرة أخرى", callback_data="start_speed")],
            [InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]
        ]
        
        await query.edit_message_text(
            result['message'],
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        
        del context.user_data['speed_taps']
        del context.user_data['speed_start']
        db.close()
    else:
        context.user_data['speed_taps'] += 1
        remaining = 30 - int(elapsed)
        
        speed_text = f"""
⚡ **استمر!** ⚡

النقرات: {context.user_data['speed_taps']}
الوقت المتبقي: {remaining} ثانية
"""
        
        keyboard = [[InlineKeyboardButton("⚡ نقرة!", callback_data="speed_tap")]]
        
        await query.edit_message_text(
            speed_text,
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

async def challenges_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    today = datetime.utcnow().date()
    from models import UserChallenge
    
    challenges_text = "🎯 **التحديات اليومية**\n\n"
    
    for challenge_config in config.DAILY_CHALLENGES:
        user_challenge = db.query(UserChallenge).filter(
            UserChallenge.user_id == user.id,
            UserChallenge.challenge_id == challenge_config['id'],
            UserChallenge.date >= datetime.combine(today, datetime.min.time())
        ).first()
        
        if user_challenge:
            progress = user_challenge.progress
            completed = user_challenge.completed
        else:
            progress = 0
            completed = False
        
        status = "✅" if completed else "⏳"
        challenges_text += f"{status} **{challenge_config['name']}**\n"
        challenges_text += f"   التقدم: {progress}/{challenge_config['target']}\n"
        challenges_text += f"   المكافأة: {challenge_config['reward']} BFLX\n\n"
    
    keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    
    await query.edit_message_text(
        challenges_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def leaderboard_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    
    top_users = db.query(User).order_by(User.total_earned.desc()).limit(10).all()
    
    leaderboard_text = "🏆 **المتصدرون** 🏆\n\nأعلى 10 لاعبين:\n\n"
    
    medals = ["🥇", "🥈", "🥉"]
    
    for i, top_user in enumerate(top_users, 1):
        medal = medals[i-1] if i <= 3 else f"{i}."
        leaderboard_text += f"{medal} {top_user.first_name}\n"
        leaderboard_text += f"   💰 {top_user.total_earned} BFLX\n"
        leaderboard_text += f"   🎚 المستوى {top_user.level}\n\n"
    
    keyboard = [[InlineKeyboardButton("🔙 القائمة الرئيسية", callback_data="main_menu")]]
    
    await query.edit_message_text(
        leaderboard_text,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    
    db.close()

async def main_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    db = get_db()
    user = get_or_create_user(update.effective_user, db)
    
    menu_text = f"""
🌟 **Bookfolloxa** 🌟

💎 **رصيدك:** {user.balance} BFLX
⚡ **الطاقة:** {user.energy}/{user.max_energy}
🎚 **المستوى:** {user.level}

اختر ما تريد القيام به:
"""
    
    await query.edit_message_text(
        menu_text,
        reply_markup=get_main_menu_keyboard()
    )
    
    db.close()

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    handlers = {
        'mine': mine_callback,
        'claim_auto': claim_auto_callback,
        'daily_spin': daily_spin_callback,
        'my_boxes': my_boxes_callback,
        'upgrades': upgrades_callback,
        'stats': stats_callback,
        'referrals': referrals_callback,
        'games': games_callback,
        'speed_challenge': speed_challenge_callback,
        'start_speed': start_speed_callback,
        'speed_tap': speed_tap_callback,
        'challenges': challenges_callback,
        'leaderboard': leaderboard_callback,
        'main_menu': main_menu_callback
    }
    
    if query.data in handlers:
        await handlers[query.data](update, context)
    elif query.data.startswith('tap_'):
        await tap_action(update, context)
    elif query.data.startswith('open_box_'):
        await open_box_callback(update, context)
    elif query.data.startswith('upgrade_'):
        await upgrade_feature_callback(update, context)

app = Flask(__name__)

@app.route('/')
def health_check():
    return 'OK', 200

@app.route('/health')
def health():
    return {'status': 'healthy', 'bot': 'running'}, 200

@app.route('/webapp/')
@app.route('/webapp/index.html')
def webapp_index():
    return send_from_directory('webapp', 'index.html')

@app.route('/webapp/<path:filename>')
def webapp_files(filename):
    return send_from_directory('webapp', filename)

def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

async def post_init(application: Application) -> None:
    """حذف أي webhook قديم عند البدء"""
    import asyncio
    try:
        # حذف webhook مرتين للتأكيد
        await application.bot.delete_webhook(drop_pending_updates=True)
        await asyncio.sleep(2)  # انتظر ثانيتين
        await application.bot.delete_webhook(drop_pending_updates=True)
        logger.info("✅ Webhook deleted successfully")
    except Exception as e:
        logger.warning(f"⚠️ Could not delete webhook: {e}")

def main():
    logger.info("Initializing database...")
    init_db()
    
    logger.info("Starting Flask server...")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    logger.info("Starting bot...")
    application = Application.builder().token(config.TELEGRAM_BOT_TOKEN).post_init(post_init).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    logger.info("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True, read_timeout=30, write_timeout=30, connect_timeout=30, pool_timeout=30)

if __name__ == '__main__':
    main()
