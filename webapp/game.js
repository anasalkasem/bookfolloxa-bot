// ===== GAME STATE =====
const gameState = {
    bflx: 1000,
    followers: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 5,
    incomePerHour: 0,
    level: 1,
    influencers: [],
    tasks: []
};

// ===== CONSTANTS =====
const ENERGY_REGEN_RATE = 1; // 1 energy per 3 seconds
const ENERGY_REGEN_INTERVAL = 3000;
const INCOME_UPDATE_INTERVAL = 1000;
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
    achievements: [
        { id: 'a1', title: 'First Million', reward: 10000, target: 1000000, completed: false },
        { id: 'a2', title: 'Tap Master', reward: 20000, target: 10000, progress: 0, completed: false },
        { id: 'a3', title: 'Influencer Empire', reward: 50000, target: 10, progress: 0, completed: false }
    ]
};

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupEventListeners();
    startGameLoops();
    loadGameState();
});

function initGame() {
    updateUI();
    console.log('🎮 Bookfolloxa Game Initialized!');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Tap Button
    const tapButton = document.getElementById('tapButton');
    tapButton.addEventListener('click', handleTap);
    tapButton.addEventListener('touchstart', handleTap);
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => handleNavigation(item));
    });
    
    // Modal Close Buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });
    
    // Modal Overlays
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => closeModal(overlay.closest('.modal')));
    });
}

// ===== TAP HANDLER =====
function handleTap(e) {
    e.preventDefault();
    
    if (gameState.energy < gameState.tapPower) {
        showNotification('⚡ Not enough energy!', 'error');
        return;
    }
    
    // Update game state
    gameState.bflx += gameState.tapPower;
    gameState.followers += gameState.tapPower;
    gameState.energy -= gameState.tapPower;
    
    // Visual effects
    createFloatingNumber(gameState.tapPower, e);
    createParticles(e);
    animateTapButton();
    
    // Update UI
    updateUI();
    
    // Update tasks
    updateTaskProgress('d2', 1);
    updateTaskProgress('a2', 1);
}

// ===== VISUAL EFFECTS =====
function createFloatingNumber(value, event) {
    const container = document.getElementById('floatingNumbers');
    const floatNum = document.createElement('div');
    floatNum.className = 'float-number';
    floatNum.textContent = `+${formatNumber(value)}`;
    
    // Position
    const rect = event.target.getBoundingClientRect();
    const x = (event.clientX || event.touches[0].clientX) - rect.left;
    const y = (event.clientY || event.touches[0].clientY) - rect.top;
    
    floatNum.style.left = `${x}px`;
    floatNum.style.top = `${y}px`;
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
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'float-number';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.fontSize = '30px';
        
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angle = (Math.PI * 2 * i) / 5;
        const distance = 50;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}

function animateTapButton() {
    const button = document.getElementById('tapButton');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
}

// ===== NAVIGATION =====
function handleNavigation(navItem) {
    const page = navItem.dataset.page;
    
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    navItem.classList.add('active');
    
    // Handle page
    switch(page) {
        case 'home':
            closeAllModals();
            break;
        case 'influencers':
            openInfluencersModal();
            break;
        case 'campaigns':
            showNotification('📋 Campaigns coming soon!', 'info');
            break;
        case 'tasks':
            openTasksModal();
            break;
        case 'more':
            showNotification('⋯ More features coming soon!', 'info');
            break;
    }
}

// ===== INFLUENCERS MODAL =====
function openInfluencersModal() {
    const modal = document.getElementById('influencersModal');
    const list = document.getElementById('influencerList');
    
    list.innerHTML = influencerTypes.map(inf => `
        <div class="influencer-card ${gameState.bflx >= inf.cost && gameState.level >= inf.level ? '' : 'locked'}">
            <div class="influencer-icon">${inf.icon}</div>
            <div class="influencer-info">
                <div class="influencer-name">${inf.name}</div>
                <div class="influencer-income">💰 ${formatNumber(inf.income)}/hour</div>
            </div>
            <button class="influencer-hire-btn" onclick="hireInfluencer(${inf.id})" 
                    ${gameState.bflx >= inf.cost && gameState.level >= inf.level ? '' : 'disabled'}>
                <span class="cost">💎 ${formatNumber(inf.cost)}</span>
            </button>
        </div>
    `).join('');
    
    modal.classList.add('active');
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
    gameState.incomePerHour += influencer.income;
    
    showNotification(`✅ Hired ${influencer.name}!`, 'success');
    updateUI();
    openInfluencersModal(); // Refresh
    
    updateTaskProgress('d3', 1);
    updateTaskProgress('a3', 1);
}

