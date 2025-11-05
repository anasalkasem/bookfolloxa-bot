// Bookfolloxa Game Logic
// Social Media Influencer Empire Game

// Game State
let gameState = {
    bflx: 1000,
    followers: 0,
    level: 1,
    xp: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 5,
    influencers: [],
    incomePerHour: 0,
    lastClaim: Date.now()
};

// Social Media Icons for floating effect
const socialIcons = ['❤️', '👍', '📱', '📸', '🎵', '▶️', '💬', '⭐', '🔥', '💯'];
const socialPlatforms = {
    twitter: '🐦',
    instagram: '📷',
    tiktok: '🎵',
    youtube: '▶️',
    facebook: '👥'
};

// Initialize Telegram WebApp
let tg = null;
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        // Set theme
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#0a0e27';
        console.log('Telegram WebApp initialized');
    } else {
        console.log('Telegram WebApp not available, running in standalone mode');
    }
}

// Initialize Game
function initGame() {
    console.log('Starting game initialization...');
    try {
        initTelegram();
        loadGameState();
        updateUI();
        startEnergyRegen();
        startPassiveIncome();
        createFloatingBackground();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            console.log('Hiding loading screen...');
            loadingScreen.style.display = 'none';
        } else {
            console.error('Loading screen element not found!');
        }
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error loading game. Please refresh.');
    }
}

// Load Game State (from localStorage or backend)
function loadGameState() {
    const saved = localStorage.getItem('bookfolloxa_game');
    if (saved) {
        gameState = JSON.parse(saved);
    }
}

// Save Game State
function saveGameState() {
    localStorage.setItem('bookfolloxa_game', JSON.stringify(gameState));
}

// Update UI
function updateUI() {
    document.getElementById('bflxBalance').textContent = formatNumber(gameState.bflx);
    document.getElementById('followersCount').textContent = formatNumber(gameState.followers);
    document.getElementById('userLevel').textContent = gameState.level;
    document.getElementById('currentEnergy').textContent = gameState.energy;
    document.getElementById('maxEnergy').textContent = gameState.maxEnergy;
    document.getElementById('tapPower').textContent = gameState.tapPower;
    document.getElementById('incomePerHour').textContent = formatNumber(gameState.incomePerHour);
    
    // Update energy bar
    const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
    document.getElementById('energyFill').style.width = energyPercent + '%';
}

// Format Numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
}

// Tap Function
function tap(event) {
    if (gameState.energy < 1) {
        showNotification('⚠️ Energy too low!', 'error');
        return;
    }
    
    // Prevent default touch behavior
    event.preventDefault();
    
    // Consume energy
    gameState.energy -= 1;
    
    // Calculate followers gained
    let followersGained = gameState.tapPower;
    
    // Critical hit chance (10%)
    const isCritical = Math.random() < 0.1;
    if (isCritical) {
        followersGained *= 10;
    }
    
    // Add followers
    gameState.followers += followersGained;
    
    // Convert followers to BFLX (100 followers = 1 BFLX)
    const bflxEarned = Math.floor(followersGained / 100);
    if (bflxEarned > 0) {
        gameState.bflx += bflxEarned;
    }
    
    // Add XP
    gameState.xp += 1;
    checkLevelUp();
    
    // Visual effects
    createTapEffect(event);
    createFloatingNumber(event, followersGained, isCritical);
    
    // Haptic feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
    
    // Update UI
    updateUI();
    saveGameState();
}

// Create Tap Effect
function createTapEffect(event) {
    const tapEffect = document.getElementById('tapEffect');
    tapEffect.classList.add('active');
    setTimeout(() => {
        tapEffect.classList.remove('active');
    }, 400);
    
    // Scale animation on character
    const character = document.getElementById('character');
    character.style.transform = 'scale(0.95)';
    setTimeout(() => {
        character.style.transform = 'scale(1)';
    }, 100);
}

