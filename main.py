import logging
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from sqlalchemy.orm import Session
from models import User, MysteryBox, get_db, init_db
import game_logic
import config
from flask import Flask
import threading

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

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
    keyboard = [
        [
            InlineKeyboardButton("⛏ تعدين", callback_data="mine"),
            InlineKeyboardButton("💰 جمع التلقائي", callback_data="claim_auto")
        ],
        [
            InlineKeyboardButton("🎡 دولاب الحظ", callback_data="daily_spin"),
            InlineKeyboardButton("📦 صناديقي", callback_data="my_boxes")
        ],
        [
            InlineKeyboardButton("🎮 الألعاب", callback_data="games"),
            InlineKeyboardButton("⬆️ ترقيات", callback_data="upgrades")
        ],
        [
            InlineKeyboardButton("📊 إحصائياتي", callback_data="stats"),
            InlineKeyboardButton("👥 دعوة أصدقاء", callback_data="referrals")
        ],
        [
            InlineKeyboardButton("🏆 المتصدرون", callback_data="leaderboard"),
            InlineKeyboardButton("🎯 التحديات", callback_data="challenges")
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
🌟 مرحباً بك في Bookfolloxa! 🌟

أهلاً {user.first_name}! 👋

🎮 **كيف تلعب:**
⛏ انقر على "تعدين" لجمع توكنات BFLX
💰 جمع المكافآت من التعدين التلقائي كل يوم
🎡 دور دولاب الحظ اليومي لجوائز مميزة
📦 افتح الصناديق للحصول على مكافآت ضخمة
⬆️ قم بترقية قدراتك لزيادة أرباحك
👥 ادعُ أصدقائك واحصل على مكافآت من نشاطهم

💎 **رصيدك:** {user.balance} BFLX
⚡ **الطاقة:** {user.energy}/{user.max_energy}
🎚 **المستوى:** {user.level}

هيا نبدأ اللعب! 🚀
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
    
    mining_text = f"""
⛏ **صفحة التعدين** ⛏

💎 **رصيدك:** {user.balance} BFLX
⚡ **الطاقة:** {user.energy}/{user.max_energy}
🔨 **قوة النقرة:** {user.tap_power} BFLX

اختر عدد النقرات:
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
        result_text = f"""
✅ **نجح التعدين!**

⛏ نقرات: {taps_performed}
💎 حصلت على: {total_reward} BFLX
{'⚡ نقرات حرجة: ' + str(critical_hits) if critical_hits > 0 else ''}

💰 **رصيدك الجديد:** {user.balance} BFLX
⚡ **الطاقة المتبقية:** {user.energy}/{user.max_energy}
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
💰 **تم جمع المكافآت!**

⏰ الوقت: {result['hours']} ساعة
💎 حصلت على: {result['reward']} BFLX
⛏ معدل التعدين: {user.auto_mining_rate} BFLX/ساعة

💰 **رصيدك الجديد:** {result['balance']} BFLX

سيستمر التعدين التلقائي! عد قريباً لجمع المزيد 🚀
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
⬆️ **الترقيات المتاحة**

💰 **رصيدك:** {user.balance} BFLX

اختر ما تريد ترقيته:
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
    
    stats_text = f"""
📊 **إحصائياتك**

👤 **الملف الشخصي:**
• الاسم: {user.first_name}
• المستوى: {stats['level']}
• الخبرة: {stats['xp']} XP

💰 **المالية:**
• الرصيد: {stats['balance']} BFLX
• إجمالي الأرباح: {stats['total_earned']} BFLX

⚡ **الطاقة:**
• الحالية: {stats['energy']}/{stats['max_energy']}
• قوة النقرة: {stats['tap_power']} BFLX

⛏ **التعدين:**
• إجمالي النقرات: {stats['total_taps']}
• معدل التلقائي: {stats['auto_mining_rate']} BFLX/ساعة
• في انتظار الجمع: {stats['pending_auto_reward']} BFLX

👥 **الإحالات:**
• عدد الأصدقاء: {stats['referral_count']}

🎁 **المجموعات:**
• صناديق غير مفتوحة: {stats['unopened_boxes']}
• الإنجازات: {stats['achievements']}
• سلسلة الأيام: {stats['daily_streak']}
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
👥 **نظام الإحالة**

🎁 **مكافآتك:**
• المستوى 1: 10% من أرباح أصدقائك المباشرين
• المستوى 2: 5% من أرباح أصدقاء أصدقائك
• المستوى 3: 2% من المستوى الثالث
• مكافأة فورية: {config.REFERRAL_BONUS} BFLX لكل صديق

📊 **إحصائياتك:**
• عدد الأصدقاء: {user.referral_count}
• أرباح الإحالات: {user.referral_earnings} BFLX

🔗 **رابط الدعوة:**
{referral_link}

شارك الرابط مع أصدقائك! 🚀
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
🎮 **الألعاب المتاحة**

اختر لعبة:
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

def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

def main():
    logger.info("Initializing database...")
    init_db()
    
    logger.info("Starting Flask server...")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    logger.info("Starting bot...")
    application = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    logger.info("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
