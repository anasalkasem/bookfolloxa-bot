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
        vibration: true,
        music: false
    },
    userGender: 'male', // 'male' or 'female'
    lastOnline: Date.now(),
    lastAdWatch: 0,
    dailyRewardDay: 0,
    lastDailyClaim: 0,
    walletConnected: false,
    walletAddress: null
};

// ===== MUSIC SYSTEM =====
let musicContext = null;
let musicGain = null;
let isPlaying = false;

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
    const avatarImg = document.querySelector('.avatar-img');
    
    if (gameState.userGender === 'female') {
        character.src = 'assets/character-female.png';
        if (avatarImg) avatarImg.src = 'assets/character-female.png';
    } else {
        character.src = 'assets/character-male.png';
        if (avatarImg) avatarImg.src = 'assets/character-male.png';
    }
}

function changeCharacter(gender) {
    gameState.userGender = gender;
    updateCharacter();
    updateGenderButtons();
    saveGameState();
    
    playSound('success');
    triggerHaptic('light');
    showNotification(`✨ Character changed to ${gender === 'male' ? '♂️ Male' : '♀️ Female'}!`, 'success');
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
    if (isPlaying && !musicContext) {
        initBackgroundMusic();
        if (musicContext && musicContext.state === 'suspended') {
            musicContext.resume();
        }
        playMelody();
    }
    
    if (gameState.energy < gameState.tapPower) {
        showNotification('⚡ Not enough energy!', 'error');
        shakeCharacter();
        playSound('error');
        triggerHaptic('error');
        return;
    }
    
    // Critical hit chance (10%)
    const isCritical = Math.random() < 0.1;
    const multiplier = isCritical ? 10 : 1;
    const earnedBFLX = gameState.tapPower * multiplier;
    
    // Update game state
    gameState.bflx += earnedBFLX;
    gameState.followers += earnedBFLX;
    gameState.energy -= gameState.tapPower;
    
    // Visual effects
    if (isCritical) {
        animateCriticalHit();
        createFloatingNumber(earnedBFLX, e, true);
        createCriticalParticles(e);
        playSound('critical');
        triggerHaptic('critical');
        showNotification('🔥 CRITICAL HIT! ×10 BFLX!', 'success');
    } else {
        animateCharacter();
        createFloatingNumber(earnedBFLX, e, false);
        createParticles(e);
        playSound('tap');
        triggerHaptic('light');
    }
    
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

function animateCriticalHit() {
    const character = document.getElementById('mainCharacter');
    character.classList.add('critical-hit');
    setTimeout(() => {
        character.classList.remove('critical-hit');
    }, 600);
}

function shakeCharacter() {
    const character = document.getElementById('mainCharacter');
    character.classList.add('shake');
    setTimeout(() => {
        character.classList.remove('shake');
    }, 500);
}

// ===== HAPTIC FEEDBACK =====
function triggerHaptic(type) {
    if (!gameState.settings.vibration) return;
    
    // Use Telegram WebApp haptic feedback if available
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        const haptic = window.Telegram.WebApp.HapticFeedback;
        
        switch(type) {
            case 'light':
                haptic.impactOccurred('light');
                break;
            case 'medium':
                haptic.impactOccurred('medium');
                break;
            case 'heavy':
                haptic.impactOccurred('heavy');
                break;
            case 'critical':
                haptic.notificationOccurred('success');
                break;
            case 'error':
                haptic.notificationOccurred('error');
                break;
            case 'success':
                haptic.notificationOccurred('success');
                break;
        }
    } 
    // Fallback to navigator.vibrate
    else if (window.navigator.vibrate) {
        switch(type) {
            case 'light':
                window.navigator.vibrate(10);
                break;
            case 'medium':
                window.navigator.vibrate(20);
                break;
            case 'heavy':
                window.navigator.vibrate(30);
                break;
            case 'critical':
                window.navigator.vibrate([30, 50, 30]);
                break;
            case 'error':
                window.navigator.vibrate([50, 100]);
                break;
            case 'success':
                window.navigator.vibrate([20, 50, 20]);
                break;
        }
    }
}

