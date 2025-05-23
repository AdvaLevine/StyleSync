// Items caching service

// Cache keys - make them user-specific per wardrobe
const getUserItemsCacheKey = (wardrobeName) => {
  const userId = localStorage.getItem("user_id");
  return `items_cache_${userId}_${wardrobeName}`;
};

const getUserItemsCacheInvalidationKey = (wardrobeName) => {
  const userId = localStorage.getItem("user_id");
  return `items_cache_needs_update_${userId}_${wardrobeName}`;
};

// Cache key for all items (for dashboard total count)
const getAllItemsCacheKey = () => {
  const userId = localStorage.getItem("user_id");
  return `all_items_cache_${userId}`;
};

// Cache key for count invalidation
const getCountInvalidationKey = () => {
  const userId = localStorage.getItem("user_id");
  return `count_needs_update_${userId}`;
};

// Cache key for recent items
const getRecentItemsCacheKey = () => {
  const userId = localStorage.getItem("user_id");
  return `recent_items_cache_${userId}`;
};

// Function to check if we need to update the count
export const needsCountUpdate = () => {
  const key = getCountInvalidationKey();
  const needsUpdate = localStorage.getItem(key) === 'true';
  console.log(`needsCountUpdate: Checking key ${key}, result=${needsUpdate}`);
  return needsUpdate;
};

// Function to mark the count as needing an update
export const invalidateCountCache = () => {
  const key = getCountInvalidationKey();
  localStorage.setItem(key, 'true');
  console.log(`invalidateCountCache: Setting ${key}=true`);
};

// Function to mark the count as up-to-date
export const markCountUpdated = () => {
  const key = getCountInvalidationKey();
  localStorage.removeItem(key);
  console.log(`markCountUpdated: Removed ${key}`);
};

// Set cache invalidation flag when data changes
export const invalidateItemsCache = (wardrobeName) => {
  if (wardrobeName) {
    // Invalidate specific wardrobe items
    const key = getUserItemsCacheInvalidationKey(wardrobeName);
    localStorage.setItem(key, 'true');
  } else {
    // Invalidate all items caches
    const userId = localStorage.getItem("user_id");
    const keyPrefix = `items_cache_needs_update_${userId}`;
    
    // Find and invalidate all wardrobe-specific caches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(keyPrefix)) {
        localStorage.setItem(key, 'true');
      }
    }
    
    // Also invalidate the all items and recent items caches
    localStorage.setItem(`all_items_cache_needs_update_${userId}`, 'true');
    localStorage.setItem(`recent_items_cache_needs_update_${userId}`, 'true');
  }
};

// Check if cache needs update
export const needsItemsCacheUpdate = (wardrobeName) => {
  if (wardrobeName) {
    const key = getUserItemsCacheInvalidationKey(wardrobeName);
    return localStorage.getItem(key) === 'true' || !getCachedItems(wardrobeName).length;
  }
  return true;
};

// Force the cache to be updated on next fetch
export const forceItemsCacheRefresh = (wardrobeName) => {
  invalidateItemsCache(wardrobeName);
};

// Get items from cache for specific wardrobe
export const getCachedItems = (wardrobeName) => {
  if (!wardrobeName) return [];
  
  const key = getUserItemsCacheKey(wardrobeName);
  const cachedData = localStorage.getItem(key);
  
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Error parsing cached items data:", e);
      return [];
    }
  }
  return [];
};

// Get total items count from all wardrobes
export const getCachedTotalItemsCount = () => {
  const key = getAllItemsCacheKey();
  const cachedCount = localStorage.getItem(key);
  
  if (cachedCount) {
    try {
      return parseInt(cachedCount, 10);
    } catch (e) {
      console.error("Error parsing cached items count:", e);
      return 0;
    }
  }
  return 0;
};

// Get recent items for dashboard
export const getCachedRecentItems = () => {
  const key = getRecentItemsCacheKey();
  const cachedData = localStorage.getItem(key);
  
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Error parsing cached recent items:", e);
      return [];
    }
  }
  return [];
};

// Update items cache for specific wardrobe
export const updateItemsCache = (wardrobeName, items) => {
  if (!wardrobeName || !items) return;
  
  const cacheKey = getUserItemsCacheKey(wardrobeName);
  const invalidationKey = getUserItemsCacheInvalidationKey(wardrobeName);
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(items));
    localStorage.removeItem(invalidationKey);
    console.log(`Cache updated with ${items.length} items for wardrobe ${wardrobeName}`);
    
    // After updating a specific wardrobe's items, update the all items cache
    updateAllItemsCache();
  } catch (e) {
    console.error(`Error updating items cache for wardrobe ${wardrobeName}:`, e);
  }
};

// Add a single new item to the cache
export const addItemToCache = (wardrobeName, newItem) => {
  if (!wardrobeName || !newItem) return;
  
  // Force a cache invalidation for this wardrobe
  invalidateItemsCache(wardrobeName);
  
  console.log(`Invalidated cache for wardrobe ${wardrobeName}`);
  
  // Update the total count in localStorage
  const totalCountKey = getAllItemsCacheKey();
  const currentCount = parseInt(localStorage.getItem(totalCountKey) || "0", 10);
  localStorage.setItem(totalCountKey, (currentCount + 1).toString());
  
  // Mark the count as already up-to-date since we just incremented it directly
  markCountUpdated();
  
  console.log(`Updated cached count to ${currentCount + 1}`);
  
  return true;
};

