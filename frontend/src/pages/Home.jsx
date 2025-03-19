import React from "react";
import "../assets/styles/Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="header-container">
        <button>Log Out</button>
        <h1>Main Menu</h1>
      </div>

      <div className="main-container">
        <h1>Hello &lt;username&gt;!</h1>
        <button>Outfit Recommendation</button>
        <button>View Wardrobe</button>
        <button>Create Wardrobe</button>
        <button>Add Item</button>
        <button>Settings</button>
      </div>

      {/*Copyright */}
      <h5>© Made By Adva Levine and Tal Dor</h5>
    </div>
  );
};

export default Home;