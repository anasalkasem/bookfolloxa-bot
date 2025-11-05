import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User, MysteryBox, UserChallenge, UserAchievement, SpeedChallenge
import config

def distribute_referral_rewards(user: User, earned_amount: int, db: Session):
    """توزيع مكافآت الإحالة على 3 مستويات"""
    percentages = [
        config.REFERRAL_LEVEL_1_PERCENTAGE,
        config.REFERRAL_LEVEL_2_PERCENTAGE,
        config.REFERRAL_LEVEL_3_PERCENTAGE
    ]
    
    current_user = user
    for level, percentage in enumerate(percentages, 1):
        if not current_user.referrer_id:
            break
        
        referrer = db.query(User).filter(User.id == current_user.referrer_id).first()
        if not referrer:
            break
        
        reward = int(earned_amount * percentage)
        if reward > 0:
            referrer.balance += reward
            referrer.referral_earnings += reward
            referrer.total_earned += reward
        
        current_user = referrer

def calculate_energy_regen(user: User) -> int:
    now = datetime.utcnow()
    time_diff = (now - user.last_energy_update).total_seconds()
    
    base_regen_rate = config.ENERGY_REGEN_RATE
    regen_multiplier = 1 + (user.energy_regen_level * 0.2)
    
    energy_regen = int((time_diff / config.ENERGY_REGEN_SECONDS) * base_regen_rate * regen_multiplier)
    
    new_energy = min(user.energy + energy_regen, user.max_energy)
    user.energy = new_energy
    user.last_energy_update = now
    
    return new_energy

def perform_tap(user: User, db: Session) -> dict:
    calculate_energy_regen(user)
    
    if user.energy < 1:
        return {'success': False, 'message': 'لا توجد طاقة كافية! ⚡'}
    
    tap_reward = user.tap_power
    
    critical_chance = 0.1 + (user.level * 0.01)
    is_critical = random.random() < critical_chance
    if is_critical:
        tap_reward *= 2
    
    user.energy -= 1
    user.balance += tap_reward
    user.total_taps += 1
    user.total_earned += tap_reward
    user.xp += 1
    
    distribute_referral_rewards(user, tap_reward, db)
    
    check_level_up(user, db)
    update_challenge_progress(user, 'tap_1000', 1, db)
    
    db.commit()
    
    return {
        'success': True,
        'reward': tap_reward,
        'is_critical': is_critical,
        'balance': user.balance,
        'energy': user.energy,
        'max_energy': user.max_energy
    }

def calculate_auto_mining_reward(user: User):
    now = datetime.utcnow()
    time_diff = (now - user.last_auto_claim).total_seconds() / 3600
    
    max_hours = config.AUTO_MINING_MAX_HOURS
    actual_hours = min(time_diff, max_hours)
    
    reward = int(actual_hours * user.auto_mining_rate)
    
    return reward, actual_hours

def claim_auto_mining(user: User, db: Session) -> dict:
    reward, hours = calculate_auto_mining_reward(user)
    
    if reward == 0:
        return {'success': False, 'message': 'لا توجد مكافآت للمطالبة بها بعد! ⏰'}
    
    user.balance += reward
    user.total_earned += reward
    user.xp += int(reward / 10)
    user.last_auto_claim = datetime.utcnow()
    
    distribute_referral_rewards(user, reward, db)
    
    check_level_up(user, db)
    update_challenge_progress(user, 'claim_auto', 1, db)
    update_challenge_progress(user, 'earn_5000', reward, db)
    
    db.commit()
    
    return {
        'success': True,
        'reward': reward,
        'hours': round(hours, 1),
        'balance': user.balance
    }

def spin_daily_wheel(user: User, db: Session) -> dict:
    now = datetime.utcnow()
    
    if user.last_spin:
        time_since_spin = (now - user.last_spin).total_seconds()
        if time_since_spin < 86400:
            remaining = 86400 - time_since_spin
            hours = int(remaining / 3600)
            minutes = int((remaining % 3600) / 60)
            return {
                'success': False,
                'message': f'يمكنك الدوران مرة أخرى بعد {hours} ساعة و {minutes} دقيقة! ⏰'
            }
    
    weights = [r['weight'] for r in config.DAILY_SPIN_REWARDS]
    reward_data = random.choices(config.DAILY_SPIN_REWARDS, weights=weights, k=1)[0]
    
    result = {'success': True, 'type': reward_data['type']}
    
    if reward_data['type'] == 'tokens':
        amount = reward_data['amount']
        user.balance += amount
        user.total_earned += amount
        distribute_referral_rewards(user, amount, db)
        result['amount'] = amount
        result['message'] = f'🎉 مبروك! حصلت على {amount} BFLX!'
        
    elif reward_data['type'] == 'energy':
        amount = reward_data['amount']
        user.energy = min(user.energy + amount, user.max_energy)
        result['amount'] = amount
        result['message'] = f'⚡ رائع! حصلت على {amount} طاقة!'
        
    elif reward_data['type'] == 'box':
        box_type = reward_data['box_type']
        new_box = MysteryBox(user_id=user.id, box_type=box_type)
        db.add(new_box)
        result['box_type'] = box_type
        result['message'] = f'{config.BOX_TYPES[box_type]["emoji"]} مبروك! حصلت على صندوق {config.BOX_TYPES[box_type]["name"]}!'
    
    user.last_spin = now
    user.xp += 50
    
    check_level_up(user, db)
    update_challenge_progress(user, 'spin_wheel', 1, db)
    
    db.commit()
    
    return result