// ===== VISUAL EFFECTS =====
function createFloatingNumber(value, event, isCritical = false) {
    const container = document.getElementById('floatingNumbers');
    const floatNum = document.createElement('div');
    floatNum.className = 'float-number';
    
    if (isCritical) {
        floatNum.className += ' critical-number';
        floatNum.textContent = `🔥 +${formatNumber(value)} ×10`;
        floatNum.style.fontSize = '42px';
        floatNum.style.fontWeight = 'bold';
        floatNum.style.background = 'linear-gradient(135deg, #ff0000, #ffaa00, #ff0000)';
        floatNum.style.webkitBackgroundClip = 'text';
        floatNum.style.webkitTextFillColor = 'transparent';
        floatNum.style.backgroundClip = 'text';
        floatNum.style.textShadow = '0 0 20px rgba(255, 100, 0, 0.8)';
    } else {
        floatNum.textContent = `+${formatNumber(value)}`;
        floatNum.style.fontSize = '32px';
        floatNum.style.background = 'linear-gradient(135deg, #ff6b9d, #7c3aed)';
        floatNum.style.webkitBackgroundClip = 'text';
        floatNum.style.webkitTextFillColor = 'transparent';
        floatNum.style.backgroundClip = 'text';
    }
    
    // Position
    const rect = event.target.getBoundingClientRect();
    const x = (event.clientX || (event.touches && event.touches[0].clientX) || rect.width / 2);
    const y = (event.clientY || (event.touches && event.touches[0].clientY) || rect.height / 2);
    
    floatNum.style.left = `${x - rect.left}px`;
    floatNum.style.top = `${y - rect.top}px`;
    
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
        particle.style.fontSize = '24px';
        
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

function createCriticalParticles(event) {
    const particles = ['🔥', '💥', '⚡', '✨', '💫', '🌟', '💯', '🎯'];
    const container = document.getElementById('floatingNumbers');
    
    // Create more particles for critical hit (12 instead of 6)
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'float-number critical-particle';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.fontSize = '32px';
        
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 80 + Math.random() * 40;
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
    
    // Clear existing tasks (safe DOM manipulation)
    list.innerHTML = '';
    
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        
        const info = document.createElement('div');
        info.className = 'task-info';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'task-title';
        titleDiv.textContent = task.title; // Safe: uses textContent instead of innerHTML
        info.appendChild(titleDiv);
        
        if (task.target) {
            const progressDiv = document.createElement('div');
            progressDiv.className = 'task-progress';
            progressDiv.textContent = `${task.progress || 0} / ${task.target}`;
            info.appendChild(progressDiv);
        }
        
        const reward = document.createElement('div');
        reward.className = 'task-reward';
        reward.textContent = task.completed ? '✅' : `💎 ${formatNumber(task.reward)}`;
        
        card.appendChild(info);
        card.appendChild(reward);
        list.appendChild(card);
    });
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
    referralsList.innerHTML = '';
    
    if (gameState.referrals.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#a0aec0';
        emptyMessage.textContent = 'No referrals yet. Start inviting!';
        referralsList.appendChild(emptyMessage);
    } else {
        gameState.referrals.forEach(ref => {
            const card = document.createElement('div');
            card.className = 'task-card';
            
            const taskInfo = document.createElement('div');
            taskInfo.className = 'task-info';
            
            const taskTitle = document.createElement('div');
            taskTitle.className = 'task-title';
            taskTitle.textContent = ref.name;
            
            const taskProgress = document.createElement('div');
            taskProgress.className = 'task-progress';
            taskProgress.textContent = `Earned: ${formatNumber(ref.earnings)}`;
            
            const taskReward = document.createElement('div');
            taskReward.className = 'task-reward';
            taskReward.textContent = '💰';
            
            taskInfo.appendChild(taskTitle);
            taskInfo.appendChild(taskProgress);
            card.appendChild(taskInfo);
            card.appendChild(taskReward);
            referralsList.appendChild(card);
        });
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

// ===== SOUND SYSTEM (Using Web Audio API) =====
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!gameState.settings.sound) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'tap':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
                
            case 'critical':
                oscillator.frequency.value = 1200;
                gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
                
            case 'purchase':
                oscillator.frequency.value = 600;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
                
            case 'success':
                oscillator.frequency.value = 900;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
                
            case 'error':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
        }
    } catch (err) {
        console.warn('Sound playback error:', err);
    }
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
        updateGenderButtons();
        console.log('💾 Game loaded!');
    }
    
    isPlaying = !!gameState.settings.music;
    updateMusicButtonState();
}

