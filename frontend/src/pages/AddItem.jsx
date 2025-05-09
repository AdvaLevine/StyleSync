import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../assets/styles/AddItem.css";
import Dropdown from '../components/Dropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const AddItem = () => {
    const navigate = useNavigate();
    const [wardrobes, setWardrobes] = useState([]);
    const [selectedWardrobe, setSelectedWardrobe] = useState(null); // Track the selected wardrobe
    const [errorMessage, setErrorMessage] = useState(""); // Track error messages
    const [fromDate, setFromDate] = useState({
        wardrobe: "",
        itemType: "",
        color: "",
        weather: "",
        door: "",
        shelf: "",
        photo: null,
    });
    const [step, setStep] = useState(1);

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

        // Validate the door field
        if (name === "door" && selectedWardrobe) {
            const maxDoors = selectedWardrobe.num_of_doors;
            if (value < 1 || value > maxDoors) {
                setErrorMessage(`Please enter a door number between 1 and ${maxDoors}.`);
                setFromDate((prev) => ({
                    ...prev,
                    door: "", // Clear the door field
                }));
                return;
            } else {
                setErrorMessage(""); // Clear the error message if valid
            }
        }

        // Update the state for other fields
        setFromDate((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleWardrobeSelect = (wardrobeName) => {
        const wardrobe = wardrobes.find((w) => w.name === wardrobeName);

        if (!wardrobeName) {
            // If no wardrobe is selected, reset all dependent fields
            setSelectedWardrobe(null);
            setFromDate((prev) => ({
                ...prev,
                wardrobe: "",
                door: "", // Clear the door field
                shelf: "", // Clear the shelf field
                itemType: "", // Clear the item type field
            }));
        } else {
            // If a wardrobe is selected, update the state
            setSelectedWardrobe(wardrobe);
            setFromDate((prev) => ({
                ...prev,
                wardrobe: wardrobeName,
                door: "", // Clear the door field
                shelf: "", // Clear the shelf field
                itemType: "", // Clear the item type field
            }));
        }

        setErrorMessage(""); // Clear any existing error messages
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Please log in again – user id missing.");
            return;
        }

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
            <Link to="/home" className="back-button">⟵</Link>
            <div className="add-item-box">
                <h2>Add Item</h2>
                {step === 1 && (
                    <form>
                        <Dropdown
                            options={wardrobes.map((w) => w.name)}
                            label="Choose Wardrobe"
                            placeholder="Start typing wardrobe name..."
                            onSelect={handleWardrobeSelect}
                        />

                        <label>Choose Door</label>
                        <input
                            type="number"
                            name="door"
                            placeholder="Door Number"
                            min="1"
                            max={selectedWardrobe ? selectedWardrobe.num_of_doors : ""}
                            value={fromDate.door}
                            onChange={handleInputChange}
                            disabled={!fromDate.wardrobe} /* Disable if no wardrobe is selected */
                            required
                        />
                        {errorMessage && <p className="error-message">{errorMessage}</p>}

                        <label>Choose Shelf</label>
                        <input
                            type="number"
                            name="shelf"
                            placeholder="Shelf Number"
                            min="1"
                            value={fromDate.shelf}
                            onChange={handleInputChange}
                            disabled={!fromDate.door} /* Disable if no door is selected */
                            required
                        />

                        <MultiSelectDropdown
                            options={commonOptions}
                            label="Choose Item Type"
                            placeholder="Start typing item type..."
                            onSelect={(selected) => handleInputChange({ target: { name: 'itemType', value: selected } })}
                            disabled={!fromDate.door} /* Disable if no door is selected */
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