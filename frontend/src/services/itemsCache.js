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

// Clear all cache data for the current user on logout
export const clearUserCache = () => {
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return; // No user to clear cache for

    let keysToRemove = [];
    
    // Find all cache keys related to this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Find all user-specific keys
      if (key.includes(`_${userId}`) || 
          key === `count_fetch_in_progress` ||
          key === `wardrobe_fetch_in_progress_${userId}`) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cache cleared for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("Error clearing user cache:", error);
    return false;
  }
};

// Function to check if we need to update the count
export const needsCountUpdate = () => {
  const key = getCountInvalidationKey();
  const needsUpdate = localStorage.getItem(key) === 'true';
  return needsUpdate;
};

// Function to mark the count as needing an update
export const invalidateCountCache = () => {
  const key = getCountInvalidationKey();
  localStorage.setItem(key, 'true');
};

// Function to mark the count as up-to-date
export const markCountUpdated = () => {
  const key = getCountInvalidationKey();
  localStorage.removeItem(key);
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
    
    // DON'T automatically recalculate total count when updating individual wardrobes
    // This prevents incorrect totals when not all wardrobes have been viewed
    // Only update recent items if we have the data
    updateRecentItemsOnly();
  } catch (e) {
    console.error(`Error updating items cache for wardrobe ${wardrobeName}:`, e);
  }
};

// Helper function to update only recent items without affecting total count
const updateRecentItemsOnly = () => {
  const userId = localStorage.getItem("user_id");
  let allItems = [];
  
  // Collect items from all wardrobe caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(`items_cache_${userId}_`)) {
      try {
        const items = JSON.parse(localStorage.getItem(key)) || [];
        
        if (items.length > 0) {
          // Extract wardrobe name from the key
          const wardrobeName = key.replace(`items_cache_${userId}_`, "");
          
          // Ensure each item has wardrobe info if not already present
          const itemsWithWardrobe = items.map(item => {
            const enrichedItem = {...item};
            if (!enrichedItem.wardrobe) {
              enrichedItem.wardrobe = wardrobeName;
            }
            return enrichedItem;
          });
          
          allItems = allItems.concat(itemsWithWardrobe);
        }
      } catch (e) {
        console.error("Error parsing items when updating recent items:", e);
      }
    }
  }
  
  // Update recent items cache only if we have items
  if (allItems.length > 0) {
    const recentItems = allItems
      .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || 0))
      .slice(0, 4);
    
    localStorage.setItem(getRecentItemsCacheKey(), JSON.stringify(recentItems));
  }
};

// Add a single new item to the cache
export const addItemToCache = (wardrobeName, newItem) => {
  if (!wardrobeName || !newItem) return;
  
  // Force a cache invalidation for this wardrobe
  invalidateItemsCache(wardrobeName);
  
  // Update the total count in localStorage
  const totalCountKey = getAllItemsCacheKey();
  const currentCount = parseInt(localStorage.getItem(totalCountKey) || "0", 10);
  localStorage.setItem(totalCountKey, (currentCount + 1).toString());
  
  // Add the item to the wardrobe-specific cache
  const wardrobeKey = getUserItemsCacheKey(wardrobeName);
  let wardrobeItems = [];
  try {
    const cachedWardrobeItems = localStorage.getItem(wardrobeKey);
    if (cachedWardrobeItems) {
      wardrobeItems = JSON.parse(cachedWardrobeItems);
    }
    
    // Add the new item to the wardrobe items
    wardrobeItems.push(newItem);
    
    // Save the updated wardrobe items
    localStorage.setItem(wardrobeKey, JSON.stringify(wardrobeItems));
  } catch (e) {
    console.error("Error updating wardrobe items cache:", e);
  }
  
  // Also add this item to recent items directly
  const recentKey = getRecentItemsCacheKey();
  let recentItems = [];
  try {
    const cachedRecent = localStorage.getItem(recentKey);
    if (cachedRecent) {
      recentItems = JSON.parse(cachedRecent);
    }
    
    // Ensure the new item has a createdAt timestamp
    if (!newItem.createdAt) {
      newItem.createdAt = new Date().toISOString();
    }
    
    // Add the wardrobe name to the item if it's not there
    if (!newItem.wardrobe) {
      newItem.wardrobe = wardrobeName;
    }
    
    // Add the new item to the beginning of the array
    recentItems.unshift(newItem);
    
    // Limit to 4 items
    if (recentItems.length > 4) {
      recentItems = recentItems.slice(0, 4);
    }
    
    // Save the updated recent items
    localStorage.setItem(recentKey, JSON.stringify(recentItems));
  } catch (e) {
    console.error("Error updating recent items cache:", e);
  }
  
  // Mark the count as already up-to-date since we just incremented it directly
  markCountUpdated();
  
  return true;
};

