import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../assets/styles/CreateWardrobe.css";  

const CreateWardrobe = () => {
    const navigate = useNavigate();
    const [name, setName] = useState();
    const [numOfDoors, setNumOfDoors] = useState(0);
    
const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Please log in again – user id missing.");
      return;
    }
    
    // Post Request
    try {
      await fetch("https://qo8bgja0h3.execute-api.us-east-1.amazonaws.com/create-wardrobe/dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          num_of_doors: numOfDoors,
          name                        
        })
      });
  
      alert("Wardrobe created successfully!");
      navigate("/home");
    } catch (err) {
      console.error("Failed to create wardrobe:", err);
      alert("Could not create wardrobe – please try again.");
    }
  };
  

    return (
        <div className="create-wardrobe-container">
            <div className="create-wardrobe-box">
              {/* Back Button */}
              <Link to="/home" className="back-button">⟵</Link>
                <h2>Create Wardrobe</h2>
                <form onSubmit={handleSubmit}>
                    <label>Choose Wardrobe Name</label>
                    <input type="text" placeholder="Enter wardrobe's name" required min="1" max="9" onChange={(e) => setName(e.target.value)}/>

                    <label>Choose Number of Doors</label>
                    <input type="text" placeholder="Number of Doors" required onChange={(e) => {
                        const value = Math.min(9, Math.max(1, Number(e.target.value)));
                        setNumOfDoors(value);
                    }}/>


                    <button type="submit">Create</button>
                </form>
            </div>
        </div>
    );
}

export default CreateWardrobe;