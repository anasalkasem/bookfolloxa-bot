// ===== GAME STATE =====
const gameState = {
    bflx: 1000,
    followers: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 5,
    miningPerHour: 0, // Auto-mining
    level: 1,
    influencers: [],
    referrals: [],
    totalReferralEarnings: 0,
    settings: {
        sound: true,
        vibration: true
    },
    userGender: 'male', // 'male' or 'female'
    lastOnline: Date.now(),
    lastAdWatch: 0,
    dailyRewardDay: 0,
    lastDailyClaim: 0
};

// ===== CONSTANTS =====
const ENERGY_REGEN_RATE = 1;
const ENERGY_REGEN_INTERVAL = 3000;
const MINING_UPDATE_INTERVAL = 1000;
const SAVE_INTERVAL = 5000;

// ===== INFLUENCER DATA =====
const influencerTypes = [
    { id: 1, name: 'Nano Influencer', icon: '👤', cost: 100, income: 10, level: 1 },
    { id: 2, name: 'Micro Influencer', icon: '⭐', cost: 1500, income: 150, level: 5 },
    { id: 3, name: 'Mid-tier Influencer', icon: '🌟', cost: 20000, income: 2000, level: 10 },
    { id: 4, name: 'Macro Influencer', icon: '💫', cost: 300000, income: 30000, level: 20 },
    { id: 5, name: 'Mega Influencer', icon: '✨', cost: 5000000, income: 500000, level: 30 }
];

// ===== TASKS DATA =====
const tasksData = {
    daily: [
        { id: 'd1', title: 'Login Daily', reward: 500, completed: false },
        { id: 'd2', title: 'Tap 100 times', reward: 1000, progress: 0, target: 100, completed: false },
        { id: 'd3', title: 'Hire an influencer', reward: 2000, completed: false }
    ],
    social: [
        { id: 's1', title: 'Follow on Twitter', reward: 5000, url: 'https://twitter.com/bookfolloxa', completed: false },
        { id: 's2', title: 'Join Telegram', reward: 5000, url: 'https://t.me/bookfolloxa', completed: false },
        { id: 's3', title: 'Like on Instagram', reward: 3000, url: 'https://instagram.com/bookfolloxa', completed: false }
    ],
    referral: [
        { id: 'r1', title: 'Invite 1 friend', reward: 10000, target: 1, progress: 0, completed: false },
        { id: 'r2', title: 'Invite 5 friends', reward: 50000, target: 5, progress: 0, completed: false },
        { id: 'r3', title: 'Invite 10 friends', reward: 100000, target: 10, progress: 0, completed: false }
    ]
};

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupEventListeners();
    startGameLoops();
    loadGameState();
    calculateOfflineEarnings();
});

function initGame() {
    // Detect gender from Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe.user;
        if (user) {
            document.getElementById('username').textContent = user.first_name || 'Player';
            // Note: Telegram doesn't provide gender, so we'll use male as default
            // You can add a settings option to let users choose
        }
    }
    
    // Set character based on gender
    updateCharacter();
    updateUI();
    console.log('🎮 Bookfolloxa Game Initialized!');
}

function updateCharacter() {
    const character = document.getElementById('mainCharacter');
    if (gameState.userGender === 'female') {
        character.src = 'assets/character-female.png';
    } else {
        character.src = 'assets/character-male.png';
    }
}

// ===== OFFLINE EARNINGS =====
function calculateOfflineEarnings() {
    const now = Date.now();
    const timeDiff = now - gameState.lastOnline;
    const hoursOffline = timeDiff / (1000 * 60 * 60);
    
    if (hoursOffline > 0.1 && gameState.miningPerHour > 0) {
        const maxOfflineHours = 3; // Max 3 hours offline earnings
        const actualHours = Math.min(hoursOffline, maxOfflineHours);
        const offlineEarnings = Math.floor(gameState.miningPerHour * actualHours);
        
        if (offlineEarnings > 0) {
            gameState.bflx += offlineEarnings;
            gameState.followers += offlineEarnings;
            showNotification(`⛏️ Welcome back! You earned ${formatNumber(offlineEarnings)} BFLX while offline!`, 'success');
        }
    }
    
    gameState.lastOnline = now;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Character tap
    const character = document.getElementById('mainCharacter');
    character.addEventListener('click', handleCharacterTap);
    character.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleCharacterTap(e);
    });
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => handleNavigation(item));
    });
    
    // Invite button
    document.getElementById('inviteBtn').addEventListener('click', handleInvite);
    document.getElementById('copyLinkBtn').addEventListener('click', copyReferralLink);
    
    // Settings toggles
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        gameState.settings.sound = e.target.checked;
        saveGameState();
    });
    
    document.getElementById('vibrationToggle').addEventListener('change', (e) => {
        gameState.settings.vibration = e.target.checked;
        saveGameState();
    });
}

