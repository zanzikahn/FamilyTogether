/**
 * API Client Service for FamilyTogether SPA
 * Communicates with Railway-deployed ASP.NET Core API
 *
 * Base URL: https://charming-magic-production.up.railway.app
 * Authentication: Bearer token (JWT from Supabase)
 */

// API Configuration
const API_CONFIG = {
    production: 'https://charming-magic-production.up.railway.app',
    local: 'https://localhost:7290',
    timeout: 30000 // 30 seconds
};

// Use production by default, can be overridden
const API_BASE_URL = API_CONFIG.production;

/**
 * Get authentication token from localStorage
 * @returns {string|null}
 */
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;

    // Check if token is expired
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // Convert to milliseconds
        return expiry > Date.now();
    } catch (error) {
        console.error('❌ API: Invalid token format', error);
        return false;
    }
}

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/tasks')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        console.log(`🌐 API: ${options.method || 'GET'} ${endpoint}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(url, {
            ...config,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));

            // Token expired - clear auth
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user_id');
                throw new Error('Authentication expired. Please log in again.');
            }

            throw new Error(errorData.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ API: ${endpoint} success`);
        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ API: Request timeout', endpoint);
            throw new Error('Request timeout. Please check your connection.');
        }

        if (!navigator.onLine) {
            console.warn('⚠️ API: Offline - request will be queued');
            throw new Error('You are offline. Changes will sync when online.');
        }

        console.error('❌ API: Request failed', endpoint, error);
        throw error;
    }
}

// ============================================================================
// Authentication API
// ============================================================================

/**
 * Register a new user
 * @param {Object} userData - { email, password, familyName, parentName }
 * @returns {Promise<Object>}
 */
export async function register(userData) {
    return apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>}
 */
export async function login(credentials) {
    return apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

/**
 * Logout user
 * @returns {Promise<Object>}
 */
export async function logout() {
    return apiRequest('/api/auth/logout', {
        method: 'POST'
    });
}

/**
 * Get current user profile
 * @returns {Promise<Object>}
 */
export async function getUserProfile() {
    return apiRequest('/api/auth/profile');
}

// ============================================================================
// Family API
// ============================================================================

/**
 * Get user's families
 * @returns {Promise<Array>}
 */
export async function getFamilies() {
    return apiRequest('/api/family');
}

/**
 * Get family by ID
 * @param {string} familyId - Family ID
 * @returns {Promise<Object>}
 */
export async function getFamily(familyId) {
    return apiRequest(`/api/family/${familyId}`);
}

/**
 * Create a new family
 * @param {Object} familyData - { name }
 * @returns {Promise<Object>}
 */
export async function createFamily(familyData) {
    return apiRequest('/api/family', {
        method: 'POST',
        body: JSON.stringify(familyData)
    });
}

/**
 * Add member to family
 * @param {string} familyId - Family ID
 * @param {Object} memberData - { name, role, avatar }
 * @returns {Promise<Object>}
 */
export async function addFamilyMember(familyId, memberData) {
    return apiRequest(`/api/family/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData)
    });
}

// ============================================================================
// Tasks API
// ============================================================================

/**
 * Get all tasks for current user's family
 * @returns {Promise<Array>}
 */
export async function getTasks() {
    return apiRequest('/api/tasks');
}

/**
 * Get task by ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function getTask(taskId) {
    return apiRequest(`/api/tasks/${taskId}`);
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>}
 */
export async function createTask(taskData) {
    return apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
    });
}

/**
 * Update a task
 * @param {string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise<Object>}
 */
export async function updateTask(taskId, taskData) {
    return apiRequest(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
    });
}

/**
 * Delete a task
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
    return apiRequest(`/api/tasks/${taskId}`, {
        method: 'DELETE'
    });
}

/**
 * Complete a task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function completeTask(taskId) {
    return apiRequest(`/api/tasks/${taskId}/complete`, {
        method: 'POST'
    });
}

/**
 * Approve a completed task (parent only)
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function approveTask(taskId) {
    return apiRequest(`/api/tasks/${taskId}/approve`, {
        method: 'POST'
    });
}

/**
 * Reject a completed task (parent only)
 * @param {string} taskId - Task ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>}
 */
export async function rejectTask(taskId, reason) {
    return apiRequest(`/api/tasks/${taskId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    });
}

// ============================================================================
// Points API
// ============================================================================

/**
 * Get points for a member
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>}
 */
export async function getMemberPoints(memberId) {
    return apiRequest(`/api/points/${memberId}`);
}

/**
 * Get point transaction history for a member
 * @param {string} memberId - Member ID
 * @returns {Promise<Array>}
 */
export async function getPointHistory(memberId) {
    return apiRequest(`/api/points/${memberId}/history`);
}

// ============================================================================
// Rewards API
// ============================================================================

/**
 * Get all rewards for current family
 * @returns {Promise<Array>}
 */
export async function getRewards() {
    return apiRequest('/api/rewards');
}

/**
 * Create a new reward
 * @param {Object} rewardData - Reward data
 * @returns {Promise<Object>}
 */
export async function createReward(rewardData) {
    return apiRequest('/api/rewards', {
        method: 'POST',
        body: JSON.stringify(rewardData)
    });
}

/**
 * Update a reward
 * @param {string} rewardId - Reward ID
 * @param {Object} rewardData - Updated reward data
 * @returns {Promise<Object>}
 */
export async function updateReward(rewardId, rewardData) {
    return apiRequest(`/api/rewards/${rewardId}`, {
        method: 'PUT',
        body: JSON.stringify(rewardData)
    });
}

/**
 * Delete a reward
 * @param {string} rewardId - Reward ID
 * @returns {Promise<void>}
 */
export async function deleteReward(rewardId) {
    return apiRequest(`/api/rewards/${rewardId}`, {
        method: 'DELETE'
    });
}

/**
 * Redeem a reward
 * @param {string} rewardId - Reward ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>}
 */
export async function redeemReward(rewardId, memberId) {
    return apiRequest(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ memberId })
    });
}

// ============================================================================
// Sync API
// ============================================================================

/**
 * Sync local changes with server
 * @param {Object} syncPayload - { client_type, last_sync_timestamp, changes[] }
 * @returns {Promise<Object>}
 */
export async function syncChanges(syncPayload) {
    return apiRequest('/api/sync', {
        method: 'POST',
        body: JSON.stringify(syncPayload)
    });
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check API health status
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
}

/**
 * Test API connection (no auth required)
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
    try {
        await healthCheck();
        return true;
    } catch (error) {
        console.error('❌ API: Connection test failed', error);
        return false;
    }
}
