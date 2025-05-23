// Wardrobe caching service

// Cache keys - make them user-specific
const getUserWardrobeCacheKey = () => {
  const userId = localStorage.getItem("user_id");
  return `wardrobe_cache_${userId}`;
};

const getUserCacheInvalidationKey = () => {
  const userId = localStorage.getItem("user_id");
  return `wardrobe_cache_needs_update_${userId}`;
};

// Check if we're already fetching to prevent duplicate API calls
const getWardrobeFetchInProgressKey = () => {
  const userId = localStorage.getItem("user_id");
  return `wardrobe_fetch_in_progress_${userId}`;
};

// Set cache invalidation flag when data changes
export const invalidateWardrobeCache = () => {
  const key = getUserCacheInvalidationKey();
  localStorage.setItem(key, 'true');
};

// Check if cache needs update
export const needsCacheUpdate = () => {
  const key = getUserCacheInvalidationKey();
  return localStorage.getItem(key) === 'true' || !getCachedWardrobes().length;
};

// Check if a fetch is already in progress
export const isWardrobeFetchInProgress = () => {
  const key = getWardrobeFetchInProgressKey();
  return localStorage.getItem(key) === 'true';
};

// Mark that a fetch is starting
export const markWardrobeFetchInProgress = () => {
  const key = getWardrobeFetchInProgressKey();
  localStorage.setItem(key, 'true');
};

// Mark that a fetch has completed
export const markWardrobeFetchCompleted = () => {
  const key = getWardrobeFetchInProgressKey();
  localStorage.removeItem(key);
};

// Force the cache to be updated on next fetch
export const forceWardrobeCacheRefresh = () => {
  invalidateWardrobeCache();
};

// Get wardrobes from cache
export const getCachedWardrobes = () => {
  const key = getUserWardrobeCacheKey();
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Error parsing cached wardrobe data:", e);
      return [];
    }
  }
  return [];
};

// Update wardrobe cache
export const updateWardrobeCache = (wardrobes) => {
  const cacheKey = getUserWardrobeCacheKey();
  const invalidationKey = getUserCacheInvalidationKey();
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(wardrobes));
    localStorage.removeItem(invalidationKey);
    console.log("Cache updated with", wardrobes.length, "wardrobes");
  } catch (e) {
    console.error("Error updating wardrobe cache:", e);
  }
  
  // Mark the fetch as completed
  markWardrobeFetchCompleted();
}; 