// Update total items count based on all wardrobe caches
export const updateAllItemsCache = () => {
  const userId = localStorage.getItem("user_id");
  let totalItems = 0;
  let allItems = [];
  
  // Collect items from all wardrobe caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(`items_cache_${userId}_`)) {
      try {
        const items = JSON.parse(localStorage.getItem(key)) || [];
        totalItems += items.length;
        allItems = allItems.concat(items);
      } catch (e) {
        console.error("Error parsing items when calculating total:", e);
      }
    }
  }
  
  // Store the total count
  localStorage.setItem(getAllItemsCacheKey(), totalItems.toString());
  
  // Update recent items cache (sort by date and take most recent 5)
  const recentItems = allItems
    .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || 0))
    .slice(0, 5);
  
  localStorage.setItem(getRecentItemsCacheKey(), JSON.stringify(recentItems));
  
  return totalItems;
};

// Fetch items for a specific wardrobe and update cache
export const fetchAndCacheItems = async (wardrobeName, viewMode = 'images') => {
  if (!wardrobeName) return [];
  
  try {
    const userId = localStorage.getItem("user_id");
    const response = await fetch(
      `https://fml6ajrze5.execute-api.us-east-1.amazonaws.com/dev/items?userId=${userId}&wardrobe=${wardrobeName}&viewMode=${viewMode}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch wardrobe items");
    }

    const items = await response.json();
    
    // Update cache
    updateItemsCache(wardrobeName, items);
    
    return items;
  } catch (error) {
    console.error(`Error fetching items for wardrobe ${wardrobeName}:`, error);
    // Fall back to cached data
    return getCachedItems(wardrobeName);
  }
};

// Initialize items cache - now simply prepares the cache structure
// without actually fetching anything (on-demand only)
export const initializeItemsCache = (skipInvalidateCount = false) => {
  console.log(`initializeItemsCache called with skipInvalidateCount=${skipInvalidateCount}`);
  
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    console.log("initializeItemsCache: No userId found");
    return false;
  }
  
  try {
    // Simply initialize the total count if it doesn't exist
    if (!localStorage.getItem(getAllItemsCacheKey())) {
      localStorage.setItem(getAllItemsCacheKey(), "0");
      console.log("initializeItemsCache: Initialized count to 0");
    }
    
    // Initialize recent items if they don't exist
    if (!localStorage.getItem(getRecentItemsCacheKey())) {
      localStorage.setItem(getRecentItemsCacheKey(), "[]");
      console.log("initializeItemsCache: Initialized recent items to empty array");
    }
    
    // Mark the count as needing update, unless specified to skip
    if (!skipInvalidateCount) {
      console.log("initializeItemsCache: Invalidating count cache");
      invalidateCountCache();
    } else {
      console.log("initializeItemsCache: Skipping count invalidation as requested");
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing items cache:", error);
    return false;
  }
};

// Fetch total items count from dedicated Lambda endpoint
export const fetchTotalItemsCount = async (forceRefresh = false) => {
  const callId = Date.now().toString().slice(-4); // Create a unique ID for this function call
  console.log(`[${callId}] fetchTotalItemsCount called with forceRefresh=${forceRefresh}`);
  
  try {
    const userId = localStorage.getItem("user_id");
    
    // If not forcing refresh and we don't need an update, return the cached count
    if (!forceRefresh && !needsCountUpdate()) {
      const cachedCount = getCachedTotalItemsCount();
      console.log(`[${callId}] Using cached count: ${cachedCount} (no refresh needed)`);
      return cachedCount;
    }
    
    // Check if we're already fetching - prevent duplicate API calls
    const isFetching = localStorage.getItem('count_fetch_in_progress');
    if (isFetching === 'true' && !forceRefresh) {
      console.log(`[${callId}] Count fetch already in progress, using cached data`);
      return getCachedTotalItemsCount();
    }
    
    // Mark that we're starting a fetch
    localStorage.setItem('count_fetch_in_progress', 'true');
    console.log(`[${callId}] Set count_fetch_in_progress flag to true`);
    
    console.log(`[${callId}] Fetching items count for userId: ${userId}`);
    
    if (!userId) {
      console.error(`[${callId}] No user ID found in localStorage`);
      localStorage.removeItem('count_fetch_in_progress');
      return 0;
    }
    
    // Try with URL encoded parameter
    const encodedUserId = encodeURIComponent(userId);
    const apiUrl = `https://ejvfo74uj1.execute-api.us-east-1.amazonaws.com/deploy/items-count?userId=${encodedUserId}`;
    console.log(`[${callId}] Calling API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log(`[${callId}] Raw API response:`, data);
    
    // Handle nested response structure
    let count = 0;
    
    if (data.body) {
      try {
        const bodyData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        count = bodyData.count || 0;
      } catch (e) {
        console.error(`[${callId}] Error parsing body:`, e);
      }
    } else if (data.count !== undefined) {
      count = data.count;
    }
    
    console.log(`[${callId}] Final extracted count: ${count}`);
    localStorage.setItem(getAllItemsCacheKey(), count.toString());
    
    // Mark count as updated
    markCountUpdated();
    console.log(`[${callId}] Marked count as updated`);
    
    // Remove the in-progress flag
    localStorage.removeItem('count_fetch_in_progress');
    console.log(`[${callId}] Removed count_fetch_in_progress flag`);
    
    return count;
  } catch (error) {
    console.error(`[${callId}] Error fetching total items count:`, error);
    // Remove the in-progress flag on error
    localStorage.removeItem('count_fetch_in_progress');
    console.log(`[${callId}] Removed count_fetch_in_progress flag (after error)`);
    return getCachedTotalItemsCount();
  }
}; 