// ===== CHARACTER TAP HANDLER =====
function handleCharacterTap(e) {
    if (gameState.energy < gameState.tapPower) {
        showNotification('⚡ Not enough energy!', 'error');
        shakeCharacter();
        return;
    }
    
    // Update game state
    gameState.bflx += gameState.tapPower;
    gameState.followers += gameState.tapPower;
    gameState.energy -= gameState.tapPower;
    
    // Visual effects
    animateCharacter();
    createFloatingNumber(gameState.tapPower, e);
    createParticles(e);
    
    // Haptic feedback
    if (gameState.settings.vibration && window.navigator.vibrate) {
        window.navigator.vibrate(10);
    }
    
    // Sound effect (you can add actual sound file)
    playSound('tap');
    
    // Update UI
    updateUI();
    
    // Update tasks
    updateTaskProgress('d2', 1);
}

function animateCharacter() {
    const character = document.getElementById('mainCharacter');
    character.classList.add('tap-animation');
    setTimeout(() => {
        character.classList.remove('tap-animation');
    }, 300);
}

function shakeCharacter() {
    const character = document.getElementById('mainCharacter');
    character.classList.add('shake');
    setTimeout(() => {
        character.classList.remove('shake');
    }, 500);
}

// ===== VISUAL EFFECTS =====
function createFloatingNumber(value, event) {
    const container = document.getElementById('floatingNumbers');
    const floatNum = document.createElement('div');
    floatNum.className = 'float-number';
    floatNum.textContent = `+${formatNumber(value)}`;
    
    // Position
    const rect = event.target.getBoundingClientRect();
    const x = (event.clientX || (event.touches && event.touches[0].clientX) || rect.width / 2);
    const y = (event.clientY || (event.touches && event.touches[0].clientY) || rect.height / 2);
    
    floatNum.style.left = `${x - rect.left}px`;
    floatNum.style.top = `${y - rect.top}px`;
    floatNum.style.background = 'linear-gradient(135deg, #ff6b9d, #7c3aed)';
    floatNum.style.webkitBackgroundClip = 'text';
    floatNum.style.webkitTextFillColor = 'transparent';
    floatNum.style.backgroundClip = 'text';
    
    container.appendChild(floatNum);
    
    setTimeout(() => floatNum.remove(), 1500);
}

function createParticles(event) {
    const particles = ['❤️', '👍', '📱', '📸', '🎵', '▶️', '💬', '⭐'];
    const container = document.getElementById('floatingNumbers');
    
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'float-number';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.fontSize = '28px';
        
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angle = (Math.PI * 2 * i) / 6;
        const distance = 60;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}

// ===== NAVIGATION =====
function handleNavigation(navItem) {
    const page = navItem.dataset.page;
    
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    navItem.classList.add('active');
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load page content
        if (page === 'influencers') {
            renderInfluencers();
        } else if (page === 'tasks') {
            renderTasks('daily');
        } else if (page === 'referral') {
            renderReferralPage();
        }
    }
}

// ===== INFLUENCERS =====
function renderInfluencers() {
    const list = document.getElementById('influencerList');
    
    list.innerHTML = influencerTypes.map(inf => `
        <div class="influencer-card ${gameState.bflx >= inf.cost && gameState.level >= inf.level ? '' : 'locked'}">
            <div class="influencer-icon">${inf.icon}</div>
            <div class="influencer-info">
                <div class="influencer-name">${inf.name}</div>
                <div class="influencer-income">⛏️ ${formatNumber(inf.income)}/hour</div>
            </div>
            <button class="influencer-hire-btn" onclick="hireInfluencer(${inf.id})" 
                    ${gameState.bflx >= inf.cost && gameState.level >= inf.level ? '' : 'disabled'}>
                💎 ${formatNumber(inf.cost)}
            </button>
        </div>
    `).join('');
}