// Update total items count based on all wardrobe caches
export const updateAllItemsCache = (shouldUpdateTotalCount = false) => {
  const userId = localStorage.getItem("user_id");
  let totalItems = 0;
  let allItems = [];
  let foundWardrobeCaches = false;
  
  // Collect items from all wardrobe caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(`items_cache_${userId}_`)) {
      try {
        const items = JSON.parse(localStorage.getItem(key)) || [];
        
        // Only count if this wardrobe actually has cached items
        if (items.length > 0) {
          foundWardrobeCaches = true;
          
          // Extract wardrobe name from the key
          const wardrobeName = key.replace(`items_cache_${userId}_`, "");
          
          // Ensure each item has wardrobe info if not already present
          const itemsWithWardrobe = items.map(item => {
            // Make a copy to avoid modifying the original
            const enrichedItem = {...item};
            if (!enrichedItem.wardrobe) {
              enrichedItem.wardrobe = wardrobeName;
            }
            return enrichedItem;
          });
          
          totalItems += items.length;
          allItems = allItems.concat(itemsWithWardrobe);
        }
      } catch (e) {
        console.error("Error parsing items when calculating total:", e);
      }
    }
  }
  
  // Only update the total count if explicitly requested AND we found wardrobe caches with items
  if (shouldUpdateTotalCount && foundWardrobeCaches) {
    localStorage.setItem(getAllItemsCacheKey(), totalItems.toString());
  } else {
    // If not updating count, return the existing cached count
    totalItems = getCachedTotalItemsCount();
  }
  
  // Update recent items cache (sort by date and take most recent 4)
  if (allItems.length > 0) {
    const recentItems = allItems
      .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || 0))
      .slice(0, 4);
    
    localStorage.setItem(getRecentItemsCacheKey(), JSON.stringify(recentItems));
  }
  
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
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    return false;
  }
  
  try {
    // Simply initialize the total count if it doesn't exist
    if (!localStorage.getItem(getAllItemsCacheKey())) {
      localStorage.setItem(getAllItemsCacheKey(), "0");
    }
    
    // Initialize recent items if they don't exist
    if (!localStorage.getItem(getRecentItemsCacheKey())) {
      localStorage.setItem(getRecentItemsCacheKey(), "[]");
    }
    
    // Mark the count as needing update, unless specified to skip
    if (!skipInvalidateCount) {
      invalidateCountCache();
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing items cache:", error);
    return false;
  }
};

