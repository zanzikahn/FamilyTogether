/**
 * Authentication Service for FamilyTogether SPA
 * Integrates Supabase Auth with Railway API
 *
 * Flow:
 * 1. User registers/logs in with Supabase
 * 2. Get JWT token from Supabase
 * 3. Call Railway API to get/create user profile
 * 4. Store token and user data in localStorage
 * 5. Initialize sync for authenticated user
 */

import { register as apiRegister, login as apiLogin, logout as apiLogout, getUserProfile } from './api.js';

// Supabase client will be initialized from index.html
// We access it via window.supabaseClient

/**
 * Check if Supabase client is available
 * @returns {boolean}
 */
function isSupabaseAvailable() {
    return typeof window.supabaseClient !== 'undefined';
}

/**
 * Get current auth token from localStorage
 * @returns {string|null}
 */
export function getAuthToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Get current user ID from localStorage
 * @returns {string|null}
 */
export function getCurrentUserId() {
    return localStorage.getItem('current_user_id');
}

/**
 * Check if user is currently authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    const token = getAuthToken();
    const userId = getCurrentUserId();

    if (!token || !userId) return false;

    // Check token expiry
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // milliseconds
        return expiry > Date.now();
    } catch (error) {
        console.error('❌ Auth: Invalid token format', error);
        return false;
    }
}

/**
 * Register a new user
 * @param {Object} userData - { email, password, familyName, parentName }
 * @returns {Promise<Object>}
 */
export async function register(userData) {
    try {
        console.log('🔐 Auth: Starting registration...');

        if (!isSupabaseAvailable()) {
            throw new Error('Supabase client not initialized');
        }

        // Step 1: Register with Supabase Auth
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password
        });

        if (authError) {
            console.error('❌ Auth: Supabase registration failed', authError);
            throw new Error(authError.message);
        }

        if (!authData.session) {
            throw new Error('Registration successful but no session created. Please check your email to confirm.');
        }

        console.log('✅ Auth: Supabase registration successful');

        // Step 2: Get JWT token
        const token = authData.session.access_token;
        const supabaseUserId = authData.user.id;

        // Store token temporarily for API call
        localStorage.setItem('auth_token', token);

        // Step 3: Call Railway API to create family and member
        try {
            const apiResponse = await apiRegister({
                email: userData.email,
                familyName: userData.familyName,
                parentName: userData.parentName
            });

            console.log('✅ Auth: Railway API registration successful');

            // Step 4: Store user data
            localStorage.setItem('current_user_id', apiResponse.memberId || supabaseUserId);
            localStorage.setItem('family_id', apiResponse.familyId);
            localStorage.setItem('member_id', apiResponse.memberId);

            return {
                success: true,
                user: {
                    id: apiResponse.memberId || supabaseUserId,
                    email: userData.email,
                    familyId: apiResponse.familyId,
                    memberId: apiResponse.memberId
                },
                token: token
            };

        } catch (apiError) {
            console.error('❌ Auth: Railway API registration failed', apiError);

            // Rollback: Delete Supabase user if API registration failed
            // (Optional - Supabase user will exist but won't have family/member data)

            throw new Error('Failed to complete registration: ' + apiError.message);
        }

    } catch (error) {
        console.error('❌ Auth: Registration failed', error);

        // Clean up localStorage on failure
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('family_id');
        localStorage.removeItem('member_id');

        throw error;
    }
}

/**
 * Login existing user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>}
 */