def open_mystery_box(box: MysteryBox, user: User, db: Session) -> dict:
    if box.is_opened:
        return {'success': False, 'message': 'هذا الصندوق مفتوح بالفعل!'}
    
    box_config = config.BOX_TYPES[box.box_type]
    reward = random.randint(box_config['min_reward'], box_config['max_reward'])
    
    box.is_opened = True
    box.reward = reward
    user.balance += reward
    user.total_earned += reward
    user.xp += int(reward / 100)
    
    distribute_referral_rewards(user, reward, db)
    
    check_level_up(user, db)
    
    db.commit()
    
    return {
        'success': True,
        'reward': reward,
        'box_type': box.box_type,
        'message': f'{box_config["emoji"]} مبروك! حصلت على {reward} BFLX من الصندوق {box_config["name"]}!'
    }

def upgrade_feature(user: User, feature: str, db: Session) -> dict:
    if feature not in config.UPGRADE_COSTS:
        return {'success': False, 'message': 'ترقية غير صحيحة!'}
    
    level_map = {
        'tap_power': user.tap_power_level,
        'energy_capacity': user.energy_capacity_level,
        'auto_mining': user.auto_mining_level,
        'energy_regen': user.energy_regen_level
    }
    
    current_level = level_map[feature]
    next_level = current_level + 1
    
    if next_level not in config.UPGRADE_COSTS[feature]:
        return {'success': False, 'message': 'وصلت للمستوى الأقصى! 🌟'}
    
    cost = config.UPGRADE_COSTS[feature][next_level]
    
    if user.balance < cost:
        return {'success': False, 'message': f'تحتاج {cost} BFLX للترقية! 💰'}
    
    user.balance -= cost
    
    if feature == 'tap_power':
        user.tap_power_level = next_level
        user.tap_power = 1 + next_level
    elif feature == 'energy_capacity':
        user.energy_capacity_level = next_level
        user.max_energy = config.INITIAL_ENERGY + (next_level * 200)
    elif feature == 'auto_mining':
        user.auto_mining_level = next_level
        user.auto_mining_rate = config.AUTO_MINING_BASE_RATE + (next_level * 10)
    elif feature == 'energy_regen':
        user.energy_regen_level = next_level
    
    db.commit()
    
    return {
        'success': True,
        'feature': feature,
        'new_level': next_level,
        'cost': cost
    }

def check_level_up(user: User, db: Session) -> bool:
    next_level = user.level + 1
    if next_level in config.LEVEL_XP_REQUIREMENTS:
        required_xp = config.LEVEL_XP_REQUIREMENTS[next_level]
        if user.xp >= required_xp:
            user.level = next_level
            db.commit()
            return True
    return False

def update_challenge_progress(user: User, challenge_id: str, progress: int, db: Session):
    today = datetime.utcnow().date()
    
    challenge = db.query(UserChallenge).filter(
        UserChallenge.user_id == user.id,
        UserChallenge.challenge_id == challenge_id,
        UserChallenge.date >= datetime.combine(today, datetime.min.time())
    ).first()
    
    if not challenge:
        challenge = UserChallenge(
            user_id=user.id,
            challenge_id=challenge_id,
            progress=0
        )
        db.add(challenge)
    
    if not challenge.completed:
        challenge.progress += progress
        
        challenge_config = next((c for c in config.DAILY_CHALLENGES if c['id'] == challenge_id), None)
        if challenge_config and challenge.progress >= challenge_config['target']:
            challenge.completed = True
            reward = challenge_config['reward']
            user.balance += reward
            user.total_earned += reward
            distribute_referral_rewards(user, reward, db)

def start_speed_challenge(user: User, db: Session) -> dict:
    return {
        'success': True,
        'duration': 30,
        'message': 'انقر بأسرع ما يمكن خلال 30 ثانية! 🚀'
    }

def complete_speed_challenge(user: User, score: int, db: Session) -> dict:
    reward = score * 2
    
    user.balance += reward
    user.total_earned += reward
    user.xp += int(score / 10)
    
    distribute_referral_rewards(user, reward, db)
    
    speed_challenge = SpeedChallenge(
        user_id=user.id,
        score=score,
        reward=reward
    )
    db.add(speed_challenge)
    
    check_level_up(user, db)
    
    db.commit()
    
    return {
        'success': True,
        'score': score,
        'reward': reward,
        'message': f'🎉 رائع! نقرت {score} مرة وحصلت على {reward} BFLX!'
    }

def get_user_stats(user: User, db: Session) -> dict:
    unopened_boxes = db.query(MysteryBox).filter(
        MysteryBox.user_id == user.id,
        MysteryBox.is_opened == False
    ).count()
    
    achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id
    ).count()
    
    auto_reward, hours = calculate_auto_mining_reward(user)
    
    return {
        'balance': user.balance,
        'level': user.level,
        'xp': user.xp,
        'energy': user.energy,
        'max_energy': user.max_energy,
        'tap_power': user.tap_power,
        'auto_mining_rate': user.auto_mining_rate,
        'pending_auto_reward': auto_reward,
        'referral_count': user.referral_count,
        'total_earned': user.total_earned,
        'total_taps': user.total_taps,
        'unopened_boxes': unopened_boxes,
        'achievements': achievements,
        'daily_streak': user.daily_streak
    }
