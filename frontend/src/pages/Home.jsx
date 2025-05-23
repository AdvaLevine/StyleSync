import React from "react";
import "../assets/styles/Home.css";
import { Link } from "react-router-dom";
import { 
  PlusSquare, 
  ShoppingBag, 
  Shirt,
  Calendar,
  ShoppingCart,
  Sparkles
} from "lucide-react";

const Home = () => {
  const name = localStorage.getItem("name") || "Guest";

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
            <p className="stat-number">0</p>
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
            <ShoppingCart />
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
        
        <div className="empty-wardrobe">
          <div className="empty-icon">
            <PlusSquare size={32} />
          </div>
          <h3>Create Your First Wardrobe</h3>
          <p>Start organizing your clothes by creating a wardrobe</p>
          <Link to="/create-wardrobe" className="create-wardrobe-btn">
            Create Wardrobe
          </Link>
        </div>
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