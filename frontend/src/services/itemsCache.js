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

// Cache key for recent items
const getRecentItemsCacheKey = () => {
  const userId = localStorage.getItem("user_id");
  return `recent_items_cache_${userId}`;
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
  // This will ensure next time the wardrobe is viewed, it fetches fresh data
  invalidateItemsCache(wardrobeName);
  
  console.log(`Invalidated cache for wardrobe ${wardrobeName}`);
  
  // We're not going to try adding directly to the cache anymore
  // Instead, we'll force a refresh on next view
  
  // Still update the total count in localStorage
  const totalCountKey = getAllItemsCacheKey();
  const currentCount = parseInt(localStorage.getItem(totalCountKey) || "0", 10);
  localStorage.setItem(totalCountKey, (currentCount + 1).toString());
  
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
export const initializeItemsCache = () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return false;
  
  try {
    // Simply initialize the total count if it doesn't exist
    if (!localStorage.getItem(getAllItemsCacheKey())) {
      localStorage.setItem(getAllItemsCacheKey(), "0");
    }
    
    // Initialize recent items if they don't exist
    if (!localStorage.getItem(getRecentItemsCacheKey())) {
      localStorage.setItem(getRecentItemsCacheKey(), "[]");
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing items cache:", error);
    return false;
  }
};

// Fetch total items count from dedicated Lambda endpoint
export const fetchTotalItemsCount = async () => {
  try {
    const userId = localStorage.getItem("user_id");
    console.log("Fetching items count for userId:", userId);
    
    if (!userId) {
      console.error("No user ID found in localStorage");
      return 0;
    }
    
    // Try with URL encoded parameter
    const encodedUserId = encodeURIComponent(userId);
    const apiUrl = `https://ejvfo74uj1.execute-api.us-east-1.amazonaws.com/deploy/items-count?userId=${encodedUserId}`;
    console.log("Calling API:", apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log("Raw API response:", data);
    
    // Handle nested response structure
    let count = 0;
    
    if (data.body) {
      try {
        const bodyData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        count = bodyData.count || 0;
      } catch (e) {
        console.error("Error parsing body:", e);
      }
    } else if (data.count !== undefined) {
      count = data.count;
    }
    
    console.log("Final extracted count:", count);
    localStorage.setItem(getAllItemsCacheKey(), count.toString());
    return count;
  } catch (error) {
    console.error("Error fetching total items count:", error);
    return getCachedTotalItemsCount();
  }
}; 