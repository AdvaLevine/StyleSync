import React from "react";
import "../assets/styles/Home.css";
import { Link } from "react-router-dom";
import { 
  PlusSquare, 
  ShoppingBag, 
  Shirt,
  Calendar,
  Sparkles,
  Trash2
} from "lucide-react";
import { 
  getCachedWardrobes, 
  needsCacheUpdate, 
  updateWardrobeCache,
  isWardrobeFetchInProgress,
  markWardrobeFetchInProgress,
  markWardrobeFetchCompleted
} from "../services/wardrobeCache";
import { 
  getCachedTotalItemsCount, 
  getCachedRecentItems, 
  initializeItemsCache,
  fetchTotalItemsCount,
  needsCountUpdate,
  fetchAndCacheItems,
  updateAllItemsCache
} from "../services/itemsCache";

// Component to fetch and display data without useEffect
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: localStorage.getItem("name") || "Guest",
      wardrobes: [],
      loading: true,
      totalItems: 0,
      recentItems: []
    };
  }
  
  componentDidMount() {
    this.fetchAllData();

    // Add event listener for focus/visibility change to refresh data when user returns to tab
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  componentWillUnmount() {
    // Clean up event listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  // Handle when the user returns to the page
  handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Refresh data when page becomes visible again
      this.refreshRecentItems();
    }
  }
  
  // Refresh just the recent items, useful when returning to home page
  refreshRecentItems = async () => {
    // Get the current count before any cache updates
    const currentCount = this.state.totalItems;
    
    // Update recent items only, don't recalculate total count
    // This prevents count from dropping when returning to page
    await updateAllItemsCache(false); // false = don't update total count
    
    // Get the updated recent items
    const recent = getCachedRecentItems().slice(0, 4);
    
    // Preserve the current count
    this.setState({ 
      recentItems: recent,
      totalItems: currentCount > 0 ? currentCount : getCachedTotalItemsCount()
    });
  }
  
  // Helper method to check if we have any wardrobe caches
  checkForWardrobeCaches = () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`items_cache_${userId}_`)) {
        try {
          const items = JSON.parse(localStorage.getItem(key)) || [];
          if (items.length > 0) {
            return true;
          }
        } catch (e) {
          // Continue checking other caches
        }
      }
    }
    return false;
  }
    fetchAllData = async () => {
    this.setState({ loading: true });
    
    // Always pass true to fetchWardrobes to skip count invalidation
    // we'll handle count updating separately
    await this.fetchWardrobes(true);
    
    // 2. Get items count (only after wardrobe fetch completes)
    let count = getCachedTotalItemsCount();
    
    // Check if we need to update the count
    if (needsCountUpdate() || count === 0) {
      try {
        // Force a fresh fetch of the count to ensure accuracy
        count = await fetchTotalItemsCount(true);
        // Update state immediately with the fresh count
        this.setState({ totalItems: count });
      } catch (error) {
        console.error("Error getting items count:", error);
        // Fallback to cached count if API fails
        count = getCachedTotalItemsCount();
      }
    }
    
    this.setState({ totalItems: count });
    
    // 3. Get recent items from cache
    let recent = getCachedRecentItems().slice(0, 4);
    
    // If no recent items were found but we have wardrobes, fetch items for the first wardrobe
    // to populate the recent items cache
    if (recent.length === 0 && this.state.wardrobes.length > 0) {
      await this.fetchItemsForRecentCache();
      // Get updated recent items
      recent = getCachedRecentItems().slice(0, 4);
    }
    
    this.setState({ 
      recentItems: recent,
      loading: false 
    });
  }
  
  fetchWardrobes = async (skipCountInvalidation = false) => {
    // Check if cache needs update
    if (needsCacheUpdate()) {
      // Check if another component is already fetching wardrobes
      if (isWardrobeFetchInProgress()) {
        const cached = getCachedWardrobes();
        this.setState({ wardrobes: cached });
        return;
      }
      
      // Mark that we're starting a fetch
      markWardrobeFetchInProgress();
      
        try {
          const userId = localStorage.getItem("user_id");
        
          const response = await fetch(`https://o5199uwx89.execute-api.us-east-1.amazonaws.com/dev/wardrobes?userId=${userId}`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch wardrobes");
          }

          const data = await response.json();
        this.setState({ wardrobes: data });
        updateWardrobeCache(data); // This will also clear the fetch in progress flag
        
        // Initialize items cache WITHOUT invalidating the count again if specified
        initializeItemsCache(skipCountInvalidation);
        } catch (error) {
          console.error("Error fetching wardrobes:", error);
          // Fall back to cached data
        const cached = getCachedWardrobes();
        this.setState({ wardrobes: cached });
        // Clear the in-progress flag on error
        markWardrobeFetchCompleted();
        }
      } else {
        // Use cached data
        const cached = getCachedWardrobes();
      this.setState({ wardrobes: cached });
    }
  }
  
  fetchItemsForRecentCache = async () => {
    const { wardrobes } = this.state;
    if (wardrobes.length === 0) return;
    
    try {
      // Get items for the first wardrobe to populate recent items
      const firstWardrobe = wardrobes[0].name;
      
      // This will fetch, cache the items, and update the recent items cache
      await fetchAndCacheItems(firstWardrobe);
      
      // Refresh the recent items in state after cache is updated
      const recentItems = getCachedRecentItems().slice(0, 4); // Ensure we have max 4 items
      
      this.setState({ recentItems });
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }
  
  hasEnoughItemsForOutfits = () => {
    return this.state.totalItems >= 3;
  }
  
  render() {
    const { name, wardrobes, loading, totalItems, recentItems } = this.state;

  return (
    <>
      <div className="welcome-section">
        <h1>Welcome, {name}</h1>
        <p>Organize your wardrobe and discover new outfit ideas</p>
      </div>
      
      <div className="stats-container">
        <div className="stat-card items">
          <div className="stat-content">
            <h3>Total Items</h3>
              <p className="stat-number">{loading ? "..." : totalItems}</p>
          </div>
          <div className="stat-icon">
            <Shirt />
          </div>
        </div>
        
        <div className="stat-card wardrobes">
          <div className="stat-content">
            <h3>Wardrobes</h3>
            <p className="stat-number">{loading ? "..." : wardrobes.length}</p>
          </div>
          <div className="stat-icon">
            <ShoppingBag />
          </div>
        </div>
        
        <div className="stat-card seasons">
          <div className="stat-content">
            <h3>Seasons</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-icon">
            <Calendar />
          </div>
        </div>
        
        <div className="stat-card outfits">
          <div className="stat-content">
            <h3>Outfits</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-icon">
            <Sparkles size={32} /> 
          </div>
        </div>
      </div>
      
      <div className="wardrobes-section">
        <div className="section-header">
          <h2>Your Wardrobes</h2>
          <Link to="/create-wardrobe" className="new-wardrobe-btn">
            <PlusSquare size={16} />
            <span>New Wardrobe</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Loading wardrobes...</div>
        ) : wardrobes.length > 0 ? (
          <div className="wardrobes-scroll-container">
            <div className="wardrobes-scroll">
              {wardrobes.map((wardrobe, index) => (
                <div className="wardrobe-card" key={wardrobe.id || `wardrobe-${index}`}>
                  <button className="delete-button" aria-label="Delete wardrobe">
                    <Trash2 size={16} />
                  </button>
                  <div className="wardrobe-card-header">
                    <h3>{wardrobe.name}</h3>
                  </div>
                  <p className="wardrobe-info">{wardrobe.num_of_doors} Doors</p>
                  <Link to="/view-wardrobe" state={{ wardrobeName: wardrobe.name }} className="view-wardrobe-btn">
                    View Wardrobe
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-wardrobe">
            <div className="empty-icon">
              +
            </div>
            <h3>Create Your First Wardrobe</h3>
            <p>Start organizing your clothes by creating a wardrobe</p>
            <Link to="/create-wardrobe" className="create-wardrobe-btn">
              Create Wardrobe
            </Link>
          </div>
        )}
      </div>
      
      <div className="bottom-sections">
        <div className="recent-items-section">
          <h2>Recent Items</h2>
          {recentItems.length > 0 ? (
            <div className="recent-items-grid-container">
              <div className="recent-items-grid">
                {recentItems.slice(0, 4).map(item => (
                  <div key={item.id} className="recent-item-card">
                    <div className="item-image">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt={item.itemType} />
                      ) : (
                        <div className="placeholder-image">
                          <i className="image-icon">🖼️</i>
                        </div>
                      )}
                    </div>
                    <div className="item-details">
                      <p className="item-type">{item.itemType || "Item"}</p>
                      <p className="item-wardrobe">
                        <span className="wardrobe-label">In:</span> {item.wardrobe || "Unknown wardrobe"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Only show this when there are 0 wardrobes AND 0 items
            wardrobes.length === 0 && totalItems === 0 ? (
          <div className="empty-items">
            <Shirt size={32} />
            <p>No items in your wardrobe yet</p>
            <Link to="/add-item" className="add-first-item-btn">
              Add First Item
            </Link>
          </div>
            ) : (
              <div className="empty-items">
                <Shirt size={32} />
                <p>No recent items to display</p>
              </div>
            )
          )}
        </div>
        
        <div className="suggestions-section">
          <h2>Outfit Suggestions</h2>
            {/* Check if any wardrobe has at least 3 items - we'll need to update state to track this */}
            {this.hasEnoughItemsForOutfits() ? (
              <div className="outfit-suggestions-ready">
                <Sparkles size={48} />
                <h3>✨ Your Outfits Await!</h3>
                <p>Discover amazing outfit combinations from your wardrobe.<br />Let AI style you perfectly!</p>
                <Link to="/outfit-recommendation" className="get-recommendations-btn primary">
                  🎨 Create My Outfits
                </Link>
              </div>
            ) : (
          <div className="empty-suggestions">
            <Sparkles size={48} />
            <h3>🚀 Ready to Get Styled?</h3>
            <p>Add a few more items to unlock personalized outfit recommendations just for you!</p>
            <Link to="/outfit-recommendation" className="get-recommendations-btn">
              💡 Explore Suggestions
            </Link>
          </div>
            )}
        </div>
      </div>
    </>
  );
  }
}

export default Home;