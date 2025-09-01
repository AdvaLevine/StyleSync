// Wardrobe caching service

// Cache keys - make them user-specific
const getUserWardrobeCacheKey = () => {
  const userId = localStorage.getItem("user_id");
  return `wardrobe_cache_${userId}`;
};

// Export this so it can be used in Home.jsx
export const getUserCacheInvalidationKey = () => {
  const userId = localStorage.getItem("user_id");
  return `wardrobe_cache_needs_update_${userId}`;
};

// Check if we're already fetching to prevent duplicate API calls
const getWardrobeFetchInProgressKey = () => {
  const userId = localStorage.getItem("user_id");
  return `wardrobe_fetch_in_progress_${userId}`;
};

// Clear wardrobe cache for the current user
export const clearWardrobeCache = () => {
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;
    
    // Clear wardrobe cache
    localStorage.removeItem(getUserWardrobeCacheKey());
    localStorage.removeItem(getUserCacheInvalidationKey());
    localStorage.removeItem(getWardrobeFetchInProgressKey());
    
    return true;
  } catch (error) {
    console.error("Error clearing wardrobe cache:", error);
    return false;
  }
};

// Set cache invalidation flag when data changes
export const invalidateWardrobeCache = () => {
  const key = getUserCacheInvalidationKey();
  localStorage.setItem(key, 'true');
};

// Check if cache needs update - modified to handle empty wardrobes better
export const needsCacheUpdate = () => {
  const key = getUserCacheInvalidationKey();
  const needsUpdate = localStorage.getItem(key) === 'true';
  
  // If the invalidation flag is set, we definitely need an update
  if (needsUpdate) {
    return true;
  }
  
  // Get the cached wardrobes
  const cachedData = localStorage.getItem(getUserWardrobeCacheKey());
  
  // Only fetch if we've never fetched before (no cached data at all)
  // This is different from having an empty array of wardrobes
  return cachedData === null;
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
    // Always store the data, even if it's an empty array
    // This way we know we've fetched at least once
    localStorage.setItem(cacheKey, JSON.stringify(wardrobes));
    
    // Clear the invalidation flag
    localStorage.removeItem(invalidationKey);
    console.log("Cache updated with", wardrobes.length, "wardrobes");
  } catch (e) {
    console.error("Error updating wardrobe cache:", e);
  }
  
  // Mark the fetch as completed
  markWardrobeFetchCompleted();
};

// New function to remove a wardrobe from the cache
export const removeWardrobeFromCache = (wardrobeName) => {
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;
    
    // Get current wardrobes from cache
    const cacheKey = getUserWardrobeCacheKey();
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const wardrobes = JSON.parse(cachedData);
      // Filter out the wardrobe to be removed
      const updatedWardrobes = wardrobes.filter(w => w.name !== wardrobeName);
      
      // Update the cache with the filtered list
      localStorage.setItem(cacheKey, JSON.stringify(updatedWardrobes));
      console.log(`Removed wardrobe ${wardrobeName} from cache`);
    }
    
    return true;
  } catch (error) {
    console.error("Error removing wardrobe from cache:", error);
    return false;
  }
};