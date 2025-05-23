import React from "react";
import "../assets/styles/Home.css";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusSquare, 
  ShoppingBag, 
  Eye, 
  Sparkles, 
  Settings, 
  LogOut,
  User,
  Shirt,
  Calendar,
  ShoppingCart
} from "lucide-react";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const name = location.state?.name || localStorage.getItem("name") || "Guest";

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("name");
    navigate("/");
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <ShoppingBag className="logo-icon" />
            <span>StyleSync</span>
          </div>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/home" className="menu-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link to="/create-wardrobe" className="menu-item">
            <PlusSquare size={20} />
            <span>Create Wardrobe</span>
          </Link>
          
          <Link to="/add-item" className="menu-item">
            <ShoppingBag size={20} />
            <span>Add Item</span>
          </Link>
          
          <Link to="/view-wardrobe" className="menu-item">
            <Eye size={20} />
            <span>View Wardrobe</span>
          </Link>
          
          <Link to="/outfit-recommendation" className="menu-item">
            <Sparkles size={20} />
            <span>Outfit Recommendations</span>
          </Link>
          
          <div className="sidebar-divider"></div>
          
          <p className="user-label">USER</p>
          
          <Link to="/profile" className="menu-item">
            <User size={20} />
            <span>Profile</span>
          </Link>
          
          <Link to="/settings" className="menu-item">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
        
        <div className="sidebar-divider"></div>
        
        <div className="user-profile">
          <div className="user-avatar">
            <User size={24} />
          </div>
          <div className="user-info">
            <p className="user-name">{name}</p>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
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
      </div>
    </div>
  );
};

export default Home;