function updateGenderButtons() {
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.gender === gameState.userGender) {
            btn.classList.add('active');
        }
    });
}

// ===== STORE & MONETIZATION =====
async function buyBFLX(packageType) {
    const packages = {
        starter: { stars: 50, bflx: 2500, name: 'باقة المبتدئين' },
        pro: { stars: 200, bflx: 10000, name: 'باقة المحترف' },
        king: { stars: 800, bflx: 50000, name: 'باقة الملك' },
        legend: { stars: 2000, bflx: 150000, name: 'باقة الأسطورة' }
    };
    
    const pkg = packages[packageType];
    if (!pkg) {
        showNotification('❌ Invalid package!', 'error');
        return;
    }
    
    showNotification(`💳 Opening payment for ${formatNumber(pkg.bflx)} BFLX (${pkg.stars} ⭐ Stars)...`, 'info');
    
    try {
        const tg = window.Telegram?.WebApp;
        if (!tg) {
            showNotification('❌ Telegram WebApp not available', 'error');
            return;
        }
        
        const user = tg.initDataUnsafe?.user;
        if (!user) {
            showNotification('❌ User not found', 'error');
            return;
        }
        
        const initData = tg.initData;
        
        const response = await fetch('/api/create_invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': initData
            },
            body: JSON.stringify({
                telegram_id: user.id,
                package: packageType,
                _auth: initData
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.invoice_link) {
            tg.openInvoice(data.invoice_link, async (status) => {
                if (status === 'paid') {
                    showNotification(`⏳ Processing payment... Please wait`, 'info');
                    
                    // Wait for backend to process payment
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Sync with backend to get updated balance
                    if (typeof syncWithBackend === 'function') {
                        const synced = await syncWithBackend();
                        if (synced) {
                            showNotification(`✅ Payment successful! +${formatNumber(pkg.bflx)} BFLX`, 'success');
                            playSound('purchase');
                            triggerHaptic('medium');
                        } else {
                            showNotification('⏳ Payment is being processed. Check your balance in a moment.', 'info');
                        }
                    } else {
                        // Fallback: add locally and sync later
                        gameState.bflx += pkg.bflx;
                        showNotification(`✅ Payment successful! +${formatNumber(pkg.bflx)} BFLX`, 'success');
                        updateUI();
                        saveGameState();
                        playSound('purchase');
                        triggerHaptic('medium');
                    }
                } else if (status === 'cancelled') {
                    showNotification('❌ Payment cancelled', 'error');
                } else if (status === 'failed') {
                    showNotification('❌ Payment failed. Please try again.', 'error');
                }
            });
        } else {
            const errorMsg = data.error || 'Failed to create invoice';
            showNotification(`❌ ${errorMsg}`, 'error');
            console.error('Invoice creation failed:', data);
        }
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('❌ Payment error occurred', 'error');
    }
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

// ===== WALLET FUNCTIONS =====
function switchWalletTab(tab) {
    const depositTab = document.getElementById('depositTab');
    const withdrawTab = document.getElementById('withdrawTab');
    const tabs = document.querySelectorAll('.wallet-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'deposit') {
        depositTab.style.display = 'block';
        withdrawTab.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        depositTab.style.display = 'none';
        withdrawTab.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

async function depositCrypto() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const currency = document.getElementById('depositCurrency').value;
    
    if (!amount || amount < 1) {
        showNotification('❌ Minimum deposit is 1 USDT/TON', 'error');
        return;
    }
    
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (!user) {
        showNotification('❌ User not found', 'error');
        return;
    }
    
    showNotification(`💳 Creating deposit order for ${amount} ${currency}...`, 'info');
    
    try {
        const response = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': tg.initData
            },
            body: JSON.stringify({
                telegram_id: user.id,
                amount_crypto: amount,
                currency: currency,
                _auth: tg.initData
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.payment_link) {
            const bflxAmount = formatNumber(data.amount_bflx);
            document.getElementById('depositInfo').innerHTML = 
                `✅ Order created: ${amount} ${currency} = ${bflxAmount} BFLX<br>Opening payment...`;
            
            tg.openLink(data.payment_link);
            showNotification(`✅ Payment link opened! Complete payment in Telegram Wallet`, 'success');
        } else {
            showNotification(`❌ ${data.error || 'Failed to create deposit order'}`, 'error');
        }
    } catch (error) {
        console.error('Deposit error:', error);
        showNotification('❌ Deposit error occurred', 'error');
    }
}

async function withdrawCrypto() {
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const currency = document.getElementById('withdrawCurrency').value;
    
    if (!amount || amount < 10000) {
        showNotification('❌ Minimum withdrawal is 10,000 BFLX', 'error');
        return;
    }
    
    if (gameState.bflx < amount) {
        showNotification('❌ Insufficient balance', 'error');
        return;
    }
    
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (!user) {
        showNotification('❌ User not found', 'error');
        return;
    }
    
    const cryptoAmount = (amount / 1000).toFixed(2);
    showNotification(`💸 Processing withdrawal: ${formatNumber(amount)} BFLX → ${cryptoAmount} ${currency}...`, 'info');
    
    try {
        const response = await fetch('/api/wallet/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': tg.initData
            },
            body: JSON.stringify({
                telegram_id: user.id,
                amount_bflx: amount,
                currency: currency,
                _auth: tg.initData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.bflx -= amount;
            updateUI();
            saveGameState();
            
            document.getElementById('withdrawInfo').innerHTML = 
                `✅ Withdrawal requested: ${formatNumber(amount)} BFLX → ${cryptoAmount} ${currency}<br>
                Status: Pending (will be processed within 24 hours)`;
            showNotification(`✅ Withdrawal request submitted!`, 'success');
            
            document.getElementById('withdrawAmount').value = '';
        } else {
            showNotification(`❌ ${data.error || 'Withdrawal failed'}`, 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showNotification('❌ Withdrawal error occurred', 'error');
    }
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
    
    // Clear existing content safely
    leaderboardList.textContent = '';
    
    // Build leaderboard using safe DOM methods
    players.slice(0, 10).forEach(player => {
        const isCurrentUser = userId && player.id === userId;
        const rankBadge = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`;
        const avatar = player.rank === 1 ? '👑' : player.rank === 2 ? '💎' : player.rank === 3 ? '⭐' : isCurrentUser ? '👤' : '🌟';
        
        // Create elements
        const item = document.createElement('div');
        item.className = isCurrentUser ? 'leaderboard-item highlight' : 'leaderboard-item';
        
        const rank = document.createElement('div');
        rank.className = 'rank';
        rank.textContent = rankBadge;
        
        const playerAvatar = document.createElement('div');
        playerAvatar.className = 'player-avatar';
        playerAvatar.textContent = avatar;
        
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = player.first_name || player.username || 'Anonymous';
        
        const playerEarnings = document.createElement('div');
        playerEarnings.className = 'player-earnings';
        playerEarnings.textContent = `${formatNumber(player.total_earned)} BFLX`;
        
        // Assemble DOM tree
        playerInfo.appendChild(playerName);
        playerInfo.appendChild(playerEarnings);
        item.appendChild(rank);
        item.appendChild(playerAvatar);
        item.appendChild(playerInfo);
        leaderboardList.appendChild(item);
    });
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
    
    // Clear grid and rebuild using safe DOM methods
    grid.innerHTML = '';
    
    rewards.forEach(r => {
        const card = document.createElement('div');
        card.className = 'daily-reward-card';
        if (r.day <= currentDay) card.classList.add('claimed');
        if (r.day === currentDay + 1) card.classList.add('next');
        
        const dayBadge = document.createElement('div');
        dayBadge.className = 'day-badge';
        dayBadge.textContent = `Day ${r.day}`;
        
        const rewardAmount = document.createElement('div');
        rewardAmount.className = 'reward-amount';
        rewardAmount.textContent = `${formatNumber(r.reward)} BFLX`;
        
        card.appendChild(dayBadge);
        card.appendChild(rewardAmount);
        
        if (r.day <= currentDay) {
            const claimedBadge = document.createElement('div');
            claimedBadge.className = 'claimed-badge';
            claimedBadge.textContent = '✅';
            card.appendChild(claimedBadge);
        }
        
        grid.appendChild(card);
    });
    
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

// ===== MUSIC SYSTEM =====
function initBackgroundMusic() {
    if (!musicContext) {
        musicContext = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = musicContext.createGain();
        
        const compressor = musicContext.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 10;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        musicGain.connect(compressor);
        compressor.connect(musicContext.destination);
        musicGain.gain.value = 0.28;
    }
}

function playMelody() {
    if (!musicContext || !gameState.settings.music || !isPlaying) return;
    
    const melody = [
        { note: 'D5', duration: 0.6, velocity: 0.35, vibrato: true },
        { note: 'E5b', duration: 0.3, velocity: 0.25 },
        { note: 'D5', duration: 0.3, velocity: 0.3 },
        { note: 'C5', duration: 0.6, velocity: 0.3 },
        { note: 'D5', duration: 0.4, velocity: 0.25 },
        { note: 'E5b', duration: 0.8, velocity: 0.35, vibrato: true },
        { note: 'F5', duration: 0.4, velocity: 0.3 },
        { note: 'E5b', duration: 0.4, velocity: 0.28 },
        { note: 'D5', duration: 0.6, velocity: 0.35, vibrato: true },
        { note: 'C5', duration: 0.4, velocity: 0.25 },
        { note: 'Bb4', duration: 0.4, velocity: 0.25 },
        { note: 'C5', duration: 1.0, velocity: 0.35, vibrato: true },
        { note: 'D5', duration: 0.4, velocity: 0.3 },
        { note: 'E5b', duration: 0.4, velocity: 0.28 },
        { note: 'F5', duration: 0.6, velocity: 0.35 },
        { note: 'E5b', duration: 0.3, velocity: 0.25 },
        { note: 'D5', duration: 0.3, velocity: 0.3 },
        { note: 'E5b', duration: 0.4, velocity: 0.28 },
        { note: 'D5', duration: 0.4, velocity: 0.3 },
        { note: 'C5', duration: 0.8, velocity: 0.35, vibrato: true },
        { note: 'Bb4', duration: 0.4, velocity: 0.25 },
        { note: 'C5', duration: 0.6, velocity: 0.3 },
        { note: 'D5', duration: 1.4, velocity: 0.4, vibrato: true }
    ];
    
    const bassLine = [
        { note: 'D3', duration: 2.4 },
        { note: 'C3', duration: 2.4 },
        { note: 'Bb2', duration: 2.4 },
        { note: 'C3', duration: 2.4 },
        { note: 'D3', duration: 4.8 }
    ];
    
    const noteFrequencies = {
        'Bb2': 116.54, 'C3': 130.81, 'D3': 146.83, 'E3b': 155.56, 'F3': 174.61, 'G3': 196.00,
        'Bb3': 233.08, 'C4': 261.63, 'D4': 293.66, 'E4b': 311.13, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
        'Bb4': 466.16, 'C5': 523.25, 'D5': 587.33, 'E5b': 622.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
    };
    
    let time = musicContext.currentTime;
    let totalDuration = 0;
    
    melody.forEach(({ note, duration, velocity, vibrato }) => {
        const oscillator = musicContext.createOscillator();
        const gainNode = musicContext.createGain();
        const filterNode = musicContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        const freq = noteFrequencies[note];
        oscillator.frequency.value = freq;
        
        if (vibrato) {
            const lfo = musicContext.createOscillator();
            const lfoGain = musicContext.createGain();
            lfo.frequency.value = 5;
            lfoGain.gain.value = 8;
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            lfo.start(time);
            lfo.stop(time + duration);
        }
        
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 1800;
        filterNode.Q.value = 2;
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.03);
        gainNode.gain.linearRampToValueAtTime(velocity, time + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(musicGain);
        
        oscillator.start(time);
        oscillator.stop(time + duration);
        
        time += duration;
        totalDuration += duration;
    });
    
    let bassTime = musicContext.currentTime;
    bassLine.forEach(({ note, duration }) => {
        const oscillator = musicContext.createOscillator();
        const gainNode = musicContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = noteFrequencies[note];
        
        gainNode.gain.setValueAtTime(0, bassTime);
        gainNode.gain.linearRampToValueAtTime(0.15, bassTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, bassTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(musicGain);
        
        oscillator.start(bassTime);
        oscillator.stop(bassTime + duration);
        
        bassTime += duration;
    });
    
    if (isPlaying) {
        setTimeout(() => playMelody(), totalDuration * 1000);
    }
}

function toggleMusic() {
    const btn = document.getElementById('musicToggleBtn');
    
    if (!musicContext) {
        initBackgroundMusic();
    }
    
    if (musicContext && musicContext.state === 'suspended') {
        musicContext.resume();
    }
    
    isPlaying = !isPlaying;
    gameState.settings.music = isPlaying;
    
    if (isPlaying) {
        btn.classList.add('playing');
        btn.classList.remove('muted');
        playMelody();
        showNotification('🎵 Music ON', 'success');
    } else {
        btn.classList.remove('playing');
        btn.classList.add('muted');
        showNotification('🔇 Music OFF', 'info');
    }
    
    saveGameState();
}

function updateMusicButtonState() {
    const btn = document.getElementById('musicToggleBtn');
    if (!btn) return;
    
    if (gameState.settings.music) {
        btn.classList.add('playing');
        btn.classList.remove('muted');
    } else {
        btn.classList.remove('playing');
        btn.classList.add('muted');
    }
}

// ===== WALLET CONNECTION =====
async function connectWallet() {
    try {
        const btn = document.getElementById('connectWalletBtn');
        const status = document.getElementById('walletStatus');
        
        // Check if Telegram WebApp is available
        if (!window.Telegram?.WebApp) {
            showNotification('⚠️ Please open this in Telegram', 'error');
            return;
        }
        
        // Show loading state
        btn.innerHTML = '<span class="wallet-icon">⏳</span><span class="wallet-text">Connecting...</span>';
        btn.disabled = true;
        
        // Simulate wallet connection (In production, integrate with TON Connect or Telegram Wallet)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For demo: Generate a fake wallet address
        const fakeAddress = 'UQ' + Math.random().toString(36).substring(2, 15).toUpperCase();
        
        // Update game state
        gameState.walletConnected = true;
        gameState.walletAddress = fakeAddress;
        saveGameState();
        
        // Update UI
        btn.style.display = 'none';
        status.style.display = 'inline-flex';
        status.classList.add('connected');
        status.innerHTML = `
            <span class="status-icon">✅</span>
            <span class="status-text">Connected: ${fakeAddress.substring(0, 8)}...${fakeAddress.substring(fakeAddress.length - 6)}</span>
        `;
        
        showNotification('✅ Wallet connected successfully!', 'success');
        
        // Save to backend
        if (typeof saveToBackend === 'function') {
            await saveToBackend();
        }
        
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('❌ Failed to connect wallet', 'error');
        
        // Reset button
        const btn = document.getElementById('connectWalletBtn');
        btn.innerHTML = '<span class="wallet-icon">💼</span><span class="wallet-text">Connect your wallet</span>';
        btn.disabled = false;
    }
}

function checkWalletStatus() {
    const btn = document.getElementById('connectWalletBtn');
    const status = document.getElementById('walletStatus');
    
    if (gameState.walletConnected && gameState.walletAddress) {
        btn.style.display = 'none';
        status.style.display = 'inline-flex';
        status.classList.add('connected');
        status.innerHTML = `
            <span class="status-icon">✅</span>
            <span class="status-text">Connected: ${gameState.walletAddress.substring(0, 8)}...${gameState.walletAddress.substring(gameState.walletAddress.length - 6)}</span>
        `;
    }
}

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
    checkWalletStatus();
    
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
