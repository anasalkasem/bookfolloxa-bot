// ===== BACKEND API INTEGRATION =====

const API_BASE = window.location.origin;

// Get Telegram user ID
function getTelegramUserId() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    return null;
}

// Get Telegram initData for authentication
function getTelegramInitData() {
    if (window.Telegram?.WebApp?.initData) {
        return window.Telegram.WebApp.initData;
    }
    return null;
}

// Load user data from backend
async function loadUserFromBackend() {
    const userId = getTelegramUserId();
    const initData = getTelegramInitData();
    
    if (!userId || !initData) {
        console.log('⚠️ No Telegram auth data, using local storage');
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/user/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': initData
            },
            body: JSON.stringify({
                _auth: initData
            })
        });
        
        if (!response.ok) {
            console.log('User not found in backend, will create on first sync');
            return null;
        }
        
        const userData = await response.json();
        console.log('✅ User data loaded from backend:', userData);
        return userData;
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        return null;
    }
}

// Sync user data to backend
async function syncUserToBackend(gameState) {
    const userId = getTelegramUserId();
    const initData = getTelegramInitData();
    
    if (!userId || !initData) {
        console.log('⚠️ No Telegram auth data, skipping backend sync');
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/user/${userId}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': initData
            },
            body: JSON.stringify({
                _auth: initData,
                balance: gameState.bflx,
                followers: gameState.followers,
                energy: gameState.energy,
                level: gameState.level,
                total_earned: gameState.bflx
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Failed to sync user data:', error);
            return false;
        }
        
        console.log('✅ User data synced to backend');
        return true;
    } catch (error) {
        console.error('❌ Error syncing user data:', error);
        return false;
    }
}

// Load real leaderboard
async function loadRealLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/leaderboard`);
        if (!response.ok) {
            console.error('❌ Failed to load leaderboard');
            return null;
        }
        
        const data = await response.json();
        console.log('✅ Leaderboard loaded:', data.leaderboard.length, 'players');
        return data.leaderboard;
    } catch (error) {
        console.error('❌ Error loading leaderboard:', error);
        return null;
    }
}

// Auto-sync every 30 seconds
let syncInterval = null;

function startAutoSync(gameState) {
    // Sync immediately on start
    syncUserToBackend(gameState);
    
    // Then sync every 30 seconds
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        syncUserToBackend(gameState);
    }, 30000);
    
    console.log('🔄 Auto-sync started (every 30 seconds)');
}

function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('⏹️ Auto-sync stopped');
    }
}

// Initialize backend integration
async function initBackendIntegration(gameState) {
    console.log('🚀 Initializing backend integration...');
    
    const backendData = await loadUserFromBackend();
    if (backendData) {
        // Merge backend data with local state (backend is source of truth)
        gameState.bflx = backendData.balance || gameState.bflx;
        gameState.followers = backendData.followers || gameState.followers;
        gameState.energy = backendData.energy || gameState.energy;
        gameState.maxEnergy = backendData.max_energy || gameState.maxEnergy;
        gameState.tapPower = backendData.tap_power || gameState.tapPower;
        gameState.miningPerHour = backendData.mining_per_hour || gameState.miningPerHour;
        gameState.level = backendData.level || gameState.level;
        
        console.log('✅ Backend data merged with local state');
    }
    
    // Start auto-sync
    startAutoSync(gameState);
}