function hireInfluencer(id) {
    const influencer = influencerTypes.find(inf => inf.id === id);
    
    if (gameState.bflx < influencer.cost) {
        showNotification('❌ Not enough BFLX!', 'error');
        return;
    }
    
    if (gameState.level < influencer.level) {
        showNotification(`❌ Reach level ${influencer.level} first!`, 'error');
        return;
    }
    
    gameState.bflx -= influencer.cost;
    gameState.influencers.push({ ...influencer, hiredAt: Date.now() });
    gameState.miningPerHour += influencer.income;
    
    showNotification(`✅ Hired ${influencer.name}! +${formatNumber(influencer.income)}/hour`, 'success');
    updateUI();
    renderInfluencers();
    
    updateTaskProgress('d3', 1);
}

// ===== TASKS =====
function renderTasks(category) {
    const list = document.getElementById('tasksList');
    const tasks = tasksData[category];
    
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === category) {
            btn.classList.add('active');
        }
    });
    
    // Setup tab listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => renderTasks(btn.dataset.tab);
    });
    
    list.innerHTML = tasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}">
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                ${task.target ? `<div class="task-progress">${task.progress || 0} / ${task.target}</div>` : ''}
            </div>
            <div class="task-reward">
                ${task.completed ? '✅' : `💎 ${formatNumber(task.reward)}`}
            </div>
        </div>
    `).join('');
}

function updateTaskProgress(taskId, amount) {
    for (let category in tasksData) {
        const task = tasksData[category].find(t => t.id === taskId);
        if (task && !task.completed) {
            if (task.target) {
                task.progress = (task.progress || 0) + amount;
                if (task.progress >= task.target) {
                    completeTask(task);
                }
            } else {
                completeTask(task);
            }
        }
    }
}

function completeTask(task) {
    task.completed = true;
    gameState.bflx += task.reward;
    showNotification(`🎉 Task completed! +${formatNumber(task.reward)} BFLX`, 'success');
    updateUI();
}

// ===== REFERRAL SYSTEM =====
function renderReferralPage() {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo123';
    const botUsername = 'Bookfolloxa_bot'; // Replace with your actual bot username
    const referralLink = `https://t.me/${botUsername}?start=ref_${userId}`;
    
    document.getElementById('referralLink').value = referralLink;
    document.getElementById('totalReferrals').textContent = gameState.referrals.length;
    document.getElementById('referralEarnings').textContent = formatNumber(gameState.totalReferralEarnings);
    
    // Update referral tasks
    tasksData.referral.forEach(task => {
        task.progress = gameState.referrals.length;
        if (task.progress >= task.target && !task.completed) {
            completeTask(task);
        }
    });
    
    // Render referrals list
    const referralsList = document.getElementById('referralsList');
    if (gameState.referrals.length === 0) {
        referralsList.innerHTML = '<p style="text-align: center; color: #a0aec0;">No referrals yet. Start inviting!</p>';
    } else {
        referralsList.innerHTML = gameState.referrals.map(ref => `
            <div class="task-card">
                <div class="task-info">
                    <div class="task-title">${ref.name}</div>
                    <div class="task-progress">Earned: ${formatNumber(ref.earnings)}</div>
                </div>
                <div class="task-reward">💰</div>
            </div>
        `).join('');
    }
}

