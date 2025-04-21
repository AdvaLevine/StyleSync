import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../assets/styles/AddItem.css";
import Dropdown from '../components/Dropdown';

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
    const [step, setStep] = useState(1); // State to track the current step

    useEffect(() => {
        // Fetch the user's wardrobes from the server when the component mounts
        const fetchWardrobes = async () => {
            const userId = localStorage.getItem("user_id");
            const response = await fetch(`http://localhost:8000/wardrobe?userId=${userId}`);
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
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Please log in again – user id missing.");
            return;
        }

        // Prepare data as JSON
        const payload = {
            user_id: userId,
            wardrobe: fromDate.wardrobe,
            itemType: fromDate.itemType,
            color: fromDate.color,
            weather: fromDate.weather,
            door: fromDate.door,
            shelf: fromDate.shelf,
            photo: fromDate.photo,
        };

        try {
            const res = await fetch("http://localhost:8000/item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                alert("Item added successfully!");
                navigate("/home");
            } else {
                alert(result.message || "Failed to add item. Please try again.");
            }
        } catch (err) {
            alert("Could not add item – please try again.");
        }
    };

    const commonOptions = ["Shirt", "Pants", "Dress", "Jacket", "Shoes", "Hat", "Scarf", "Belt", "Socks", "Gloves"];
    const colorOptions = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Orange", "Brown"];
    const weatherOptions = ["Hot", "Cold", "Rainy", "Snow", "Windy", "Sunny", "Cloudy", "Stormy", "Foggy", "Humid"];

    return (
        <div className="add-item-container">
            {/* Back Button */}
            <Link to="/home" className="back-button">⟵</Link>
            <div className="add-item-box">
                <h2>Add Item</h2>
                {step === 1 && (
                    <form>
                        <Dropdown
                            options={wardrobes.map((w) => w.name)}
                            label="Choose Wardrobe"
                            placeholder="Start typing wardrobe name..."
                            onSelect={(selected) => handleInputChange({ target: { name: 'wardrobe', value: selected } })}
                        />

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

                        <Dropdown
                            options={commonOptions} 
                            label="Choose Item Type"
                            placeholder="Start typing item type..."
                            onSelect={(selected) => handleInputChange({ target: { name: 'itemType', value: selected } })}
                        />

                        <button type="button" onClick={() => setStep(2)}>Next</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit}>
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

                        <label>Upload Photo</label>
                        <input
                            type="file"
                            accept="image/*"
                            name="photo"
                            onChange={handleInputChange}
                            required
                        />

                        <button type="button" onClick={() => setStep(1)}>Back</button>
                        <button type="submit">Add</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddItem;