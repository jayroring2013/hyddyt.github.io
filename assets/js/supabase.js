/**
 * LiDex Analytics - Supabase Client
 */

// Import config (generated during deploy)
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

// Create Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.db = db;

// Health check
async function checkSupabaseConnection() {
    try {
        const { error } = await db.from('series').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connected successfully');
        console.log('📊 URL:', SUPABASE_URL.substring(0, 25) + '...');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSupabaseConnection();
});