function handleInvite() {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo123';
    const botUsername = 'Bookfolloxa_bot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${userId}`;
    const message = `🎁 Join Bookfolloxa and start earning!\n\n💰 Build your influencer empire\n⛏️ Auto-mining rewards\n🎮 Fun games & challenges\n\n${referralLink}`;
    
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`);
    } else {
        copyReferralLink();
    }
}

function copyReferralLink() {
    const input = document.getElementById('referralLink');
    input.select();
    document.execCommand('copy');
    showNotification('📋 Link copied!', 'success');
}

// ===== GAME LOOPS =====
function startGameLoops() {
    // Energy regeneration
    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + ENERGY_REGEN_RATE);
            updateUI();
        }
    }, ENERGY_REGEN_INTERVAL);
    
    // Auto-mining
    setInterval(() => {
        if (gameState.miningPerHour > 0) {
            const miningPerSecond = gameState.miningPerHour / 3600;
            gameState.bflx += miningPerSecond;
            gameState.followers += miningPerSecond;
            updateUI();
        }
    }, MINING_UPDATE_INTERVAL);
    
    // Auto-save
    setInterval(() => {
        saveGameState();
    }, SAVE_INTERVAL);
}

// ===== UI UPDATES =====
function updateUI() {
    // Header stats
    document.getElementById('bflxBalance').textContent = formatNumber(gameState.bflx);
    document.getElementById('followersCount').textContent = formatNumber(gameState.followers);
    document.getElementById('levelBadge').textContent = gameState.level;
    
    // Tap power
    document.getElementById('tapPower').textContent = gameState.tapPower;
    
    // Mining income
    document.getElementById('incomePerHour').textContent = formatNumber(gameState.miningPerHour);
    
    // Energy
    const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
    document.getElementById('energyFill').style.width = `${energyPercent}%`;
    document.getElementById('currentEnergy').textContent = Math.floor(gameState.energy);
    document.getElementById('maxEnergy').textContent = gameState.maxEnergy;
}

// ===== UTILITIES =====
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(26, 31, 58, 0.95);
        backdrop-filter: blur(20px);
        padding: 16px 24px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideDown 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        max-width: 80%;
        text-align: center;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function playSound(type) {
    if (!gameState.settings.sound) return;
    
    // You can add actual sound files here
    // const audio = new Audio(`sounds/${type}.mp3`);
    // audio.play();
}

// ===== SAVE/LOAD =====
function saveGameState() {
    gameState.lastOnline = Date.now();
    localStorage.setItem('bookfolloxa_game', JSON.stringify(gameState));
    
    // Sync with backend if available
    if (typeof syncUserToBackend === 'function') {
        syncUserToBackend(gameState).catch(err => {
            console.warn('⚠️ Backend sync failed:', err);
        });
    }
}

function loadGameState() {
    const saved = localStorage.getItem('bookfolloxa_game');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
        updateCharacter();
        updateUI();
        console.log('💾 Game loaded!');
    }
}

// ===== STORE & MONETIZATION =====
function buyBFLX(package) {
    const packages = {
        starter: { amount: 50000, price: 0.99 },
        popular: { amount: 250000, price: 4.99 },
        pro: { amount: 1000000, price: 14.99 },
        ultimate: { amount: 5000000, price: 49.99 }
    };
    
    const pkg = packages[package];
    showNotification(`💳 Opening payment for ${formatNumber(pkg.amount)} BFLX ($${pkg.price})...`, 'info');
    
    // Simulate purchase (in real app, use Telegram Payments API)
    setTimeout(() => {
        gameState.bflx += pkg.amount;
        showNotification(`✅ Purchase successful! +${formatNumber(pkg.amount)} BFLX`, 'success');
        updateUI();
        saveGameState();
    }, 1500);
}

function buyService(service) {
    const services = {
        ig_100: { name: '100 Instagram Followers', cost: 10000 },
        tt_1000: { name: '1000 TikTok Likes', cost: 20000 }
    };
    
    const svc = services[service];
    
    if (gameState.bflx < svc.cost) {
        showNotification('❌ Not enough BFLX!', 'error');
        return;
    }
    
    gameState.bflx -= svc.cost;
    showNotification(`✅ Order placed for ${svc.name}!`, 'success');
    updateUI();
    saveGameState();
}

function watchAd() {
    const now = Date.now();
    const cooldown = 5 * 60 * 1000; // 5 minutes
    const timeSinceLastAd = now - gameState.lastAdWatch;
    
    if (timeSinceLastAd < cooldown) {
        const remaining = Math.ceil((cooldown - timeSinceLastAd) / 1000 / 60);
        showNotification(`⏰ Please wait ${remaining} more minutes`, 'error');
        return;
    }
    
    showNotification('📺 Loading ad...', 'info');
    
    // Simulate ad watch (in real app, use actual ad SDK)
    setTimeout(() => {
        gameState.bflx += 500;
        gameState.lastAdWatch = now;
        showNotification('✅ Ad completed! +500 BFLX', 'success');
        updateUI();
        saveGameState();
        updateAdCooldown();
    }, 2000);
}

function updateAdCooldown() {
    const cooldownEl = document.getElementById('adCooldown');
    if (!cooldownEl) return;
    
    const cooldown = 5 * 60 * 1000;
    const timeSinceLastAd = Date.now() - gameState.lastAdWatch;
    
    if (timeSinceLastAd < cooldown) {
        const remaining = Math.ceil((cooldown - timeSinceLastAd) / 1000 / 60);
        cooldownEl.textContent = `⏰ ${remaining}m`;
    } else {
        cooldownEl.textContent = '';
    }
}

// ===== LEADERBOARD =====
async function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    
    // Try to load real leaderboard from backend
    let players = null;
    if (typeof loadRealLeaderboard === 'function') {
        players = await loadRealLeaderboard();
    }
    
    // Fallback to mock data if backend fails
    if (!players) {
        players = [
            { rank: 1, first_name: 'Mohammed', total_earned: 5000000 },
            { rank: 2, first_name: 'Sara', total_earned: 3500000 },
            { rank: 3, first_name: 'Ahmed', total_earned: 2800000 },
            { rank: 4, first_name: 'Fatima', total_earned: 1900000 },
            { rank: 5, first_name: 'You', total_earned: gameState.bflx }
        ];
    }
    
    const userId = getTelegramUserId && getTelegramUserId();
    
    leaderboardList.innerHTML = players.slice(0, 10).map(player => {
        const isCurrentUser = userId && player.id === userId;
        const rankBadge = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`;
        const avatar = player.rank === 1 ? '👑' : player.rank === 2 ? '💎' : player.rank === 3 ? '⭐' : isCurrentUser ? '👤' : '🌟';
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'highlight' : ''}">
                <div class="rank">${rankBadge}</div>
                <div class="player-avatar">${avatar}</div>
                <div class="player-info">
                    <div class="player-name">${player.first_name || player.username || 'Anonymous'}</div>
                    <div class="player-earnings">${formatNumber(player.total_earned)} BFLX</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== DAILY REWARDS =====
