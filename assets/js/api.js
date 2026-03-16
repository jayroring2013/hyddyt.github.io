/**
 * LiDex Analytics - API Data Functions
 */

class LiDexAPI {
    constructor() {
        this.db = window.db;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000;
    }

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

    async getTrendingSeries({ limit = 3 } = {}) {
        const { data, error } = await this.db
            .from('series')
            .select('*, novel_votes(vote_count)')
            .order('is_featured', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    }

    async getSeriesById(id) {
        const { data, error } = await this.db
            .from('series')
            .select('*, anime_meta(*), manga_meta(*), volumes(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    }
}

const api = new LiDexAPI();
window.api = api;
