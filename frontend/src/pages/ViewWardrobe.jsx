import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Dropdown from '../components/Dropdown';
import '../assets/styles/ViewWardrobe.css';
import { getCachedWardrobes } from '../services/wardrobeCache';
import { getCachedItems, fetchAndCacheItems, needsItemsCacheUpdate, removeItemFromCache } from '../services/itemsCache';
import { Shirt, Trash2 } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { useCheckUserLoggedIn } from "../hooks/useCheckUserLoggedIn";

class ViewWardrobe extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            wardrobes: [],
            selectedWardrobe: null,
            items: [],
            loading: false,
            error: '',
            viewMode: 'images', // 'images' or 'list'
            displayItems: false, // New state to control when to display items
            hasWardrobes: true, // Track if user has any wardrobes
            showConfirmModal: false, // For delete confirmation
            itemToDelete: null, // Item to be deleted
            successMessage: '' // Success message after deletion
        };
        
        this.navigate = props.navigate;
        this.location = props.location;
    }
    
    componentDidMount() {
        // Load wardrobes from cache with better error handling
        const cached = getCachedWardrobes();
        if (cached && cached.length > 0) {
            // Initial state setup
            const newState = {
                wardrobes: cached,
                hasWardrobes: true
            };
            
            // Check if a wardrobe name was passed in the location state
            const passedWardrobeName = this.location.state?.wardrobeName;
            if (passedWardrobeName) {
                const wardrobe = cached.find(w => w.name === passedWardrobeName);
                if (wardrobe) {
                    newState.selectedWardrobe = wardrobe;
                    // No automatic fetch here - user will need to click View
                }
            }
            
            this.setState(newState);
        } else {
            // User has no wardrobes, show the "Create Wardrobe First" screen
            this.setState({ hasWardrobes: false });
        }
    }
    
    fetchWardrobeItems = async (wardrobeName) => {
        if (!wardrobeName) return;
        
        this.setState({
            loading: true,
            error: ''
        });
        
        try {
            // ALWAYS check if we need to update the cache
            if (needsItemsCacheUpdate(wardrobeName)) {
                console.log(`Cache needs update for wardrobe ${wardrobeName}, fetching fresh data...`);
                // Fetch from API and update cache
                const data = await fetchAndCacheItems(wardrobeName, this.state.viewMode);
                this.setState({ items: data });
            } else {
                console.log(`Using cached data for wardrobe ${wardrobeName}`);
                // Use cached data
                const cachedItems = getCachedItems(wardrobeName);
                this.setState({ items: cachedItems });
            }
            
            this.setState({ displayItems: true });
        } catch (error) {
            this.setState({
                error: "Error fetching items: " + error.message,
                items: []
            });
        } finally {
            this.setState({ loading: false });
        }
    }

    // Handle wardrobe selection
    handleWardrobeSelect = (wardrobeName) => {
        const wardrobe = this.state.wardrobes.find(w => w.name === wardrobeName);
        this.setState({
            selectedWardrobe: wardrobe,
            displayItems: false // מסתיר פריטים קודמים בעת בחירת ארון חדש
        });
    };

    // Toggle between image and list view
    toggleViewMode = () => {
        this.setState(prevState => ({
            viewMode: prevState.viewMode === 'images' ? 'list' : 'images',
            displayItems: false // Hide items when changing view mode
        }));
    };

    // Handle View button click
    handleViewClick = () => {
        if (this.state.selectedWardrobe) {
            this.fetchWardrobeItems(this.state.selectedWardrobe.name);
        } else {
            this.setState({
                error: "Please select a wardrobe before viewing items",
                displayItems: false
            });
        }
    };
    
    // New methods for item deletion
    handleDeleteClick = (item) => {
        this.setState({
            showConfirmModal: true,
            itemToDelete: item
        });
    };
    
    handleCancelDelete = () => {
        this.setState({
            showConfirmModal: false,
            itemToDelete: null
        });
    };
    
    handleConfirmDelete = async () => {
        const { itemToDelete, selectedWardrobe } = this.state;
        if (!itemToDelete) return;
        
        this.setState({ loading: true });
        
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                throw new Error("User ID not found. Please log in again.");
            }
            
            const response = await fetch("https://4awnw7asd9.execute-api.us-east-1.amazonaws.com/dev/removeItem", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("idToken")
                },
                body: JSON.stringify({
                    user_id: userId,
                    item_id: itemToDelete.id
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            
            // Remove from local state
            const updatedItems = this.state.items.filter(item => item.id !== itemToDelete.id);
            
            // Update cache
            if (selectedWardrobe) {
                removeItemFromCache(selectedWardrobe.name, itemToDelete.id);
                console.log(`Cache updated after deleting item ${itemToDelete.id} from wardrobe ${selectedWardrobe.name}`);
            }
            
            this.setState({
                items: updatedItems,
                showConfirmModal: false,
                itemToDelete: null,
                error: '',
                successMessage: 'Item deleted successfully!'
            });
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                this.setState({ successMessage: '' });
            }, 3000);
            
        } catch (error) {
            this.setState({
                error: `Failed to delete item: ${error.message}`
            });
        } finally {
            this.setState({ loading: false });
        }
    };
    
    render() {
        // בודק אם המשתמש מחובר
        const { isLoading, isAuthenticated } = this.props;
        
        if (isLoading || !isAuthenticated) {
            return null;
        }
        
        const { wardrobes, selectedWardrobe, items, loading, error, viewMode, displayItems, hasWardrobes,
                showConfirmModal, successMessage } = this.state;
        
        // If user has no wardrobes, show the "Create Wardrobe First" screen
        if (!hasWardrobes) {
            return (
                <div className="view-wardrobe-container">
                    <div className="no-wardrobe-message">
                        <div className="no-wardrobe-icon">
                            <Shirt size={48} />
                        </div>
                        <h2>Create a Wardrobe First</h2>
                        <p>You need to create a wardrobe before viewing items</p>
                        <Link to="/create-wardrobe" className="create-wardrobe-btn">
                            Create Your First Wardrobe
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="view-wardrobe-container">
                {/* Delete Confirmation Modal */}
                {showConfirmModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Delete Item</h3>
                            <p>Are you sure you want to delete this item?</p>
                            <p>This action cannot be undone.</p>
                            <div className="modal-buttons">
                                <button onClick={this.handleCancelDelete} className="cancel-btn">Cancel</button>
                                <button onClick={this.handleConfirmDelete} className="delete-btn">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className={`view-wardrobe-box ${viewMode === 'list' ? 'list-view' : ''}`}>
                    <h2>View Wardrobe</h2>
                    
                    <div className="view-options">
                        <div className="view-options-row">
                            <div className="dropdown-wrapper">
                                <Dropdown
                                    options={wardrobes.length > 0 ? wardrobes.map(w => w.name) : []}
                                    label="Wardrobe Name"
                                    placeholder="Select a wardrobe..."
                                    onSelect={this.handleWardrobeSelect}
                                    initialValue={selectedWardrobe?.name} 
                                />
                            </div>
                            
                            <div className="view-mode-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={viewMode === 'list'}
                                        onChange={this.toggleViewMode}
                                    />
                                    By Text
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* View button - always show regardless of wardrobe selection */}
                    <div className="view-actions">
                        <button className="view-button small-right" onClick={this.handleViewClick}>View</button>
                    </div>
                    
                    {loading && <div className="loading">Loading items...</div>}
                    {error && <p className="error-message">{error}</p>}
                    
                    {!loading && !error && displayItems && items.length === 0 && selectedWardrobe && (
                        <p className="no-items-message">No items found in this wardrobe.</p>
                    )}
                    
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    
                    {!loading && !error && displayItems && items.length > 0 && (
                        <div className={`items-container ${viewMode}`}>
                            {viewMode === 'images' ? (
                                // Image view mode
                                items.map(item => (
                                    <div key={item.id} className="item-card">
                                        {/* Delete button */}
                                        <button 
                                            className="delete-button" 
                                            onClick={() => this.handleDeleteClick(item)} 
                                            aria-label="Delete item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
                                            <th>Action</th>
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
                                                <td>
                                                    <button 
                                                        className="delete-button-list" 
                                                        onClick={() => this.handleDeleteClick(item)}
                                                        aria-label="Delete item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
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
    }
}

// Add a wrapper that provides navigation, location and authentication
const ViewWardrobeWithRouter = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const { isLoading, isAuthenticated } = useCheckUserLoggedIn(auth);
    
    return (
        <ViewWardrobe 
            {...props} 
            navigate={navigate} 
            location={location} 
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            auth={auth}
        />
    );
};

export default ViewWardrobeWithRouter;