function renderDailyRewards() {
    const grid = document.getElementById('dailyRewardsGrid');
    const rewards = [
        { day: 1, reward: 1000 },
        { day: 2, reward: 2000 },
        { day: 3, reward: 3000 },
        { day: 4, reward: 5000 },
        { day: 5, reward: 7000 },
        { day: 6, reward: 10000 },
        { day: 7, reward: 20000 }
    ];
    
    const currentDay = gameState.dailyRewardDay;
    
    grid.innerHTML = rewards.map(r => `
        <div class="daily-reward-card ${r.day <= currentDay ? 'claimed' : ''} ${r.day === currentDay + 1 ? 'next' : ''}">
            <div class="day-badge">Day ${r.day}</div>
            <div class="reward-amount">${formatNumber(r.reward)} BFLX</div>
            ${r.day <= currentDay ? '<div class="claimed-badge">✅</div>' : ''}
        </div>
    `).join('');
    
    // Check if can claim
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const canClaim = (now - gameState.lastDailyClaim) >= oneDayMs;
    
    const claimBtn = document.getElementById('claimDailyBtn');
    if (canClaim && currentDay < 7) {
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim Today\'s Reward';
    } else if (currentDay >= 7) {
        claimBtn.disabled = true;
        claimBtn.textContent = 'All Rewards Claimed! 🎉';
    } else {
        claimBtn.disabled = true;
        const hoursLeft = Math.ceil((oneDayMs - (now - gameState.lastDailyClaim)) / (60 * 60 * 1000));
        claimBtn.textContent = `Come back in ${hoursLeft}h`;
    }
}

function claimDailyReward() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if ((now - gameState.lastDailyClaim) < oneDayMs) {
        showNotification('⏰ Come back tomorrow!', 'error');
        return;
    }
    
    gameState.dailyRewardDay++;
    gameState.lastDailyClaim = now;
    
    const rewards = [1000, 2000, 3000, 5000, 7000, 10000, 20000];
    const reward = rewards[gameState.dailyRewardDay - 1];
    
    gameState.bflx += reward;
    showNotification(`🎉 Daily reward claimed! +${formatNumber(reward)} BFLX`, 'success');
    updateUI();
    renderDailyRewards();
    saveGameState();
}

// ===== HELPER: SHOW PAGE =====
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load content
        if (pageName === 'store') {
            updateAdCooldown();
            setInterval(updateAdCooldown, 60000);
        } else if (pageName === 'leaderboard') {
            renderLeaderboard();
        } else if (pageName === 'daily') {
            renderDailyRewards();
        }
    }
}

// ===== ANIMATIONS CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Bookfolloxa Game Initialized!');
    
    // Load from localStorage first
    loadGameState();
    
    // Then init backend integration (will override with server data if available)
    if (typeof initBackendIntegration === 'function') {
        await initBackendIntegration(gameState);
    }
    
    // Initialize UI
    updateUI();
    updateCharacter();
    renderInfluencers();
    renderTasks();
    renderReferralPage();
    renderMorePage();
    
    // Start game loops
    setInterval(regenerateEnergy, ENERGY_REGEN_INTERVAL);
    setInterval(updateMining, MINING_UPDATE_INTERVAL);
    setInterval(saveGameState, SAVE_INTERVAL);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    // Telegram WebApp ready
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
});
