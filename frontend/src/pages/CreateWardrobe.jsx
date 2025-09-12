import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MoonLoader from "react-spinners/MoonLoader";
import "../assets/styles/CreateWardrobe.css";  
import { invalidateWardrobeCache } from "../services/wardrobeCache";

const CreateWardrobe = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [numOfDoors, setNumOfDoors] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);
      setIsPending(true);

      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setError("Please log in again – user id missing.");
        setIsPending(false);
        return;
      }

      // Post Request
      try {
        const response = await fetch("https://tj2ssyv083.execute-api.us-east-1.amazonaws.com/dev/", {
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
            // Mark cache as needing update
            invalidateWardrobeCache();
            
            // Show success message instead of alert
            setSuccess(true);
            
            // Redirect after a short delay to show the success message
            setTimeout(() => {
              navigate("/home");
            }, 1500);
        } else {
            setError(returnedData.body);
        }
      } catch (err) {
        setError("Failed to create wardrobe. Please try again.");
      } finally {
        setIsPending(false);
      }
    };
      return (
          <div className="create-wardrobe-container">
              <div className="create-wardrobe-box">
                  <h2>Create Wardrobe</h2>
                  
                  {/* Messages positioned right after the title */}
                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">Wardrobe created successfully!</div>}
                  
                  <form onSubmit={handleSubmit}>
                      <label>Choose Wardrobe Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter wardrobe's name" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)} 
                      />
                      
                      <label>Choose Number of Doors</label>
                      <input 
                        type="number" 
                        placeholder="Number of Doors" 
                        required 
                        min="1" 
                        max="9" 
                        value={numOfDoors}
                        onChange={(e) => {
                          // Just parse the number but don't apply min/max constraints on every keystroke
                          const inputValue = e.target.value === '' ? '' : Number(e.target.value);
                          setNumOfDoors(inputValue);
                        }}
                        // Apply validation on blur instead
                        onBlur={(e) => {
                          const validatedValue = Math.min(9, Math.max(1, Number(e.target.value) || 1));
                          setNumOfDoors(validatedValue);
                        }}
                      />
                      
                      <button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Create Wardrobe"}
                      </button>
                      
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