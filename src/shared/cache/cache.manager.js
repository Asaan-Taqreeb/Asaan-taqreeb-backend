/**
 * High-Speed In-Memory Cache Manager for Asaan Taqreeb Backend
 * Provides microsecond response times for high-traffic endpoints
 * (Services, Categories, Vendor Listings, Revenue Summaries)
 * and supports exact & prefix-based pattern invalidations upon writes.
 */

class MemoryCacheManager {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  /**
   * Get a cached entry if present and not expired
   * @param {string} key 
   * @returns {any | null}
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.ttls.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Store a value in cache with optional TTL in seconds (default: 5 minutes)
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   */
  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    if (ttlSeconds > 0) {
      this.ttls.set(key, Date.now() + ttlSeconds * 1000);
    } else {
      this.ttls.delete(key);
    }
  }

  /**
   * Delete an exact key or all keys matching a prefix / substring
   * @param {string} keyOrPrefix 
   */
  del(keyOrPrefix) {
    if (this.cache.has(keyOrPrefix)) {
      this.cache.delete(keyOrPrefix);
      this.ttls.delete(keyOrPrefix);
    }

    // Also match prefixes (e.g., "services_", "bookings_")
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyOrPrefix) || key.includes(keyOrPrefix)) {
        this.cache.delete(key);
        this.ttls.delete(key);
      }
    }
  }

  /**
   * Invalidate entire memory cache
   */
  flush() {
    this.cache.clear();
    this.ttls.clear();
  }
}

const cacheManager = new MemoryCacheManager();

module.exports = cacheManager;
