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
    const [displayItems, setDisplayItems] = useState(false); // New state to control when to display items
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

    // Updated to use a single Lambda endpoint with viewMode parameter
    const fetchWardrobeItems = async (wardrobeName) => {
        if (!wardrobeName) return;
        
        setLoading(true);
        setError('');
        
        try {
            const userId = localStorage.getItem("user_id");
            // Use a single Lambda endpoint and pass the viewMode parameter
            const response = await fetch(`https://fml6ajrze5.execute-api.us-east-1.amazonaws.com/dev/items?userId=${userId}&wardrobe=${wardrobeName}&viewMode=${viewMode}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch wardrobe items");
            }

            const data = await response.json();
            setItems(data);
            setDisplayItems(true); // Show items after successful fetch
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
        setDisplayItems(false); // מסתיר פריטים קודמים בעת בחירת ארון חדש
    };

    // Toggle between image and list view
    const toggleViewMode = () => {
        setViewMode(viewMode === 'images' ? 'list' : 'images');
        setDisplayItems(false); // Hide items when changing view mode
    };

    // Handle View button click
    const handleViewClick = () => {
        if (selectedWardrobe) {
            fetchWardrobeItems(selectedWardrobe.name);
        } else {
            setError("Please select a wardrobe before viewing items");
            setDisplayItems(false);
        }
    };

    return (
        <div className="view-wardrobe-container">
            <Link to="/home" className="back-button">⟵</Link>
            <div className={`view-wardrobe-box ${viewMode === 'list' ? 'list-view' : ''}`}>
                <h2>View Wardrobe</h2>
                
                <div className="view-options">
                    <div className="view-options-row">
                        <div className="dropdown-wrapper">
                            <Dropdown
                                options={wardrobes.length > 0 ? wardrobes.map(w => w.name) : []}
                                label="Wardrobe Name"
                                placeholder="Select a wardrobe..."
                                onSelect={handleWardrobeSelect}
                            />
                        </div>
                        
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
                </div>
                
                {/* View button - always show regardless of wardrobe selection */}
                <div className="view-actions">
                    <button className="view-button small-right" onClick={handleViewClick}>View</button>
                </div>
                
                {loading && <div className="loading">Loading items...</div>}
                {error && <p className="error-message">{error}</p>}
                
                {!loading && !error && displayItems && items.length === 0 && selectedWardrobe && (
                    <p className="no-items-message">No items found in this wardrobe.</p>
                )}
                
                {!loading && !error && displayItems && items.length > 0 && (
                    <div className={`items-container ${viewMode}`}>
                        {viewMode === 'images' ? (
                            // Image view mode
                            items.map(item => (
                                <div key={item.id} className="item-card">
                                    <div className="item-image">
                                        {item.photoUrl ? (
                                            <img src={item.photoUrl} alt={item.itemType} />
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
                                        <th>Style</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.itemType}</td>
                                            <td>{Array.isArray(item.color) ? item.color.join(', ') : 'N/A'}</td>
                                            <td>{Array.isArray(item.weather) ? item.weather.join(', ') : 'N/A'}</td>
                                            <td>{Array.isArray(item.style) ? item.style.join(', ') : 'N/A'}</td>
                                            <td>Door: {item.door}, Shelf: {item.shelf}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewWardrobe;