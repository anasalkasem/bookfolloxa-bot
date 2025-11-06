import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
DATABASE_URL = os.getenv('DATABASE_URL', '')
WALLET_PAY_TOKEN = os.getenv('WALLET_PAY_TOKEN', '')  # Telegram Wallet Pay API Token

INITIAL_ENERGY = 1000
ENERGY_REGEN_RATE = 1
ENERGY_REGEN_SECONDS = 3
TAP_REWARD = 1
AUTO_MINING_BASE_RATE = 10
AUTO_MINING_MAX_HOURS = 12

REFERRAL_LEVEL_1_PERCENTAGE = 0.10
REFERRAL_LEVEL_2_PERCENTAGE = 0.05
REFERRAL_LEVEL_3_PERCENTAGE = 0.02
REFERRAL_BONUS = 1000

BOX_TYPES = {
    'bronze': {'name': 'برونزي', 'emoji': '📦', 'min_reward': 100, 'max_reward': 500},
    'silver': {'name': 'فضي', 'emoji': '🎁', 'min_reward': 500, 'max_reward': 2000},
    'gold': {'name': 'ذهبي', 'emoji': '💎', 'min_reward': 2000, 'max_reward': 10000},
    'diamond': {'name': 'ماسي', 'emoji': '💍', 'min_reward': 10000, 'max_reward': 50000}
}

DAILY_SPIN_REWARDS = [
    {'type': 'tokens', 'amount': 100, 'weight': 30},
    {'type': 'tokens', 'amount': 500, 'weight': 20},
    {'type': 'tokens', 'amount': 1000, 'weight': 15},
    {'type': 'tokens', 'amount': 5000, 'weight': 10},
    {'type': 'energy', 'amount': 500, 'weight': 15},
    {'type': 'box', 'box_type': 'bronze', 'weight': 8},
    {'type': 'box', 'box_type': 'silver', 'weight': 2}
]

LEVEL_XP_REQUIREMENTS = {
    1: 0, 2: 100, 3: 300, 4: 600, 5: 1000,
    6: 1500, 7: 2100, 8: 2800, 9: 3600, 10: 4500,
    11: 6000, 12: 7500, 13: 9000, 14: 11000, 15: 13000,
    16: 15500, 17: 18000, 18: 21000, 19: 24500, 20: 28000
}

UPGRADE_COSTS = {
    'tap_power': {1: 500, 2: 1000, 3: 2500, 4: 5000, 5: 10000},
    'energy_capacity': {1: 300, 2: 800, 3: 2000, 4: 4500, 5: 9000},
    'auto_mining': {1: 1000, 2: 3000, 3: 7000, 4: 15000, 5: 30000},
    'energy_regen': {1: 700, 2: 2000, 3: 5000, 4: 12000, 5: 25000}
}

DAILY_CHALLENGES = [
    {'id': 'tap_1000', 'name': 'انقر 1000 مرة', 'target': 1000, 'reward': 500},
    {'id': 'earn_5000', 'name': 'اجمع 5000 توكن', 'target': 5000, 'reward': 1000},
    {'id': 'claim_auto', 'name': 'اجمع من التعدين التلقائي', 'target': 1, 'reward': 300},
    {'id': 'spin_wheel', 'name': 'دور دولاب الحظ', 'target': 1, 'reward': 200}
]