// Create Floating Number with Social Icons
function createFloatingNumber(event, value, isCritical) {
    const container = document.getElementById('floatingNumbers');
    const floatNum = document.createElement('div');
    floatNum.className = 'float-number';
    
    // Random social icon
    const icon = socialIcons[Math.floor(Math.random() * socialIcons.length)];
    
    if (isCritical) {
        floatNum.textContent = `${icon} +${formatNumber(value)} 🔥`;
        floatNum.style.color = '#ff6b9d';
        floatNum.style.fontSize = '42px';
    } else {
        floatNum.textContent = `${icon} +${value}`;
        floatNum.style.color = '#00d9ff';
    }
    
    // Position
    const rect = document.getElementById('character').getBoundingClientRect();
    const x = (Math.random() - 0.5) * 200;
    const y = rect.top - 50;
    
    floatNum.style.left = (rect.left + rect.width / 2 + x) + 'px';
    floatNum.style.top = y + 'px';
    
    container.appendChild(floatNum);
    
    // Remove after animation
    setTimeout(() => {
        container.removeChild(floatNum);
    }, 1200);
}

// Create Floating Background Icons
function createFloatingBackground() {
    const container = document.querySelector('.game-container');
    const bgDiv = document.createElement('div');
    bgDiv.className = 'social-bg';
    
    const platforms = ['🐦', '📷', '🎵', '▶️', '👥', '💬', '❤️', '👍'];
    
    platforms.forEach((icon, index) => {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'social-icon-float';
        iconDiv.textContent = icon;
        iconDiv.style.left = (Math.random() * 80 + 10) + '%';
        iconDiv.style.top = (Math.random() * 80 + 10) + '%';
        iconDiv.style.animationDelay = (index * 0.5) + 's';
        bgDiv.appendChild(iconDiv);
    });
    
    container.insertBefore(bgDiv, container.firstChild);
}

// Energy Regeneration
function startEnergyRegen() {
    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.energy + 1, gameState.maxEnergy);
            updateUI();
        }
    }, 3000); // 1 energy every 3 seconds
}

// Passive Income
function startPassiveIncome() {
    setInterval(() => {
        if (gameState.incomePerHour > 0) {
            const earnedPerSecond = gameState.incomePerHour / 3600;
            gameState.bflx += earnedPerSecond;
            updateUI();
        }
    }, 1000);
}

