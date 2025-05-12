import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Dropdown from '../components/Dropdown';
import '../assets/styles/ViewWardrobe.css';

const ViewWardrobe = () => {
    const [wardrobes, setWardrobes] = useState([]);
    const [selectedWardrobe, setSelectedWardrobe] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('images'); // 'images' or 'list'
    const isFirstRender = useRef(true);

    // Fetch wardrobes on component mount
    const fetchWardrobes = async () => {
        try {
            const userId = localStorage.getItem("user_id");
            const response = await fetch(`https://o5199uwx89.execute-api.us-east-1.amazonaws.com/dev/wardrobes?userId=${userId}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch wardrobes");
            }

            const data = await response.json();
            setWardrobes(data);
        } catch (error) {
            setError("Error fetching wardrobes: " + error.message);
        }
    };

    // Fetch items for the selected wardrobe
    const fetchWardrobeItems = async (wardrobeName) => {
        if (!wardrobeName) return;
        
        setLoading(true);
        setError('');
        
        try {
            const userId = localStorage.getItem("user_id");
            //fetch items by wardrobe name todo
            const response = await fetch(`https://ul2bdgg3g9.execute-api.us-east-1.amazonaws.com/dev/items?userId=${userId}&wardrobe=${wardrobeName}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch wardrobe items");
            }

            const data = await response.json();
            setItems(data);
        } catch (error) {
            setError("Error fetching items: " + error.message);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch of wardrobes- check the api requests
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            fetchWardrobes();
        }
    }, []);

    // Handle wardrobe selection
    const handleWardrobeSelect = (wardrobeName) => {
        const wardrobe = wardrobes.find(w => w.name === wardrobeName);
        setSelectedWardrobe(wardrobe);
        fetchWardrobeItems(wardrobeName);
    };

    // Toggle between image and list view
    const toggleViewMode = () => {
        setViewMode(viewMode === 'images' ? 'list' : 'images');
    };

    return (
        <div className="view-wardrobe-container">
            <Link to="/home" className="back-button">⟵</Link>
            <div className="view-wardrobe-box">
                <h2>View Wardrobe</h2>
                
                <div className="view-options">
                    <Dropdown
                        options={wardrobes.length > 0 ? wardrobes.map(w => w.name) : []}
                        label="Choose Wardrobe"
                        placeholder="Select a wardrobe..."
                        onSelect={handleWardrobeSelect}
                    />
                    
                    <div className="view-mode-toggle">
                        <label>
                            <input
                                type="checkbox"
                                checked={viewMode === 'list'}
                                onChange={toggleViewMode}
                            />
                            By Text
                        </label>
                    </div>
                </div>
                
                {loading && <div className="loading">Loading items...</div>}
                {error && <p className="error-message">{error}</p>}
                
                {!loading && !error && items.length === 0 && selectedWardrobe && (
                    <p className="no-items-message">No items found in this wardrobe.</p>
                )}
                
                {!loading && !error && items.length > 0 && (
                    <div className={`items-container ${viewMode}`}>
                        {viewMode === 'images' ? (
                            // Image view mode
                            items.map(item => (
                                <div key={item.id} className="item-card">
                                    <div className="item-image">
                                        {item.photo ? (
                                            <img src={item.photo} alt={item.itemType} />
                                        ) : (
                                            <div className="placeholder-image">
                                                <i className="image-icon">🖼️</i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-details">
                                        <p>{item.itemType}</p>
                                        <p>Door: {item.door}, Shelf: {item.shelf}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // List view mode
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Color</th>
                                        <th>Weather</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.itemType}</td>
                                            <td>{item.color.join(', ')}</td>
                                            <td>{item.weather.join(', ')}</td>
                                            <td>Door: {item.door}, Shelf: {item.shelf}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                
                {selectedWardrobe && items.length > 0 && (
                    <div className="view-actions">
                        <button className="view-button">View</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewWardrobe;