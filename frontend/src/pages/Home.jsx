import React from "react";
import "../assets/styles/Home.css";
import { Link } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { useAuth } from "react-oidc-context";
import { useCheckUserLoggedIn } from "../hooks/useCheckUserLoggedIn";

const Home = () => {
  const auth = useAuth();
  const location = useLocation();
  const name = location.state?.name || localStorage.getItem("name") || "Guest";

  const handleLogout = () => {
  localStorage.clear();
  auth.signoutRedirect({
    extraQueryParams: {
      client_id:  "6jt8p3s82dcj78eomqpra1qo0i",
      logout_uri: "http://localhost:3000/login"
    }
    });
  };

  const { isLoading, isAuthenticated } = useCheckUserLoggedIn(auth);

  if (isLoading || !isAuthenticated) {
    return null;
  } else {
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
  }
};

export default Home;