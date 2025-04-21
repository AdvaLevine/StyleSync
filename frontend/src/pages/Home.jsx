import React from "react";
import "../assets/styles/Home.css";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';

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
    <div className="home-container">
      <div className="header-container">
        <button onClick={handleLogout}>Log Out</button>
        <h1>Main Menu</h1>
      </div>

      <div className="main-container">
        <h1>{"Hello " + name}</h1>
        <Link to="/create-wardrobe"><button>Create Wardrobe</button></Link>
        <Link to="/add-item"><button>Add Item</button></Link>
        <Link to="/view-wardrobe"><button>View Wardrobe</button></Link>
        <Link to="/outfit-recommendation"><button>Outfit Recommendation</button></Link>        
        <Link to="/settings"><button>Settings</button></Link>
      </div>
      {/* Footer */}
      <footer className="footer">
        <h5>© Made By Adva Levine and Tal Dor</h5>
      </footer>
    </div>
  );
};

export default Home;