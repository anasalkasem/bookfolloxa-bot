from sqlalchemy import create_engine, Column, Integer, BigInteger, String, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import config

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(BigInteger, primary_key=True)
    username = Column(String(255), nullable=True)
    first_name = Column(String(255), nullable=True)
    balance = Column(BigInteger, default=0)
    diamonds = Column(Integer, default=0)
    influence_points = Column(BigInteger, default=0)
    
    energy = Column(Integer, default=config.INITIAL_ENERGY)
    max_energy = Column(Integer, default=config.INITIAL_ENERGY)
    last_energy_update = Column(DateTime, default=datetime.utcnow)
    
    tap_power = Column(Integer, default=1)
    tap_power_level = Column(Integer, default=0)
    
    auto_mining_rate = Column(Integer, default=config.AUTO_MINING_BASE_RATE)
    auto_mining_level = Column(Integer, default=0)
    last_auto_claim = Column(DateTime, default=datetime.utcnow)
    
    energy_capacity_level = Column(Integer, default=0)
    energy_regen_level = Column(Integer, default=0)
    
    level = Column(Integer, default=1)
    xp = Column(BigInteger, default=0)
    
    total_taps = Column(BigInteger, default=0)
    total_earned = Column(BigInteger, default=0)
    
    referrer_id = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    referral_count = Column(Integer, default=0)
    referral_earnings = Column(BigInteger, default=0)
    
    daily_streak = Column(Integer, default=0)
    last_daily_claim = Column(DateTime, nullable=True)
    
    last_spin = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    referrals = relationship('User', backref='referrer', remote_side=[id])
    boxes = relationship('MysteryBox', back_populates='user')
    challenges = relationship('UserChallenge', back_populates='user')
    achievements = relationship('UserAchievement', back_populates='user')


class MysteryBox(Base):
    __tablename__ = 'mystery_boxes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    box_type = Column(String(50))
    is_opened = Column(Boolean, default=False)
    reward = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', back_populates='boxes')


class UserChallenge(Base):
    __tablename__ = 'user_challenges'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    challenge_id = Column(String(100))
    progress = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', back_populates='challenges')


class UserAchievement(Base):
    __tablename__ = 'user_achievements'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    achievement_id = Column(String(100))
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', back_populates='achievements')


class SpeedChallenge(Base):
    __tablename__ = 'speed_challenges'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    score = Column(Integer)
    reward = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class Leaderboard(Base):
    __tablename__ = 'leaderboard'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    period = Column(String(20))
    score = Column(BigInteger)
    rank = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Payment(Base):
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    charge_id = Column(String(255), unique=True)
    invoice_payload = Column(String(255))
    amount_stars = Column(Integer)
    amount_bflx = Column(BigInteger)
    status = Column(String(50), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)


class WalletTransaction(Base):
    __tablename__ = 'wallet_transactions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    transaction_type = Column(String(20))  # 'deposit' or 'withdraw'
    amount_bflx = Column(BigInteger)  # BFLX amount
    amount_crypto = Column(Float)  # Crypto amount (USDT/TON)
    currency = Column(String(10))  # 'USDT', 'TON', 'BTC'
    wallet_address = Column(String(255), nullable=True)  # For withdrawals
    order_id = Column(String(255), unique=True)  # Telegram Wallet Pay order ID
    status = Column(String(50), default='pending')  # pending, completed, failed, cancelled
    tx_hash = Column(String(255), nullable=True)  # Blockchain transaction hash
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


engine = create_engine(
    config.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20
)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass

def init_db():
    Base.metadata.create_all(engine)
