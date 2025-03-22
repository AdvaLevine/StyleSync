import React from "react";
import "../assets/styles/Home.css";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-container">
      <div className="header-container">
        <button>Log Out</button>
        <h1>Main Menu</h1>
      </div>

      <div className="main-container">
        <h1>Hello &lt;username&gt;!</h1>
        <Link to="/outfit-recommendation"><button>Outfit Recommendation</button></Link>
        <Link to="/view-wardrobe"><button>View Wardrobe</button></Link>
        <Link to="/create-wardrobe"><button>Create Wardrobe</button></Link>
        <Link to="/add-item"><button>Add Item</button></Link>
        <Link to="/settings"><button>Settings</button></Link>
      </div>

      {/*Copyright */}
      <h5>© Made By Adva Levine and Tal Dor</h5>
    </div>
  );
};

export default Home;