// Fetch total items count from dedicated Lambda endpoint
export const fetchTotalItemsCount = async (forceRefresh = false) => {
  try {
    const userId = localStorage.getItem("user_id");
    
    // Get cached count
    const cachedCount = getCachedTotalItemsCount();
    
    // Skip API call in these cases:
    // 1. Not forcing a refresh AND no update needed
    // 2. Count is explicitly 0 in cache (means we've checked before and user has no items)
    //    AND we aren't explicitly forcing a refresh (for example after adding first item)
    if ((!forceRefresh && !needsCountUpdate()) || 
        (cachedCount === 0 && !needsCountUpdate())) {
      return cachedCount;
    }
    
    // Check if we're already fetching - prevent duplicate API calls 
    // This helps prevent multiple simultaneous API calls
    const isFetching = localStorage.getItem('count_fetch_in_progress');
    if (isFetching === 'true') {
      console.log("Count fetch already in progress, returning cached count");
      return getCachedTotalItemsCount();
    }
    
    // Mark that we're starting a fetch
    localStorage.setItem('count_fetch_in_progress', 'true');
    
    if (!userId) {
      localStorage.removeItem('count_fetch_in_progress');
      return 0;
    }
    
    // Try with URL encoded parameter
    const encodedUserId = encodeURIComponent(userId);
    const apiUrl = `https://ejvfo74uj1.execute-api.us-east-1.amazonaws.com/deploy/items-count?userId=${encodedUserId}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Handle nested response structure
    let count = 0;
    
    if (data.body) {
      try {
        const bodyData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        count = bodyData.count || 0;
      } catch (e) {
        console.error(`Error parsing body:`, e);
      }
    } else if (data.count !== undefined) {
      count = data.count;
    }
    
    // ALWAYS save the fetched count to cache
    const cacheKey = getAllItemsCacheKey();
    localStorage.setItem(cacheKey, count.toString());
    
    // Mark count as updated (clear the invalidation flag)
    markCountUpdated();
    
    // Remove the in-progress flag
    localStorage.removeItem('count_fetch_in_progress');
    
    return count;
  } catch (error) {
    console.error(`Error fetching total items count:`, error);
    // Remove the in-progress flag on error
    localStorage.removeItem('count_fetch_in_progress');
    // Return cached count on error
    return getCachedTotalItemsCount();
  }
};

// New function to clear cache for a specific wardrobe
export const clearWardrobeItemsCache = (wardrobeName) => {
  if (!wardrobeName) return false;
  
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;
    
    // Check if this wardrobe had any items first
    const cacheKey = getUserItemsCacheKey(wardrobeName);
    const cachedItems = localStorage.getItem(cacheKey);
    const hadItems = cachedItems && JSON.parse(cachedItems).length > 0;
    
    console.log(`Wardrobe ${wardrobeName} had items before deletion: ${hadItems}`);
    
    // Remove the items cache for this wardrobe
    localStorage.removeItem(cacheKey);
    
    // Remove the invalidation flag
    const invalidationKey = getUserItemsCacheInvalidationKey(wardrobeName);
    localStorage.removeItem(invalidationKey);
    
    // Only update the total count if the wardrobe actually had items
    if (hadItems) {
      console.log(`Updating total count because wardrobe ${wardrobeName} had items`);
      updateAllItemsCache(true);
    } else {
      console.log(`Skipping count update for empty wardrobe ${wardrobeName}`);
    }
    
    console.log(`Cleared items cache for wardrobe ${wardrobeName}`);
    return true;
  } catch (error) {
    console.error(`Error clearing items cache for wardrobe ${wardrobeName}:`, error);
    return false;
  }
};

// Function to remove an item from all caches
export const removeItemFromCache = (wardrobeName, itemId) => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;
  
  try {
    // Update items cache for this wardrobe
    const cacheKey = getUserItemsCacheKey(wardrobeName);
    const cachedItems = JSON.parse(localStorage.getItem(cacheKey) || "[]");
    const updatedItems = cachedItems.filter(item => item.id !== itemId);
    localStorage.setItem(cacheKey, JSON.stringify(updatedItems));
    console.log(`Removed item ${itemId} from wardrobe cache ${wardrobeName}`);
    
    // Update recent items cache
    const recentKey = getRecentItemsCacheKey();
    const recentItems = JSON.parse(localStorage.getItem(recentKey) || "[]");
    const updatedRecentItems = recentItems.filter(item => item.id !== itemId);
    localStorage.setItem(recentKey, JSON.stringify(updatedRecentItems));
    console.log(`Removed item ${itemId} from recent items cache`);
    
    // Update total count
    const countKey = getAllItemsCacheKey();
    const currentCount = parseInt(localStorage.getItem(countKey) || "0");
    if (currentCount > 0) {
      localStorage.setItem(countKey, (currentCount - 1).toString());
      console.log(`Updated total count from ${currentCount} to ${currentCount - 1}`);
    }
    
    // Set the invalidation flag for any other components that need to know
    invalidateCountCache();
    
    return true;
  } catch (error) {
    console.error("Error updating cache after item removal:", error);
    return false;
  }
};