export async function login(credentials) {
    try {
        console.log('🔐 Auth: Starting login...');

        if (!isSupabaseAvailable()) {
            throw new Error('Supabase client not initialized');
        }

        // Step 1: Login with Supabase Auth
        const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (authError) {
            console.error('❌ Auth: Supabase login failed', authError);
            throw new Error(authError.message);
        }

        if (!authData.session) {
            throw new Error('Login failed: No session created');
        }

        console.log('✅ Auth: Supabase login successful');

        // Step 2: Get JWT token
        const token = authData.session.access_token;
        const supabaseUserId = authData.user.id;

        // Store token for API call
        localStorage.setItem('auth_token', token);

        // Step 3: Get user profile from Railway API
        try {
            const profile = await getUserProfile();

            console.log('✅ Auth: Railway API profile retrieved');

            // Step 4: Store user data
            localStorage.setItem('current_user_id', profile.memberId || supabaseUserId);
            localStorage.setItem('family_id', profile.familyId);
            localStorage.setItem('member_id', profile.memberId);

            return {
                success: true,
                user: {
                    id: profile.memberId || supabaseUserId,
                    email: credentials.email,
                    familyId: profile.familyId,
                    memberId: profile.memberId,
                    name: profile.name,
                    role: profile.role
                },
                token: token
            };

        } catch (apiError) {
            console.error('❌ Auth: Railway API profile fetch failed', apiError);
            throw new Error('Failed to load user profile: ' + apiError.message);
        }

    } catch (error) {
        console.error('❌ Auth: Login failed', error);

        // Clean up localStorage on failure
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('family_id');
        localStorage.removeItem('member_id');

        throw error;
    }
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        console.log('🔐 Auth: Starting logout...');

        // Step 1: Logout from Supabase
        if (isSupabaseAvailable()) {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) {
                console.warn('⚠️ Auth: Supabase logout warning', error);
            }
        }

        // Step 2: Call Railway API logout (optional, for session cleanup)
        try {
            await apiLogout();
        } catch (apiError) {
            console.warn('⚠️ Auth: Railway API logout warning', apiError);
            // Continue even if API logout fails
        }

        // Step 3: Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('family_id');
        localStorage.removeItem('member_id');

        console.log('✅ Auth: Logout successful');

    } catch (error) {
        console.error('❌ Auth: Logout error', error);
        // Force cleanup even on error
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('family_id');
        localStorage.removeItem('member_id');
    }
}

/**
 * Refresh authentication token if expired/expiring soon
 * @returns {Promise<string|null>} New token or null if refresh failed
 */
export async function refreshToken() {
    try {
        if (!isSupabaseAvailable()) {
            return null;
        }

        console.log('🔄 Auth: Refreshing token...');

        const { data, error } = await window.supabaseClient.auth.refreshSession();

        if (error) {
            console.error('❌ Auth: Token refresh failed', error);
            return null;
        }

        if (data.session) {
            const newToken = data.session.access_token;
            localStorage.setItem('auth_token', newToken);
            console.log('✅ Auth: Token refreshed successfully');
            return newToken;
        }

        return null;

    } catch (error) {
        console.error('❌ Auth: Token refresh error', error);
        return null;
    }
}

/**
 * Get current session from Supabase
 * @returns {Promise<Object|null>}
 */
export async function getSession() {
    if (!isSupabaseAvailable()) {
        return null;
    }

    const { data, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        console.error('❌ Auth: Failed to get session', error);
        return null;
    }

    return data.session;
}

/**
 * Initialize auth state (call on app startup)
 * Checks for existing session and validates token
 * @returns {Promise<boolean>} True if user is authenticated
 */
export async function initAuth() {
    try {
        console.log('🔐 Auth: Initializing...');

        // Check localStorage first
        const token = getAuthToken();
        const userId = getCurrentUserId();

        if (!token || !userId) {
            console.log('ℹ️ Auth: No stored credentials');
            return false;
        }

        // Check if token is expired
        if (!isAuthenticated()) {
            console.log('⚠️ Auth: Token expired, attempting refresh...');

            // Try to refresh token
            const newToken = await refreshToken();

            if (!newToken) {
                console.log('❌ Auth: Token refresh failed, user must login again');
                await logout();
                return false;
            }
        }

        console.log('✅ Auth: User is authenticated');
        return true;

    } catch (error) {
        console.error('❌ Auth: Initialization error', error);
        return false;
    }
}

/**
 * Auto-refresh token before expiry
 * Call this periodically (e.g., every 30 minutes)
 * @returns {Promise<void>}
 */
export async function autoRefreshToken() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        const timeUntilExpiry = expiry - Date.now();

        // Refresh if expiring in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('🔄 Auth: Token expiring soon, auto-refreshing...');
            await refreshToken();
        }

    } catch (error) {
        console.error('❌ Auth: Auto-refresh error', error);
    }
}

/**
 * Start auto-refresh timer (30 minutes interval)
 * @returns {number} Timer ID
 */
export function startAutoRefresh() {
    // Check every 30 minutes
    const intervalId = setInterval(autoRefreshToken, 30 * 60 * 1000);
    console.log('✅ Auth: Auto-refresh timer started');
    return intervalId;
}

/**
 * Stop auto-refresh timer
 * @param {number} intervalId - Timer ID from startAutoRefresh()
 */
export function stopAutoRefresh(intervalId) {
    clearInterval(intervalId);
    console.log('✅ Auth: Auto-refresh timer stopped');
}
