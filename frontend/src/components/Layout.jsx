import React from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  PlusSquare, 
  ShoppingBag, 
  Eye, 
  Sparkles, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import "../assets/styles/Home.css";
import { clearUserCache } from "../services/itemsCache";
import { clearWardrobeCache } from "../services/wardrobeCache";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Guest";

  const handleLogout = () => {
    // Clear all cached data for this user
    clearUserCache();
    clearWardrobeCache();
    
    // Remove auth data
    localStorage.removeItem("user_id");
    localStorage.removeItem("name");
    navigate("/");
  };

  // Function to determine if a nav item is active based on the current path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <img src={require("../assets/images/Logo.png")} alt="StyleSync Logo" className="logo-image" />
          </div>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/home" className={`menu-item ${isActive('/home') ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link to="/create-wardrobe" className={`menu-item ${isActive('/create-wardrobe') ? 'active' : ''}`}>
            <PlusSquare size={20} />
            <span>Create Wardrobe</span>
          </Link>
          
          <Link to="/add-item" className={`menu-item ${isActive('/add-item') ? 'active' : ''}`}>
            <ShoppingBag size={20} />
            <span>Add Item</span>
          </Link>
          
          <Link to="/view-wardrobe" className={`menu-item ${isActive('/view-wardrobe') ? 'active' : ''}`}>
            <Eye size={20} />
            <span>View Wardrobe</span>
          </Link>
          
          <Link to="/outfit-recommendation" className={`menu-item ${isActive('/outfit-recommendation') ? 'active' : ''}`}>
            <Sparkles size={20} />
            <span>Outfit Recommendations</span>
          </Link>
          
          <div className="sidebar-divider"></div>
          
          <p className="user-label">USER</p>
          
          <Link to="/profile" className={`menu-item ${isActive('/profile') ? 'active' : ''}`}>
            <User size={20} />
            <span>Profile</span>
          </Link>
          
          <Link to="/settings" className={`menu-item ${isActive('/settings') ? 'active' : ''}`}>
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
      
      {/* Main Content - This is where the routed components will be rendered */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout; 