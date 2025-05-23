import React, { useState, useEffect } from "react";
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
import { getCachedWardrobes, needsCacheUpdate, updateWardrobeCache } from "../services/wardrobeCache";

const Home = () => {
  const name = localStorage.getItem("name") || "Guest";
  const [wardrobes, setWardrobes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use useEffect instead of ref to ensure it runs once when component mounts
  useEffect(() => {
    const fetchWardrobes = async () => {
      setLoading(true);
      
      // Force fetch if cache needs update or is empty
      if (needsCacheUpdate()) {
        try {
          const userId = localStorage.getItem("user_id");
          const response = await fetch(`https://o5199uwx89.execute-api.us-east-1.amazonaws.com/dev/wardrobes?userId=${userId}`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch wardrobes");
          }

          const data = await response.json();
          console.log("Fetched wardrobes:", data);
          setWardrobes(data);
          updateWardrobeCache(data);
        } catch (error) {
          console.error("Error fetching wardrobes:", error);
          // Fall back to cached data
          setWardrobes(getCachedWardrobes());
        }
      } else {
        // Use cached data
        const cached = getCachedWardrobes();
        console.log("Using cached wardrobes:", cached);
        setWardrobes(cached);
      }
      
      setLoading(false);
    };
    
    fetchWardrobes();
  }, []); // Empty dependency array ensures this runs once on mount

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
            <p className="stat-number">0</p>
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
          <div className="empty-items">
            <Shirt size={32} />
            <p>No items in your wardrobe yet</p>
            <Link to="/add-item" className="add-first-item-btn">
              Add First Item
            </Link>
          </div>
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
};

export default Home;