// Check Level Up
function checkLevelUp() {
    const xpNeeded = gameState.level * 100;
    if (gameState.xp >= xpNeeded) {
        gameState.level++;
        gameState.xp = 0;
        showNotification(`🎉 Level Up! You are now level ${gameState.level}`, 'success');
        
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff6b9d' : '#10b981'};
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Toggle Menu
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Show Screen
function showScreen(screen) {
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Close menu if open
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    menu.classList.remove('active');
    overlay.classList.remove('active');
    
    // Handle different screens
    switch(screen) {
        case 'home':
            // Already on home
            document.querySelector('.nav-btn').classList.add('active');
            break;
        case 'influencers':
            showInfluencersModal();
            document.querySelectorAll('.nav-btn')[1].classList.add('active');
            break;
        case 'campaigns':
            showCampaignsModal();
            document.querySelectorAll('.nav-btn')[2].classList.add('active');
            break;
        case 'tasks':
            showTasksModal();
            document.querySelectorAll('.nav-btn')[3].classList.add('active');
            break;
        default:
            showNotification('Coming soon! 🚧', 'info');
    }
}

// Show Influencers Modal
function showInfluencersModal() {
    const modal = document.getElementById('influencersModal');
    modal.classList.add('active');
    
    // Populate influencers list
    const list = document.getElementById('influencerList');
    list.innerHTML = '';
    
    const influencers = [
        { id: 'nano', name: 'Nano Influencer', icon: '🌱', cost: 1000, income: 10, platforms: ['Twitter'] },
        { id: 'micro', name: 'Micro Influencer', icon: '🌟', cost: 10000, income: 150, platforms: ['Twitter', 'Instagram'] },
        { id: 'mid', name: 'Mid-tier Influencer', icon: '⭐', cost: 100000, income: 2000, platforms: ['Twitter', 'Instagram', 'YouTube'] },
        { id: 'macro', name: 'Macro Influencer', icon: '💫', cost: 1000000, income: 30000, platforms: ['All Platforms'] },
        { id: 'mega', name: 'Mega Influencer', icon: '✨', cost: 10000000, income: 500000, platforms: ['All Platforms'] }
    ];
    
    influencers.forEach(inf => {
        const card = document.createElement('div');
        card.className = 'influencer-card';
        card.innerHTML = `
            <div class="influencer-info">
                <div class="influencer-icon">${inf.icon}</div>
                <div class="influencer-details">
                    <h3>${inf.name}</h3>
                    <p>💰 ${formatNumber(inf.income)} BFLX/hour</p>
                    <p>📱 ${inf.platforms.join(', ')}</p>
                </div>
            </div>
            <div class="influencer-cost">
                <div class="cost-value">${formatNumber(inf.cost)}</div>
                <button class="hire-btn" onclick="hireInfluencer('${inf.id}', ${inf.cost}, ${inf.income})" ${gameState.bflx < inf.cost ? 'disabled' : ''}>
                    ${gameState.bflx < inf.cost ? '❌ Not enough' : '✅ Hire'}
                </button>
            </div>
        `;
        list.appendChild(card);
    });
}

// Hire Influencer
function hireInfluencer(id, cost, income) {
    if (gameState.bflx < cost) {
        showNotification('⚠️ Not enough BFLX!', 'error');
        return;
    }
    
    gameState.bflx -= cost;
    gameState.incomePerHour += income;
    gameState.influencers.push({ id, income });
    
    showNotification(`🎉 Influencer hired! +${formatNumber(income)} BFLX/hour`, 'success');
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    updateUI();
    saveGameState();
    showInfluencersModal(); // Refresh list
}

// Show Campaigns Modal
function showCampaignsModal() {
    const modal = document.getElementById('campaignsModal');
    modal.classList.add('active');
    
    const list = document.getElementById('campaignsList');
    list.innerHTML = '<p style="text-align: center; color: #a0aec0;">Coming soon! 🚧</p>';
}

// Show Tasks Modal
function showTasksModal() {
    const modal = document.getElementById('tasksModal');
    modal.classList.add('active');
    showTasks('daily');
}

// Show Tasks by Type
function showTasks(type) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const list = document.getElementById('tasksList');
    list.innerHTML = '';
    
    let tasks = [];
    
    if (type === 'daily') {
        tasks = [
            { name: 'Tap 100 times', reward: 500, icon: '👆' },
            { name: 'Invite 1 friend', reward: 1000, icon: '👥' },
            { name: 'Claim passive income', reward: 200, icon: '💰' }
        ];
    } else if (type === 'social') {
        tasks = [
            { name: 'Follow on Twitter', reward: 50, icon: '🐦' },
            { name: 'Like Instagram post', reward: 25, icon: '❤️' },
            { name: 'Subscribe on YouTube', reward: 100, icon: '▶️' }
        ];
    } else {
        tasks = [
            { name: 'Reach level 10', reward: 5000, icon: '⭐' },
            { name: 'Hire 5 influencers', reward: 10000, icon: '👥' },
            { name: 'Earn 1M followers', reward: 50000, icon: '🏆' }
        ];
    }
    
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-info">
                <h3>${task.icon} ${task.name}</h3>
                <p>Complete this task to earn rewards</p>
            </div>
            <div class="task-reward">
                <div class="reward-value">+${formatNumber(task.reward)}</div>
                <button class="task-btn" onclick="completeTask(${task.reward})">Start</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// Complete Task
function completeTask(reward) {
    gameState.bflx += reward;
    showNotification(`✅ Task completed! +${formatNumber(reward)} BFLX`, 'success');
    updateUI();
    saveGameState();
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Initialize on load
window.addEventListener('load', initGame);

// Save game state periodically
setInterval(saveGameState, 10000); // Every 10 seconds
