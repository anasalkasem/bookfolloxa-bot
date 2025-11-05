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
    lastClaim: Date.now(),
    lastDailyReward: 0,
    dailyStreak: 0
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
        const loaded = JSON.parse(saved);
        // Merge loaded state with defaults for new fields only
        gameState = {
            ...gameState,
            ...loaded,
            // Add defaults only for newly added fields that may not exist in old saves
            lastDailyReward: loaded.lastDailyReward ?? 0,
            dailyStreak: loaded.dailyStreak ?? 0
        };
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

// Create Particle Burst
function createParticleBurst(x, y, count = 10) {
    const container = document.querySelector('.game-container');
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = ['⭐', '💫', '✨', '💎', '🎯'][Math.floor(Math.random() * 5)];
        
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 100 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.setProperty('--vx', vx + 'px');
        particle.style.setProperty('--vy', vy + 'px');
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (container.contains(particle)) {
                container.removeChild(particle);
            }
        }, 1000);
    }
}

// Show Level Up Animation
function showLevelUpAnimation() {
    const levelUpDiv = document.createElement('div');
    levelUpDiv.className = 'level-up-animation';
    levelUpDiv.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">🎉</div>
            <div class="level-up-text">LEVEL UP!</div>
            <div class="level-up-number">Level ${gameState.level}</div>
        </div>
    `;
    
    document.body.appendChild(levelUpDiv);
    
    // Create particle burst
    const rect = levelUpDiv.getBoundingClientRect();
    createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
    
    // Haptic feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    setTimeout(() => {
        levelUpDiv.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(levelUpDiv)) {
                document.body.removeChild(levelUpDiv);
            }
        }, 500);
    }, 2000);
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
        showLevelUpAnimation();
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
        case 'more':
            showMoreModal();
            document.querySelectorAll('.nav-btn')[4].classList.add('active');
            break;
        case 'leaderboard':
            showLeaderboardModal();
            break;
        case 'wallet':
            showWalletModal();
            break;
        case 'settings':
            showSettingsModal();
            break;
        case 'upgrade':
            showUpgradeModal();
            break;
        case 'invite':
            showInviteModal();
            break;
        case 'daily-rewards':
            showDailyRewardsModal();
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
    list.innerHTML = '';
    
    const campaigns = [
        { 
            id: 'twitter_promo',
            name: 'Twitter Promotion',
            icon: '🐦',
            description: 'Promote your content on Twitter',
            duration: '2 hours',
            reward: 2000,
            cost: 500,
            followers: 1000
        },
        { 
            id: 'instagram_story',
            name: 'Instagram Story',
            icon: '📷',
            description: 'Share an Instagram story',
            duration: '4 hours',
            reward: 5000,
            cost: 1500,
            followers: 3000
        },
        { 
            id: 'youtube_video',
            name: 'YouTube Video',
            icon: '▶️',
            description: 'Create a YouTube video',
            duration: '8 hours',
            reward: 15000,
            cost: 5000,
            followers: 10000
        },
        { 
            id: 'tiktok_trend',
            name: 'TikTok Trend',
            icon: '🎵',
            description: 'Join a trending TikTok challenge',
            duration: '6 hours',
            reward: 10000,
            cost: 3000,
            followers: 5000
        },
        { 
            id: 'facebook_live',
            name: 'Facebook Live',
            icon: '👥',
            description: 'Host a Facebook Live session',
            duration: '12 hours',
            reward: 25000,
            cost: 10000,
            followers: 20000
        }
    ];
    
    campaigns.forEach(campaign => {
        const card = document.createElement('div');
        card.className = 'campaign-card';
        
        const canAfford = gameState.bflx >= campaign.cost;
        
        card.innerHTML = `
            <div class="campaign-info">
                <div class="campaign-icon">${campaign.icon}</div>
                <div class="campaign-details">
                    <h3>${campaign.name}</h3>
                    <p>${campaign.description}</p>
                    <div class="campaign-stats">
                        <span>⏱️ ${campaign.duration}</span>
                        <span>👥 +${formatNumber(campaign.followers)} followers</span>
                    </div>
                </div>
            </div>
            <div class="campaign-action">
                <div class="campaign-cost">
                    <div class="cost-label">Cost:</div>
                    <div class="cost-value">${formatNumber(campaign.cost)} BFLX</div>
                </div>
                <div class="campaign-reward">
                    <div class="reward-label">Reward:</div>
                    <div class="reward-value">+${formatNumber(campaign.reward)} BFLX</div>
                </div>
                <button class="launch-btn" onclick="launchCampaign('${campaign.id}', ${campaign.cost}, ${campaign.reward}, ${campaign.followers})" ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? '🚀 Launch' : '❌ Not enough'}
                </button>
            </div>
        `;
        
        list.appendChild(card);
    });
}

// Launch Campaign
function launchCampaign(id, cost, reward, followers) {
    if (gameState.bflx < cost) {
        showNotification('⚠️ Not enough BFLX!', 'error');
        return;
    }
    
    gameState.bflx -= cost;
    gameState.bflx += reward;
    gameState.followers += followers;
    gameState.xp += Math.floor(reward / 100);
    
    checkLevelUp();
    
    showNotification(`🎉 Campaign launched! +${formatNumber(reward)} BFLX, +${formatNumber(followers)} followers`, 'success');
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    updateUI();
    saveGameState();
    showCampaignsModal();
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
        
        // Create task info section
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        
        const taskTitle = document.createElement('h3');
        taskTitle.textContent = `${task.icon} ${task.name}`;
        taskInfo.appendChild(taskTitle);
        
        const taskDesc = document.createElement('p');
        taskDesc.textContent = 'Complete this task to earn rewards';
        taskInfo.appendChild(taskDesc);
        
        // Create task reward section
        const taskReward = document.createElement('div');
        taskReward.className = 'task-reward';
        
        const rewardValue = document.createElement('div');
        rewardValue.className = 'reward-value';
        rewardValue.textContent = `+${formatNumber(task.reward)}`;
        taskReward.appendChild(rewardValue);
        
        const taskBtn = document.createElement('button');
        taskBtn.className = 'task-btn';
        taskBtn.textContent = 'Start';
        taskBtn.addEventListener('click', () => completeTask(task.reward));
        taskReward.appendChild(taskBtn);
        
        // Assemble the card
        card.appendChild(taskInfo);
        card.appendChild(taskReward);
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

// Show Leaderboard Modal
function showLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    modal.classList.add('active');
    
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    
    const topPlayers = [
        { rank: 1, name: 'Player1', bflx: 10000000, followers: 5000000, icon: '👑' },
        { rank: 2, name: 'Player2', bflx: 8500000, followers: 4200000, icon: '🥈' },
        { rank: 3, name: 'Player3', bflx: 7000000, followers: 3500000, icon: '🥉' },
        { rank: 4, name: 'Player4', bflx: 5500000, followers: 2800000, icon: '⭐' },
        { rank: 5, name: 'Player5', bflx: 4000000, followers: 2000000, icon: '⭐' },
        { rank: 6, name: 'You', bflx: gameState.bflx, followers: gameState.followers, icon: '👤' }
    ];
    
    topPlayers.forEach(player => {
        const card = document.createElement('div');
        card.className = 'leaderboard-item';
        if (player.name === 'You') card.classList.add('current-user');
        
        card.innerHTML = `
            <div class="rank">${player.icon} #${player.rank}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-stats">
                    <span>💰 ${formatNumber(player.bflx)} BFLX</span>
                    <span>👥 ${formatNumber(player.followers)} followers</span>
                </div>
            </div>
        `;
        
        list.appendChild(card);
    });
}

// Show More Modal
function showMoreModal() {
    const modal = document.getElementById('moreModal');
    modal.classList.add('active');
    
    const list = document.getElementById('moreList');
    list.innerHTML = `
        <div class="more-menu">
            <button class="more-item" onclick="showBoostersModal()">
                <span class="more-icon">🚀</span>
                <div class="more-details">
                    <h3>Boosters</h3>
                    <p>Temporary power-ups</p>
                </div>
            </button>
            <button class="more-item" onclick="showAchievementsModal()">
                <span class="more-icon">🏅</span>
                <div class="more-details">
                    <h3>Achievements</h3>
                    <p>View your achievements</p>
                </div>
            </button>
            <button class="more-item" onclick="showStatsModal()">
                <span class="more-icon">📊</span>
                <div class="more-details">
                    <h3>Statistics</h3>
                    <p>View game statistics</p>
                </div>
            </button>
            <button class="more-item" onclick="showShopModal()">
                <span class="more-icon">🛒</span>
                <div class="more-details">
                    <h3>Shop</h3>
                    <p>Buy premium items</p>
                </div>
            </button>
        </div>
    `;
}

// Placeholder modals for More items
function showBoostersModal() {
    showNotification('Boosters coming soon! 🚀', 'info');
}

function showAchievementsModal() {
    showNotification('Achievements coming soon! 🏅', 'info');
}

function showStatsModal() {
    const stats = `
