/**
 * LiDex Analytics - Supabase Client
 */

// Import config (generated during deploy)
const { SUPABASE_URL, SUPABASE_ANON_KEY } = SUPABASE_CONFIG;

// Create Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.db = db;

// Health check
async function checkSupabaseConnection() {
    try {
        const { error } = await db.from('series').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connected');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSupabaseConnection();
});
