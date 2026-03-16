/**
 * ============================================
 * LiDex Analytics - API Data Functions
 * Version: 1.0
 * ============================================
 */

class LiDexAPI {
    constructor() {
        this.db = window.db;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // ========== SERIES (Core Content) ==========

    // Get all series with optional filters
    async getSeries({ limit = 20, offset = 0, type = null, status = null, search = null } = {}) {
        const cacheKey = `series_${limit}_${offset}_${type}_${status}_${search}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        let query = this.db.from('series').select(`
            *,
            anime_meta (*),
            manga_meta (*),
            series_links (*),
            series_relations (
                related_series:series_id (*)
            )
        `);

        if (type) query = query.eq('item_type', type);
        if (status) query = query.eq('status', status);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return handleSupabaseError(error, 'getSeries');
        
        this.saveToCache(cacheKey, data);
        return { data, error: null };
    }

    // Get single series by ID
    async getSeriesById(id) {
        const cacheKey = `series_${id}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const { data, error } = await this.db
            .from('series')
            .select(`
                *,
                anime_meta (*),
                manga_meta (*),
                volumes (*),
                series_links (*),
                series_relations (
                    related_series:series_id (*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return handleSupabaseError(error, 'getSeriesById');
        
        this.saveToCache(cacheKey, data);
        return { data, error: null };
    }

    // Get trending series (based on votes/views)
    async getTrendingSeries({ limit = 10, timeRange = 'week' } = {}) {
        const cacheKey = `trending_${limit}_${timeRange}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        // Join with novel_votes to get vote counts
        const { data, error } = await this.db
            .from('series')
            .select(`
                *,
                anime_meta (*),
                manga_meta (*),
                novel_votes (vote_count)
            `)
            .order('is_featured', { ascending: false })
            .limit(limit);

        if (error) return handleSupabaseError(error, 'getTrendingSeries');
        
        this.saveToCache(cacheKey, data);
        return { data, error: null };
    }

    // ========== VOTES & ANALYTICS ==========

    // Get vote statistics
    async getVoteStats({ seriesId = null, timeRange = 'month' } = {}) {
        let query = this.db.from('novel_votes').select('*');
        
        if (seriesId) {
            query = query.eq('novel_id', seriesId);
        }

        // Filter by time range
        const date = new Date();
        if (timeRange === 'week') date.setDate(date.getDate() - 7);
        else if (timeRange === 'month') date.setMonth(date.getMonth() - 1);
        else if (timeRange === 'year') date.setFullYear(date.getFullYear() - 1);

        query = query.gte('created_at', date.toISOString());

        const { data, error } = await query;
        if (error) return handleSupabaseError(error, 'getVoteStats');
        
        return { data, error: null };
    }

    // Submit a vote
    async submitVote({ seriesId, userId = 'anonymous' }) {
        const { data, error } = await this.db
            .from('novel_votes')
            .insert([{
                novel_id: seriesId,
                voter_id: userId,
                created_at: new Date().toISOString()
            }]);

        if (error) return handleSupabaseError(error, 'submitVote');
        
        // Also log the vote
        await this.db.from('vote_log').insert([{
            novel_id: seriesId,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        }]);

        return { data, error: null };
    }

    // ========== RELEASE SCHEDULE ==========

    async getReleaseSchedule({ limit = 20, type = null } = {}) {
        let query = this.db.from('release_schedule').select(`
            *,
            series (
                title,
                cover_url,
                item_type
            )
        `);

        if (type) query = query.eq('item_type', type);

        const { data, error } = await query
            .order('release_date', { ascending: true })
            .limit(limit);

        if (error) return handleSupabaseError(error, 'getReleaseSchedule');
        
        return { data, error: null };
    }

    // ========== FEATURED & ANNOUNCEMENTS ==========

    async getFeaturedItems({ limit = 6 } = {}) {
        const { data, error } = await this.db
            .from('featured_items')
            .select(`
                *,
                series (
                    title,
                    cover_url,
                    item_type
                )
            `)
            .order('sort_order', { ascending: true })
            .limit(limit);

        if (error) return handleSupabaseError(error, 'getFeaturedItems');
        
        return { data, error: null };
    }

    async getAnnouncements({ limit = 5 } = {}) {
        const { data, error } = await this.db
            .from('site_announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return handleSupabaseError(error, 'getAnnouncements');
        
        return { data, error: null };
    }

    // ========== STATISTICS ==========

    async getSiteStats() {
        const [seriesCount, animeCount, mangaCount, voteCount] = await Promise.all([
            this.db.from('series').select('*', { count: 'exact', head: true }),
            this.db.from('anime_meta').select('*', { count: 'exact', head: true }),
            this.db.from('manga_meta').select('*', { count: 'exact', head: true }),
            this.db.from('novel_votes').select('*', { count: 'exact', head: true })
        ]);

        return {
            totalSeries: seriesCount.count || 0,
            totalAnime: animeCount.count || 0,
            totalManga: mangaCount.count || 0,
            totalVotes: voteCount.count || 0
        };
    }

    // ========== CACHE MANAGEMENT ==========

    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheExpiry;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Initialize API
const api = new LiDexAPI();
window.api = api;
