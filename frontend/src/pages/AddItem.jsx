import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../assets/styles/AddItem.css";
import Dropdown from '../components/Dropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const AddItem = () => {
    const navigate = useNavigate();
    const [wardrobes, setWardrobes] = useState([]);
    const [selectedWardrobe, setSelectedWardrobe] = useState(null); 
    const [errorMessage, setErrorMessage] = useState("");
    const [formError, setFormError] = useState("");
    const [formErrorStep2, setFormErrorStep2] = useState("");
    const isFirstRender = useRef(true);
    const [fromDate, setFromDate] = useState({
        wardrobe: "",
        itemType: "",
        color: [],
        weather: [],
        door: "",
        shelf: "",
        photo: null,
    });
    const [step, setStep] = useState(1);

    const fetchWardrobes = async () => {
        const userId = localStorage.getItem("user_id");
        const response = await fetch(`https://o5199uwx89.execute-api.us-east-1.amazonaws.com/dev/wardrobes?userId=${userId}`);
        
        if (!response.ok) {
            console.error("Failed to fetch wardrobes");
            return; 
        }

        const data = await response.json();
        setWardrobes(data);
    };

    if (isFirstRender.current) {
        isFirstRender.current = false;
        fetchWardrobes();
    }

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "door" && selectedWardrobe) {
            const maxDoors = selectedWardrobe.num_of_doors;
            if (value < 1 || value > maxDoors) {
                setErrorMessage(`Please enter a door number between 1 and ${maxDoors}.`);
                setFromDate((prev) => ({
                    ...prev,
                    door: "", 
                }));
                return;
            } else {
                setErrorMessage(""); 
            }
        }

        setFromDate((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleWardrobeSelect = (wardrobeName) => {
        const wardrobe = wardrobes.find((w) => w.name === wardrobeName);

        if (!wardrobeName) {
            setSelectedWardrobe(null);
            setFromDate((prev) => ({
                ...prev,
                wardrobe: "",
                door: "", 
                shelf: "", 
                itemType: "", 
            }));
        } else {
            // Check if this is the same wardrobe that was already selected
            const isSameWardrobe = fromDate.wardrobe === wardrobeName;

            setSelectedWardrobe(wardrobe);
            
            if (isSameWardrobe) {
                // If it's the same wardrobe, just update the wardrobe name but keep other values
                setFromDate((prev) => ({
                    ...prev,
                    wardrobe: wardrobeName,
                }));
            } else {
                // If it's a different wardrobe, reset the dependent fields
                setFromDate((prev) => ({
                    ...prev,
                    wardrobe: wardrobeName,
                    door: "", 
                    shelf: "", 
                    itemType: "", 
                }));
            }
        }

        setErrorMessage(""); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate step 2 fields
        if (!fromDate.color || !Array.isArray(fromDate.color) || fromDate.color.length === 0) {
            setFormErrorStep2("Please choose at least one color");
            return;
        }
        
        if (!fromDate.weather || !Array.isArray(fromDate.weather) || fromDate.weather.length === 0) {
            setFormErrorStep2("Please choose at least one weather type");
            return;
        }
        
        if (!fromDate.photo) {
            setFormErrorStep2("Please upload a photo");
            return;
        }
        
        setFormErrorStep2("");
        
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Please log in again – user id missing.");
            return;
        }

        const payload = {
            user_id: userId,
            wardrobe: fromDate.wardrobe,
            itemType: Array.isArray(fromDate.itemType) ? fromDate.itemType[0] : fromDate.itemType,
            color: fromDate.color,
            weather: fromDate.weather,
            door: fromDate.door,
            shelf: fromDate.shelf
        };

        try {
            console.log('Sending payload:', payload);
            const res = await fetch("https://ul2bdgg3g9.execute-api.us-east-1.amazonaws.com/dev/item", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("idToken") // Add authorization header if needed
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('API Error:', {
                    status: res.status,
                    statusText: res.statusText,
                    errorData
                });
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            }

            const result = await res.json();
            console.log('Success response:', result);
            alert("Item added successfully!");
            navigate("/home");
        } catch (err) {
            console.error('Error details:', err);
            alert(`Could not add item: ${err.message}`);
        }
    };

    const commonOptions = ["Shirt", "Pants", "Dress", "Jacket", "Shoes", "Hat", "Scarf", "Belt", "Socks", "Gloves"];
    const colorOptions = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Orange", "Brown"];
    const weatherOptions = ["Hot", "Cold", "Rainy", "Snow", "Windy", "Sunny", "Cloudy", "Stormy", "Foggy", "Humid"];

    const validateStep1 = () => {
        if (!fromDate.wardrobe) {
            setFormError("Please choose a wardrobe");
            return false;
        }
        if (!fromDate.door) {
            setFormError("Please enter a door number");
            return false;
        }
        if (!fromDate.shelf) {
            setFormError("Please enter a shelf number");
            return false;
        }
        if (!fromDate.itemType) {
            setFormError("Please choose an item type");
            return false;
        }
        
        setFormError("");
        return true;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    return (
        <div className="add-item-container">
            <Link to="/home" className="back-button">⟵</Link>
            <div className="add-item-box">
                <h2>Add Item</h2>
                {step === 1 && (
                    <form>
                        <Dropdown
                            options={wardrobes.length > 0 ? wardrobes.map((w) => w.name) : []} 
                            label="Choose Wardrobe"
                            placeholder="Start typing wardrobe name..."
                            onSelect={handleWardrobeSelect}
                            initialValue={fromDate.wardrobe}
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
                            disabled={!fromDate.wardrobe}
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
                            disabled={!fromDate.door} 
                            required
                        />

                        <Dropdown
                            options={commonOptions}
                            label="Choose Item Type"
                            placeholder="Start typing item type..."
                            onSelect={(selected) => handleInputChange({ target: { name: 'itemType', value: selected } })}
                            disabled={!fromDate.door} 
                            initialValue={fromDate.itemType}
                        />

                        {formError && <p className="error-message">{formError}</p>}
                        <button type="button" onClick={handleNextStep}>Next</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        {fromDate.itemType && (
                            <>
                                <MultiSelectDropdown
                                    options={colorOptions}
                                    label="Choose Color"
                                    placeholder="Start typing color..."
                                    onSelect={(selected) => handleInputChange({ target: { name: 'color', value: selected } })}
                                    initialSelectedOptions={fromDate.color}
                                />

                                <MultiSelectDropdown
                                    options={weatherOptions}
                                    label="Choose Weather Type"
                                    placeholder="Start typing weather..."
                                    onSelect={(selected) => handleInputChange({ target: { name: 'weather', value: selected } })}
                                    initialSelectedOptions={fromDate.weather}
                                />

                                <label>Upload Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    name="photo"
                                    onChange={handleInputChange}
                                />
                            </>
                        )}
                        
                        {formErrorStep2 && <p className="error-message">{formErrorStep2}</p>}

                        <div className="buttons-container">
                            <button 
                                type="button" 
                                className="back-btn" 
                                onClick={() => {
                                    setStep(1);
                                }}
                            >
                                Back
                            </button>
                            <button type="submit" className="add-btn">Add</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddItem;