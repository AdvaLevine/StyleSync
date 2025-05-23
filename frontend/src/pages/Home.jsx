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
  needsCountUpdate
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
  }
  
  fetchAllData = async () => {
    this.setState({ loading: true });
    
    console.log("Home.fetchAllData: Starting data fetch");
    
    // Store whether we'll need to fetch the count, but don't start fetching yet
    const shouldFetchCount = needsCountUpdate();
    console.log("Home.fetchAllData: shouldFetchCount =", shouldFetchCount);
    
    // 1. Fetch and update wardrobes first (this is async)
    await this.fetchWardrobes(shouldFetchCount);
    console.log("Home.fetchAllData: Wardrobe fetch completed, now handling count");
    
    // 2. Get items count (only after wardrobe fetch completes)
    let count = getCachedTotalItemsCount();
    if (shouldFetchCount && needsCountUpdate()) {
      // Double-check that it still needs updating after wardrobe fetch
      console.log("Home.fetchAllData: About to fetch count (after wardrobe fetch)");
      try {
        count = await fetchTotalItemsCount(false);
      } catch (error) {
        console.error("Error getting items count:", error);
      }
    } else {
      console.log("Home.fetchAllData: Using cached count:", count);
    }
    
    this.setState({ totalItems: count });
    
    // 3. Get recent items from cache
    const recent = getCachedRecentItems();
    this.setState({ 
      recentItems: recent,
      loading: false 
    });
    
    console.log("Home.fetchAllData: Completed all data fetching");
  }
  
  fetchWardrobes = async (skipCountInvalidation = false) => {
    console.log("Home.fetchWardrobes: Starting with skipCountInvalidation =", skipCountInvalidation);
    
    // Check if cache needs update
    if (needsCacheUpdate()) {
      console.log("Home.fetchWardrobes: Cache needs update");
      
      // Check if another component is already fetching wardrobes
      if (isWardrobeFetchInProgress()) {
        console.log("Home.fetchWardrobes: Fetch already in progress, using cached data");
        const cached = getCachedWardrobes();
        this.setState({ wardrobes: cached });
        return;
      }
      
      // Mark that we're starting a fetch
      markWardrobeFetchInProgress();
      console.log("Home.fetchWardrobes: Marked fetch in progress");
      
      try {
        const userId = localStorage.getItem("user_id");
        console.log("Home.fetchWardrobes: Fetching wardrobes for userId:", userId);
        
        const response = await fetch(`https://o5199uwx89.execute-api.us-east-1.amazonaws.com/dev/wardrobes?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch wardrobes");
        }

        const data = await response.json();
        console.log("Home.fetchWardrobes: Fetched wardrobes:", data.length);
        this.setState({ wardrobes: data });
        updateWardrobeCache(data); // This will also clear the fetch in progress flag
        console.log("Home.fetchWardrobes: Updated wardrobe cache");
        
        // Initialize items cache WITHOUT invalidating the count again if specified
        console.log("Home.fetchWardrobes: Initializing items cache with skipCountInvalidation =", skipCountInvalidation);
        initializeItemsCache(skipCountInvalidation);
      } catch (error) {
        console.error("Home.fetchWardrobes: Error fetching wardrobes:", error);
        // Fall back to cached data
        const cached = getCachedWardrobes();
        this.setState({ wardrobes: cached });
        // Clear the in-progress flag on error
        markWardrobeFetchCompleted();
        console.log("Home.fetchWardrobes: Marked fetch completed (after error)");
      }
    } else {
      // Use cached data
      const cached = getCachedWardrobes();
      console.log("Home.fetchWardrobes: Using cached wardrobes:", cached.length);
      this.setState({ wardrobes: cached });
    }
    
    console.log("Home.fetchWardrobes: Completed");
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
              <div className="recent-items-grid">
                {recentItems.map(item => (
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
                      <p>{item.itemType}</p>
                      <p>In: {item.wardrobe}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-items">
                <Shirt size={32} />
                <p>No items in your wardrobe yet</p>
                <Link to="/add-item" className="add-first-item-btn">
                  Add First Item
                </Link>
              </div>
            )}
          </div>
          
          <div className="suggestions-section">
            <h2>Outfit Suggestions</h2>
            <div className="empty-suggestions">
              <Sparkles size={32} />
              <p>Add more items to get outfit suggestions</p>
              <Link to="/outfit-recommendation" className="get-recommendations-btn">
                Get Recommendations
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Home;