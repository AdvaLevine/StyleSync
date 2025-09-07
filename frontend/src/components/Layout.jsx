import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
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
import { useAuth } from "react-oidc-context"; // הוספת ייבוא לאותנטיקציה

const Layout = () => {
  const location = useLocation();
  const name = localStorage.getItem("name") || "Guest";
  const auth = useAuth(); // הוספת שימוש ב-auth

  if (!auth.isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    const darkModeFlag = localStorage.getItem("darkMode");
    // Clear all cached data for this user
    clearUserCache();
    clearWardrobeCache();
    localStorage.clear();

    if (darkModeFlag) {
      localStorage.setItem("darkMode", "true");
    }
    auth.signoutRedirect({
        extraQueryParams: {
          client_id: "6jt8p3s82dcj78eomqpra1qo0i",
          //logout_uri: "https://main.d1qreohr4migr5.amplifyapp.com/login"
          logout_uri: "https://us-east-1lvylnwjnh.auth.us-east-1.amazoncognito.com/login?client_id=6jt8p3s82dcj78eomqpra1qo0i&response_type=code&scope=email+openid&redirect_uri=http://localhost:3000/login"
        }
      });
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