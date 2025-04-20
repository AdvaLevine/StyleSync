import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../assets/styles/AddItem.css";


const AddItem = () => {
    const navigate = useNavigate();
    const [wardrobes, setWardrobes] = useState([]);
    const [fromDate, setFromDate] = useState({
        wardrobe: "",
        itemType: "",
        color: "",
        weather: "",
        door: "",
        shelf: "",
        photo: null
    });

    useEffect(() => {
        // Fetch the user's wardrobes from the server when the component mounts
        const fetchWardrobes = async () => {
            const userId = localStorage.getItem("user_Id");
            const response = await fetch(`http://localhost:5000/wardrobes/${userId}`);
            const data = await response.json();
            setWardrobes(data);
        };
        fetchWardrobes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
    
        // For color and weather, allow multiple values
        if (name === "color" || name === "weather") {
            setFromDate((prev) => ({
              ...prev,
              [name]: Array.isArray(prev[name])
                ? [...new Set([...prev[name], value])]
                : [value],
            }));
          } else {
            setFromDate((prev) => ({
                ...prev,
                [name]: files ? files[0] : value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem("user_Id");
        if (!userId) {
            alert("Please log in again – user id missing.");
            return;
        }
        const payload = new FormData();
        Object.entries(fromDate).forEach(([key, value]) => {
            payload.append(key, value);
        });
        
        try{
            const res = await fetch("http://localhost:5000/add-item", {
                method: "POST",
                body: payload,
            });

            const result = await res.json();
            if(res.status === 200){
                alert("Item added successfully!");
                navigate("/home");
            }else{
                alert(result.message || "Failed to add item. Please try again.");
            }  
        }catch(err){
            console.error("Failed to add item:", err);
            alert("Could not add item – please try again.");
        }
    };

    const commonOptions = ["Shirt", "Pants", "Dress", "Jacket", "Shoes", "Hat", "Scarf", "Belt", "Socks", "Gloves"];
    const colorOptions = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Orange", "Brown"];
    const weatherOptions = ["Hot", "Cold", "Rainy", "Snow", "Windy", "Sunny", "Cloudy", "Stormy", "Foggy", "Humid"];


    return (
        <div className="add-item-container">
             {/* Back Button */}
                  <Link to="/" className="back-button">⟵</Link>
          <div className="add-item-box">
            <h2>Add Item</h2>
            <form onSubmit={handleSubmit}>
              <label>Choose Wardrobe</label>
              <input
                name="wardrobe"
                list="wardrobeList"
                placeholder="Wardrobe Name"
                onChange={handleInputChange}
                required
              />
              <datalist id="wardrobeList">
                {wardrobes.map((w) => (
                  <option key={w.id} value={w.name} />
                ))}
              </datalist>
    
              <label>Choose Item Type</label>
              <input
                name="itemType"
                list="itemTypeList"
                placeholder="Item Type"
                onChange={handleInputChange}
                required
              />
              <datalist id="itemTypeList">
                {commonOptions.map((item, i) => (
                  <option key={i} value={item} />
                ))}
              </datalist>
    
              <label>Choose Color (You can type multiple)</label>
              <input
                name="color"
                list="colorList"
                placeholder="Color"
                onChange={handleInputChange}
              />
              <datalist id="colorList">
                {colorOptions.map((color, i) => (
                  <option key={i} value={color} />
                ))}
              </datalist>
    
              <label>Weather Type (You can type multiple)</label>
              <input
                name="weather"
                list="weatherList"
                placeholder="Weather"
                onChange={handleInputChange}
              />
              <datalist id="weatherList">
                {weatherOptions.map((weather, i) => (
                  <option key={i} value={weather} />
                ))}
              </datalist>
    
              <label>Choose Door</label>
              <input
                type="number"
                name="door"
                placeholder="Door Number"
                onChange={handleInputChange}
                required
              />
    
              <label>Choose Shelf</label>
              <input
                name="shelf"
                placeholder="Shelf Number / Description"
                onChange={handleInputChange}
                required
              />
    
              <label>Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                name="photo"
                onChange={handleInputChange}
                required
              />
    
              <button type="submit">Add</button>
            </form>
          </div>
        </div>
    );
}
 
export default AddItem;