// ===== TASKS MODAL =====
function openTasksModal() {
    const modal = document.getElementById('tasksModal');
    const list = document.getElementById('tasksList');
    
    // Tabs
    const tabs = modal.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTasks(tab.dataset.tab, list);
        });
    });
    
    renderTasks('daily', list);
    modal.classList.add('active');
}

function renderTasks(category, container) {
    const tasks = tasksData[category];
    
    container.innerHTML = tasks.map(task => `
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

// ===== MODALS =====
function closeModal(modal) {
    modal.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
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
    
    // Income
    setInterval(() => {
        if (gameState.incomePerHour > 0) {
            const incomePerSecond = gameState.incomePerHour / 3600;
            gameState.bflx += incomePerSecond;
            gameState.followers += incomePerSecond;
            updateUI();
        }
    }, INCOME_UPDATE_INTERVAL);
    
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
    
    // Tap power
    document.getElementById('tapPower').textContent = gameState.tapPower;
    
    // Income
    document.getElementById('incomePerHour').textContent = formatNumber(gameState.incomePerHour);
    
    // Energy
    const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
    document.getElementById('energyFill').style.width = `${energyPercent}%`;
    document.getElementById('currentEnergy').textContent = Math.floor(gameState.energy);
    document.getElementById('maxEnergy').textContent = gameState.maxEnergy;
    
    // Check achievements
    checkAchievements();
}

function checkAchievements() {
    const millionTask = tasksData.achievements.find(t => t.id === 'a1');
    if (millionTask && !millionTask.completed && gameState.bflx >= millionTask.target) {
        completeTask(millionTask);
    }
}

// ===== UTILITIES =====
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function showNotification(message, type = 'info') {
    // Create notification element
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
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== SAVE/LOAD =====
function saveGameState() {
    localStorage.setItem('bookfolloxa_game', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('bookfolloxa_game');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
        updateUI();
        console.log('💾 Game loaded!');
    }
}

// ===== TELEGRAM WEB APP =====
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Get user data
    const user = tg.initDataUnsafe.user;
    if (user) {
        document.querySelector('.username').textContent = user.first_name || 'Player';
    }
}

// ===== CSS ANIMATIONS =====
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
    
    .influencer-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        padding: 16px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 12px;
        transition: all 0.3s ease;
    }
    
    .influencer-card:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-2px);
    }
    
    .influencer-card.locked {
        opacity: 0.5;
    }
    
    .influencer-icon {
        font-size: 48px;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #00d9ff, #7c3aed);
        border-radius: 12px;
    }
    
    .influencer-info {
        flex: 1;
    }
    
    .influencer-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;
    }
    
    .influencer-income {
        font-size: 14px;
        color: #a0aec0;
    }
    
    .influencer-hire-btn {
        background: linear-gradient(135deg, #00d9ff, #7c3aed);
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .influencer-hire-btn:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 10px 20px rgba(0, 217, 255, 0.3);
    }
    
    .influencer-hire-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .task-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        padding: 16px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 12px;
    }
    
    .task-card.completed {
        opacity: 0.6;
    }
    
    .task-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;
    }
    
    .task-progress {
        font-size: 14px;
        color: #a0aec0;
    }
    
    .task-reward {
        font-size: 18px;
        font-weight: bold;
        background: linear-gradient(135deg, #00d9ff, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .tasks-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
    }
    
    .tab-btn {
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #a0aec0;
        padding: 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .tab-btn.active {
        background: linear-gradient(135deg, #00d9ff, #7c3aed);
        color: white;
        border-color: transparent;
    }
    
    .influencer-grid {
        display: flex;
        flex-direction: column;
    }
`;
document.head.appendChild(style);
