/**
 * Configuration for FamilyTogether SPA
 * Environment-specific settings for API and Supabase
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
    url: 'https://yjqkttueeqwskwukmham.supabase.co',
    publishableKey: 'sb_publishable__3P5McO6Gnc4mQQ4ZPUHdw_J0xoJGhO' // New publishable key format (replaces anonKey)
};

// API Configuration
export const API_CONFIG = {
    production: 'https://familytogether-production.up.railway.app', // Updated Railway URL
    local: 'https://localhost:7290',
    timeout: 30000 // 30 seconds
};

// Use production by default
// Can be overridden by setting localStorage.setItem('api_environment', 'local')
export const API_BASE_URL = (() => {
    const env = localStorage.getItem('api_environment');
    return env === 'local' ? API_CONFIG.local : API_CONFIG.production;
})();

// Sync Configuration
export const SYNC_CONFIG = {
    intervalMs: 30000, // 30 seconds
    maxChangesPerSync: 100,
    retryDelayMs: 5000 // 5 seconds
};

// IndexedDB Configuration
export const DB_CONFIG = {
    name: 'FamilyTogetherDB',
    version: 1
};

// Feature Flags
export const FEATURES = {
    enableSync: true,
    enableOfflineMode: true,
    debugMode: false // Set to true for verbose logging
};

// App Metadata
export const APP_INFO = {
    name: 'FamilyTogether',
    version: '2.0.0',
    description: 'Local-First Family Task & Reward Tracker',
    netlifyUrl: 'https://familytogether-chores.netlify.app',
    githubUrl: 'https://github.com/zanzikahn/FamilyTogether'
};

/**
 * Initialize Supabase client (call from index.html)
 * Requires @supabase/supabase-js loaded via CDN
 */
export function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded! Include CDN script in HTML.');
        return null;
    }

    try {
        const client = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.publishableKey
        );

        window.supabaseClient = client;
        console.log('✅ Supabase client initialized');
        return client;

    } catch (error) {
        console.error('❌ Failed to initialize Supabase', error);
        return null;
    }
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
    return {
        apiUrl: API_BASE_URL,
        supabaseUrl: SUPABASE_CONFIG.url,
        isOnline: navigator.onLine,
        dbName: DB_CONFIG.name,
        syncInterval: SYNC_CONFIG.intervalMs,
        version: APP_INFO.version
    };
}

/**
 * Toggle debug mode
 * @param {boolean} enabled - Enable debug mode
 */
export function setDebugMode(enabled) {
    FEATURES.debugMode = enabled;
    localStorage.setItem('debug_mode', enabled ? 'true' : 'false');
    console.log(`🐛 Debug mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Switch between local and production API (for testing)
 * @param {'local'|'production'} environment
 */
export function setAPIEnvironment(environment) {
    if (environment !== 'local' && environment !== 'production') {
        console.error('❌ Invalid environment. Use "local" or "production"');
        return;
    }

    localStorage.setItem('api_environment', environment);
    console.log(`🔄 API environment set to: ${environment}`);
    console.log('⚠️ Please reload the page for changes to take effect');
}