📊 Your Statistics:
━━━━━━━━━━━━━━━
💰 Total BFLX: ${formatNumber(gameState.bflx)}
👥 Total Followers: ${formatNumber(gameState.followers)}
⭐ Level: ${gameState.level}
✨ XP: ${formatNumber(gameState.xp)}
👥 Influencers: ${gameState.influencers.length}
💸 Income/hour: ${formatNumber(gameState.incomePerHour)}
    `;
    showNotification(stats, 'info');
}

function showShopModal() {
    showNotification('Shop coming soon! 🛒', 'info');
}

// Show Wallet Modal
function showWalletModal() {
    const modal = document.getElementById('walletModal');
    modal.classList.add('active');
    
    const content = document.getElementById('walletContent');
    content.innerHTML = `
        <div class="wallet-container">
            <div class="wallet-balance">
                <h3>💰 Your Balance</h3>
                <div class="balance-amount">${formatNumber(gameState.bflx)} BFLX</div>
                <div class="balance-usd">≈ $${(gameState.bflx * 0.001).toFixed(2)} USD</div>
            </div>
            
            <div class="wallet-actions">
                <button class="wallet-btn deposit-btn" onclick="showNotification('Deposit coming soon! 💳', 'info')">
                    <span>💳</span> Deposit
                </button>
                <button class="wallet-btn withdraw-btn" onclick="showNotification('Withdraw coming soon! 💸', 'info')">
                    <span>💸</span> Withdraw
                </button>
            </div>
            
            <div class="wallet-info">
                <h3>ℹ️ Wallet Information</h3>
                <p>Your BFLX tokens are stored securely in your account. You can deposit or withdraw them to/from blockchain wallets in the future.</p>
                <p style="margin-top: 10px; color: var(--accent-cyan);">🔜 Blockchain integration coming soon!</p>
            </div>
        </div>
    `;
}

// Show Settings Modal
function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('active');
    
    const content = document.getElementById('settingsContent');
    content.innerHTML = `
        <div class="settings-container">
            <div class="settings-section">
                <h3>🔔 Notifications</h3>
                <div class="setting-item">
                    <span>Push Notifications</span>
                    <label class="toggle">
                        <input type="checkbox" checked onchange="toggleSetting('notifications')">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span>Sound Effects</span>
                    <label class="toggle">
                        <input type="checkbox" checked onchange="toggleSetting('sound')">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>🎨 Appearance</h3>
                <div class="setting-item">
                    <span>Haptic Feedback</span>
                    <label class="toggle">
                        <input type="checkbox" checked onchange="toggleSetting('haptic')">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>📱 Account</h3>
                <button class="settings-btn" onclick="showNotification('Language settings coming soon! 🌐', 'info')">
                    🌐 Language
                </button>
                <button class="settings-btn danger" onclick="if(confirm('Reset all game data?')) { localStorage.clear(); location.reload(); }">
                    🔄 Reset Game Data
                </button>
            </div>
            
            <div class="settings-footer">
                <p>Version 1.0.0 Beta</p>
                <p>Made with ❤️ by Replit Agent</p>
            </div>
        </div>
    `;
}

function toggleSetting(setting) {
    showNotification(`${setting} setting toggled!`, 'info');
}

// Show Upgrade Modal
function showUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    modal.classList.add('active');
    
    const content = document.getElementById('upgradeContent');
    content.innerHTML = `
        <div class="upgrade-container">
            <div class="upgrade-stats">
                <h3>💰 Balance: ${formatNumber(gameState.bflx)} BFLX</h3>
            </div>
            
            <div class="upgrade-list">
                <div class="upgrade-card">
                    <div class="upgrade-info">
                        <div class="upgrade-icon">🔨</div>
                        <div>
                            <h3>Tap Power</h3>
                            <p>Increase BFLX per tap</p>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="upgradeFeature('tapPower')">
                        💎 Upgrade
                    </button>
                </div>
                
                <div class="upgrade-card">
                    <div class="upgrade-info">
                        <div class="upgrade-icon">⚡</div>
                        <div>
                            <h3>Energy Capacity</h3>
                            <p>Increase max energy</p>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="upgradeFeature('energyCapacity')">
                        💎 Upgrade
                    </button>
                </div>
                
                <div class="upgrade-card">
                    <div class="upgrade-info">
                        <div class="upgrade-icon">⏱️</div>
                        <div>
                            <h3>Energy Regen</h3>
                            <p>Faster energy recovery</p>
                        </div>
                    </div>
                    <button class="upgrade-btn" onclick="upgradeFeature('energyRegen')">
                        💎 Upgrade
                    </button>
                </div>
            </div>
        </div>
    `;
}

function upgradeFeature(feature) {
    const costs = {
        tapPower: 1000,
        energyCapacity: 2000,
        energyRegen: 1500
    };
    
    const cost = costs[feature];
    
    if (gameState.bflx >= cost) {
        gameState.bflx -= cost;
        
        if (feature === 'tapPower') gameState.tapPower += 1;
        if (feature === 'energyCapacity') gameState.maxEnergy += 100;
        
        showNotification(`✅ ${feature} upgraded!`, 'success');
        updateUI();
        saveGameState();
        showUpgradeModal();
    } else {
        showNotification('⚠️ Not enough BFLX!', 'error');
    }
}

// Show Daily Rewards Modal
function showDailyRewardsModal() {
    const modal = document.getElementById('dailyRewardsModal');
    modal.classList.add('active');
    
    const content = document.getElementById('dailyRewardsContent');
    
    const now = Date.now();
    const lastReward = gameState.lastDailyReward || 0;
    const timeSinceLastReward = now - lastReward;
    const oneDay = 24 * 60 * 60 * 1000;
    
    const canClaim = timeSinceLastReward >= oneDay || lastReward === 0;
    const streak = gameState.dailyStreak || 0;
    
    const dailyRewards = [
        { day: 1, reward: 500, icon: '🎁' },
        { day: 2, reward: 1000, icon: '🎁' },
        { day: 3, reward: 2000, icon: '🎁' },
        { day: 4, reward: 5000, icon: '🎁' },
        { day: 5, reward: 10000, icon: '💎' },
        { day: 6, reward: 20000, icon: '💎' },
        { day: 7, reward: 50000, icon: '🏆' }
    ];
    
    let rewardsHTML = '<div class="daily-rewards-container">';
    rewardsHTML += '<div class="daily-rewards-header">';
    rewardsHTML += `<h3>🔥 Current Streak: ${streak} days</h3>`;
    rewardsHTML += '<p>Login daily to earn increasing rewards!</p>';
    rewardsHTML += '</div>';
    
    rewardsHTML += '<div class="daily-rewards-grid">';
    dailyRewards.forEach((reward, index) => {
        const day = index + 1;
        const isClaimed = streak >= day;
        const isToday = streak + 1 === day && canClaim;
        
        rewardsHTML += `
            <div class="daily-reward-card ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
                <div class="reward-day">Day ${reward.day}</div>
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-amount">${formatNumber(reward.reward)} BFLX</div>
                ${isClaimed ? '<div class="claimed-badge">✅ Claimed</div>' : ''}
                ${isToday ? '<div class="today-badge">🎁 Today</div>' : ''}
            </div>
        `;
    });
    rewardsHTML += '</div>';
    
    if (canClaim) {
        const nextReward = dailyRewards[Math.min(streak, 6)];
        rewardsHTML += `
            <button class="claim-daily-btn" onclick="claimDailyReward()">
                🎁 Claim ${formatNumber(nextReward.reward)} BFLX
            </button>
        `;
    } else {
        const timeLeft = oneDay - timeSinceLastReward;
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        rewardsHTML += `
            <div class="next-reward-timer">
                ⏰ Next reward in: ${hoursLeft}h ${minutesLeft}m
            </div>
        `;
    }
    
    rewardsHTML += '</div>';
    content.innerHTML = rewardsHTML;
}

// Claim Daily Reward
function claimDailyReward() {
    const now = Date.now();
    const lastReward = gameState.lastDailyReward || 0;
    const timeSinceLastReward = now - lastReward;
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 48 * 60 * 60 * 1000;
    
    if (timeSinceLastReward < oneDay && lastReward !== 0) {
        showNotification('⚠️ Already claimed today!', 'error');
        return;
    }
    
    // Check if streak continues or resets
    if (timeSinceLastReward > twoDays && lastReward !== 0) {
        gameState.dailyStreak = 0;
    }
    
    const streak = gameState.dailyStreak || 0;
    const nextStreak = Math.min(streak + 1, 7);
    
    const dailyRewards = [500, 1000, 2000, 5000, 10000, 20000, 50000];
    const reward = dailyRewards[Math.min(streak, 6)];
    
    gameState.bflx += reward;
    gameState.lastDailyReward = now;
    gameState.dailyStreak = nextStreak;
    
    showNotification(`🎉 Daily reward claimed! +${formatNumber(reward)} BFLX`, 'success');
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    updateUI();
    saveGameState();
    showDailyRewardsModal();
}

// Show Invite Modal
function showInviteModal() {
    const modal = document.getElementById('inviteModal');
    modal.classList.add('active');
    
    const content = document.getElementById('inviteContent');
    const referralLink = 'https://t.me/YourBot?start=invite';
    
    content.innerHTML = `
        <div class="invite-container">
            <div class="invite-header">
                <h3>👥 Invite Friends & Earn!</h3>
                <p>Get rewards for each friend you invite</p>
            </div>
            
            <div class="invite-rewards">
                <div class="reward-card">
                    <span class="reward-icon">🎁</span>
                    <div>
                        <h4>500 BFLX</h4>
                        <p>Per friend</p>
                    </div>
                </div>
                <div class="reward-card">
                    <span class="reward-icon">💰</span>
                    <div>
                        <h4>10%</h4>
                        <p>From their earnings</p>
                    </div>
                </div>
            </div>
            
            <div class="invite-link">
                <input type="text" value="${referralLink}" readonly id="referralInput">
                <button class="copy-btn" onclick="copyReferralLink()">📋 Copy</button>
            </div>
            
            <button class="share-btn" onclick="shareReferralLink()">
                📤 Share Link
            </button>
            
            <div class="invite-stats">
                <div class="stat">
                    <div class="stat-value">0</div>
                    <div class="stat-label">Friends Invited</div>
                </div>
                <div class="stat">
                    <div class="stat-value">0 BFLX</div>
                    <div class="stat-label">Earned from Referrals</div>
                </div>
            </div>
        </div>
    `;
}

function copyReferralLink() {
    const input = document.getElementById('referralInput');
    input.select();
    document.execCommand('copy');
    showNotification('✅ Link copied!', 'success');
}

function shareReferralLink() {
    if (tg && tg.shareURL) {
        tg.shareURL('https://t.me/YourBot?start=invite');
    } else {
        showNotification('Share via Telegram app!', 'info');
    }
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
