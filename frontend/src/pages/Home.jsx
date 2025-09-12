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
  markWardrobeFetchCompleted,
  removeWardrobeFromCache
} from "../services/wardrobeCache";
import { 
  getCachedTotalItemsCount, 
  getCachedRecentItems, 
  initializeItemsCache,
  fetchTotalItemsCount,
  needsCountUpdate,
  fetchAndCacheItems,
  updateAllItemsCache,
  getCachedItems,
  needsItemsCacheUpdate,
  clearWardrobeItemsCache
} from "../services/itemsCache";
import { useAuth } from "react-oidc-context";
import { useCheckUserLoggedIn } from "../hooks/useCheckUserLoggedIn";

// Component to fetch and display data without useEffect
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: localStorage.getItem("name") || "Guest",
      wardrobes: [],
      loading: true,
      totalItems: 0,
      recentItems: [],
      weather: {
        temperature: null,
        description: null,
        icon: null,
        loading: true,
      },
      location: {
        latitude: null,
        longitude: null,
        loading: true
      },
      calendarEvents: [],
      calendarLoading: true,
      showDeleteWardrobeConfirm: false,
      wardrobeToDelete: null,
      isDeletingWardrobe: false,
      error: '',
      successMessage: '',
    };
  }
  
  componentDidMount() {
    this.fetchAllData();
    this.getCoordinates().then(coords => {
      if (coords) {
        this.fetchWeather(coords.latitude, coords.longitude);
      }
    });
    this.fetchCalendarEvents();
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

  // Get user's location
  getCoordinates = () => {
    const cachedLocation = JSON.parse(localStorage.getItem('location_cache'));
    const today = new Date().toDateString();

    const defaultCoordinates = {
        latitude: 32.0853, // Latitude for Tel Aviv, Israel
        longitude: 34.7818, // Longitude for Tel Aviv, Israel
        date: today
    };

    if (cachedLocation && cachedLocation.date === today) {
        // Use cached location if it's from today
        this.setState({ location: { ...cachedLocation, loading: false } });
        return Promise.resolve({ latitude: cachedLocation.latitude, longitude: cachedLocation.longitude });
    }

    // Return a promise to handle the asynchronous nature of geolocation
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser. Using default coordinates.');
            this.setState({ location: { ...defaultCoordinates, loading: false } });
            // Cache the default location as well
            localStorage.setItem('location_cache', JSON.stringify(defaultCoordinates));
            resolve({ latitude: defaultCoordinates.latitude, longitude: defaultCoordinates.longitude });
            return;
        }

        // The error callback is the key to our fallback
        const errorCallback = (error) => {
            console.error('Error getting location:', error);
            // On error (e.g., user denial), use the default coordinates
            this.setState({ location: { ...defaultCoordinates, loading: false } });
            // Cache the default location as well
            localStorage.setItem('location_cache', JSON.stringify(defaultCoordinates));
            resolve({ latitude: defaultCoordinates.latitude, longitude: defaultCoordinates.longitude });
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { latitude, longitude, date: today };
                localStorage.setItem('location_cache', JSON.stringify(newLocation));
                this.setState({ location: { ...newLocation, loading: false } });
                resolve({ latitude, longitude });
            },
            errorCallback // Use the new error callback with the default
        );
    });
};

  // Get Weather Data
  fetchWeather = async (latitude, longitude) => {
    // Check for today's cached weather data
    const cachedWeather = JSON.parse(localStorage.getItem('weather_cache'));
    const theTimeNow = new Date().getTime();
    const threeHours = 3 * 60 * 60 * 1000 

    // Use cached data if it's less than 3 hours old
    if (cachedWeather && (theTimeNow - cachedWeather.timestamp) < threeHours) {
        this.setState({ weather: { ...cachedWeather, loading: false } });
        return;
    }

    // If cache is missing or outdated, fetch new weather data
    this.setState(prevState => ({ weather: { ...prevState.weather, loading: true } }));

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        const currentData = data.current_weather;

        // Map the weather code to an icon and description
        const weatherCode = currentData.weathercode;
        const { description, icon } = this.getWeatherDescriptionAndIcon(weatherCode);

        const newWeather = {
            temperature: Math.round(currentData.temperature),
            description: description,
            icon: icon,
            date: theTimeNow
        };

        // Cache the new data
        localStorage.setItem('weather_cache', JSON.stringify(newWeather));

        this.setState({ weather: { ...newWeather, loading: false } });

    } catch (error) {
        console.error("Error fetching weather:", error);
        this.setState(prevState => ({ weather: { ...prevState.weather, loading: false } }));
    }
  }

  fetchCalendarEvents = async () => {
    const cachedEvents = JSON.parse(localStorage.getItem('calendar_cache'));
    const today = new Date().toDateString();

    if (cachedEvents && cachedEvents.date === today) {
      this.setState({
            calendarEvents: cachedEvents.events,
            calendarLoading: false,
        });
        return;
    }

    this.setState({ calendarLoading: true });

    const lambdaEndpont = 'https://pn469t7cj5.execute-api.us-east-1.amazonaws.com/dev/googleCalendarHandler';

    try {
      const response = await fetch(lambdaEndpont);
      if (!response.ok) {
        console.log("Calendar API returned non-OK. Please check if your API Key is dated");
        this.setState({ calendarEvents: [], calendarLoading: false });
        return; // gracefully stop
      }
      const data = await response.json();
      // Cache the new data
      const newCache = {
        date: today,
        events: data.events,
      };
      localStorage.setItem('calendar_cache', JSON.stringify(newCache));

      this.setState({
            calendarEvents: data.events,
            calendarLoading: false,
        });
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      this.setState({ calendarLoading: false });
    }
  };

  getWeatherDescriptionAndIcon = (code) => {
    let description = 'N/A';
    let icon = '❓'; // Default icon

    if (code >= 0 && code <= 1) { // Clear sky, mainly clear
        description = 'Clear Sky';
        icon = '☀️';
    } else if (code >= 2 && code <= 3) { // Partly cloudy, overcast
        description = 'Partly Cloudy';
        icon = '☁️';
    } else if (code >= 45 && code <= 48) { // Fog
        description = 'Foggy';
        icon = '🌫️';
    } else if (code >= 51 && code <= 57) { // Drizzle
        description = 'Light Rain';
        icon = '🌧️';
    } else if (code >= 61 && code <= 67) { // Rain
        description = 'Rainy';
        icon = '☔';
    } else if (code >= 71 && code <= 77) { // Snow fall
        description = 'Snowy';
        icon = '🌨️';
    } else if (code >= 95 && code <= 96) { // Thunderstorm
        description = 'Thunderstorm';
        icon = '⛈️';
    }

    return { description, icon };
  };
  
  fetchAllData = async () => {
    this.setState({ loading: true });
    
    // Always pass true to fetchWardrobes to skip count invalidation
    // we'll handle count updating separately
    await this.fetchWardrobes(true);
    
  // 2. Get items count (only after wardrobe fetch completes)
    let count = getCachedTotalItemsCount();
    
    // Only fetch items count from API if:
    // 1. The count is explicitly flagged as needing update (items added/removed), OR
    // 2. Count is 0 AND we have wardrobes (likely first load with items)
    const shouldFetchCount = needsCountUpdate() || 
                             (count === 0 && this.state.wardrobes.length > 0);
    
    if (shouldFetchCount) {
      try {
        // Use forceRefresh=false to allow the function to use its own logic
        count = await fetchTotalItemsCount(false);
        // Update state immediately with the count
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
    // Check if cache needs update based on either:
    // 1. The invalidation flag is true (something changed), or
    // 2. We have never loaded wardrobes before (no cache entry at all)
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
      
        const response = await fetch(`https://vq3ajfwjmh.execute-api.us-east-1.amazonaws.com/dev/wardrobes?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch wardrobes");
        }

        const data = await response.json();
        this.setState({ wardrobes: data });
        
        // This will update the cache AND clear the invalidation flag
        updateWardrobeCache(data);
        
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
      // Use cached data - even if it's an empty array
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

  // Handle delete wardrobe button click
  handleDeleteWardrobeClick = (wardrobe, e) => {
    // Prevent triggering the view wardrobe link
    e && e.stopPropagation();
    e && e.preventDefault();
    
    this.setState({
      showDeleteWardrobeConfirm: true,
      wardrobeToDelete: wardrobe
    });
  };
  
  // Handle cancel delete wardrobe
  handleCancelDeleteWardrobe = () => {
    this.setState({
      showDeleteWardrobeConfirm: false,
      wardrobeToDelete: null
    });
  };
  
  // Handle confirm delete wardrobe
  handleConfirmDeleteWardrobe = async () => {
    const { wardrobeToDelete } = this.state;
    if (!wardrobeToDelete) return;
    
    this.setState({ loading: true, isDeletingWardrobe: true, error: '' });
    
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }
      
      // First, fetch all items in the wardrobe if needed
      let itemsToDelete = [];
      try {
        if (needsItemsCacheUpdate(wardrobeToDelete.name)) {
          console.log(`Fetching items for wardrobe ${wardrobeToDelete.name} before deletion...`);
          itemsToDelete = await fetchAndCacheItems(wardrobeToDelete.name, 'list');
        } else {
          console.log(`Using cached items for wardrobe ${wardrobeToDelete.name} before deletion...`);
          itemsToDelete = getCachedItems(wardrobeToDelete.name);
        }
      } catch (error) {
        console.error("Error fetching items before wardrobe deletion:", error);
        // Continue with wardrobe deletion even if item fetch fails
      }
      
      // Delete all items in the wardrobe
      let failedItems = 0;
      let successCount = 0;
      
      if (itemsToDelete.length > 0) {
        console.log(`Deleting ${itemsToDelete.length} items before wardrobe deletion...`);
        
        for (const item of itemsToDelete) {
          try {
            const response = await fetch("https://mw2ssed9x9.execute-api.us-east-1.amazonaws.com/dev/removeItem", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("idToken")
              },
              body: JSON.stringify({
                user_id: userId,
                item_id: item.id
              })
            });
            
            if (response.ok) {
              successCount++;
            } else {
              failedItems++;
              console.error(`Failed to delete item ${item.id}: HTTP ${response.status}`);
              
              // Add a small delay before the next request on failure
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            failedItems++;
            console.error(`Exception while deleting item ${item.id}:`, error);
            
            // Add a small delay before the next request
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log(`Deleted ${successCount} items; ${failedItems} items failed to delete`);
      }
      
      // Now delete the wardrobe itself
      const response = await fetch("https://ffckrk8ze6.execute-api.us-east-1.amazonaws.com/dev/removeWardrobe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("idToken")
        },
        body: JSON.stringify({
          user_id: userId,
          wardrobe_name: wardrobeToDelete.name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      // Update local cache
      removeWardrobeFromCache(wardrobeToDelete.name);
      clearWardrobeItemsCache(wardrobeToDelete.name);
      
      // Update local state
      const updatedWardrobes = this.state.wardrobes.filter(w => w.name !== wardrobeToDelete.name);
      
      let statusMessage = `Wardrobe "${wardrobeToDelete.name}" deleted successfully.`;
      if (successCount > 0) {
        statusMessage += ` ${successCount} items were also removed.`;
      }
      if (failedItems > 0) {
        statusMessage += ` Note: ${failedItems} items could not be deleted.`;
      }
      
      // Refresh recent items to avoid showing deleted items
      await this.refreshRecentItems();
      
      // Update total items count after deletion
      let newCount = this.state.totalItems - successCount;
      if (newCount < 0) newCount = 0;
      
      this.setState({
        wardrobes: updatedWardrobes,
        totalItems: newCount,
        showDeleteWardrobeConfirm: false,
        wardrobeToDelete: null,
        error: '',
        successMessage: statusMessage
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        this.setState(prevState => {
          // Only clear if the message hasn't changed
          if (prevState.successMessage === statusMessage) {
            return { successMessage: '' };
          }
          return null;
        });
      }, 5000);
      
    } catch (error) {
      this.setState({
        error: `Failed to delete wardrobe: ${error.message}`,
        showDeleteWardrobeConfirm: false,
        wardrobeToDelete: null
      });
    } finally {
      this.setState({ loading: false, isDeletingWardrobe: false });
    }
  };
  
  render() {
    if (this.props.isLoading || !this.props.isAuthenticated) {
      return null;
    }

    const { 
      name, wardrobes, loading, totalItems, recentItems, weather, 
      showDeleteWardrobeConfirm, wardrobeToDelete, isDeletingWardrobe,
      error, successMessage
    } = this.state;

    return (
      <div className="home-container">
        {/* Delete Wardrobe Confirmation Modal */}
        {showDeleteWardrobeConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Wardrobe</h3>
              <p>Are you sure you want to delete the wardrobe "{wardrobeToDelete?.name}"?</p>
              <p>This will also delete all items in this wardrobe. This action cannot be undone.</p>
              <div className="modal-buttons">
                <button 
                  onClick={this.handleCancelDeleteWardrobe} 
                  className="cancel-btn"
                  disabled={isDeletingWardrobe}
                >Cancel</button>
                <button 
                  onClick={this.handleConfirmDeleteWardrobe} 
                  className="delete-btn"
                  disabled={isDeletingWardrobe}
                >{isDeletingWardrobe ? "Deleting..." : "Delete Wardrobe"}</button>
              </div>
            </div>
          </div>
        )}
        
        <div className="header-container">
          <h1>Welcome, {name}</h1>
          <p>Organize your wardrobe and discover new outfit ideas</p>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="home-success-message">{successMessage}</p>}
      
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
              <h3>Today's Calendar</h3>
              <p className="stat-date">{new Date().toLocaleDateString('en-GB')}</p>
              <div className="mini-events">
                {this.state.calendarLoading ? (
                  <div className="mini-event">Loading...</div>
                ) : this.state.calendarEvents.length > 0 ? ( 
                  this.state.calendarEvents.map((event, index) => (
                    <div className="mini-event" key={index}>
                      {new Date(event.start).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })} - {event.summary}
                    </div>
                  ))
                ) : (
                  <div className="mini-event">No events today</div>
                )}
              </div>
            </div>
            <div className="stat-icon">
              <Calendar />
            </div>
          </div>
          
          
          <div className="stat-card weather">
            <div className="stat-content">
              <h3>Today's Weather</h3>
              <p className="stat-number">{weather.loading ? "..." : `${weather.temperature}°C`}</p>
              <p className="weather-desc">{weather.loading ? "Fetching..." : weather.description}</p>
            </div>
            <div className="stat-icon">
              <div className="weather-icon">{weather.loading ? "..." : weather.icon}</div>
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
                    <button 
                      className="delete-button" 
                      onClick={(e) => this.handleDeleteWardrobeClick(wardrobe, e)}
                      aria-label="Delete wardrobe"
                    >
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
            {loading ? (
              <div className="loading-items">
                <div className="loading-spinner"></div>
                <p>Loading your items...</p>
              </div>
            ) : recentItems.length > 0 ? (
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
              <div className="outfit-suggestions-ready">
                  <Sparkles size={48} />
                  <h3>✨ Your Outfits Await!</h3>
                  <p>Discover amazing outfit combinations from your wardrobe.<br />Let AI style you perfectly!</p>
                  <Link to="/outfit-recommendation" className="get-recommendations-btn primary">
                    🎨 Create My Outfits
                  </Link>
                </div>
          </div>
        </div>
      </div>
    );
  }
}

// Wrapper component to provide auth and authentication status
const HomeWithAuth = (props) => {
  const auth = useAuth();
  const { isLoading, isAuthenticated } = useCheckUserLoggedIn(auth);
  
  return <Home {...props} auth={auth} isLoading={isLoading} isAuthenticated={isAuthenticated} />;
};

export default HomeWithAuth;