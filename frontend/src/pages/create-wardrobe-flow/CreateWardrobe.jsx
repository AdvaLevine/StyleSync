import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoonLoader from "react-spinners/MoonLoader";
import "../../assets/styles/CreateWardrobe.css";  

const CreateWardrobe = () => {
  const navigate = useNavigate();
  const [name, setName] = useState();
  const [numOfDoors, setNumOfDoors] = useState(0);
  const [error, setError] = useState();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      setIsPending(true);

      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setError("Please log in again – user id missing.");
        return;
      }

      // Post Request
      try {
        const response = await fetch("https://dja34wd6j7.execute-api.us-east-1.amazonaws.com/dev/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            num_of_doors: numOfDoors,
            name                        
          })
        });
        
        const returnedData = await response.json();

        if (returnedData.statusCode === 201) {
            alert("Wardrobe created successfully!");
            navigate("/home");
        } else {
            setError(returnedData.body)
        }
      } catch (err) {
        setError("Failed to create wardrobe");
      } finally {
        setIsPending(false);
      }
    };
      return (
          <div className="create-wardrobe-container">
              <div className="create-wardrobe-box">
                  <h2>Create Wardrobe</h2>
                  <form onSubmit={handleSubmit}>
                      <label>Choose Wardrobe Name</label>
                      <input type="text" placeholder="Enter wardrobe's name" required onChange={(e) => setName(e.target.value)} />
                      <label>Choose Number of Doors</label>
                      <input type="number" placeholder="Number of Doors" required min="1" max="9" onChange={(e) => setNumOfDoors(Math.min(9, Math.max(1, Number(e.target.value))))} />
                      <button type="submit">Create</button>
                      
                      {error && <p className="error-message">{error}</p>}
                      {/* Loader Container */}
                      {isPending && (
                        <div className="loader-container">
                          <MoonLoader 
                            size={30} 
                            speedMultiplier={0.7} 
                            color="#36d7b7"
                          />
                        </div>
                      )}
                  </form>
              </div>
          </div>
      );
}

export default CreateWardrobe;