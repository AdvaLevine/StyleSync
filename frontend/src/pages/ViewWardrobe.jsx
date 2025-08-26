import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Dropdown from '../components/Dropdown';
import '../assets/styles/ViewWardrobe.css';
import { getCachedWardrobes, removeWardrobeFromCache } from '../services/wardrobeCache';
import { getCachedItems, fetchAndCacheItems, needsItemsCacheUpdate, removeItemFromCache, clearWardrobeItemsCache } from '../services/itemsCache';
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
            showDeleteWardrobeConfirm: false, // For wardrobe deletion confirmation
            isDeletingWardrobe: false, // Track wardrobe deletion in progress
            successMessage: '', // Success message after deletion
            isDeleting: false, // Track if delete operation is in progress
            selectedItems: [], // Track selected items for bulk delete
            showBulkDeleteConfirm: false, // For bulk delete confirmation
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
            displayItems: false, // Hide previous items when selecting a new wardrobe
            selectedItems: [], // Reset selection when changing wardrobe
            successMessage: '', // Clear any previous success messages
            error: '' // Clear any previous errors
        });
    };

    // Toggle between image and list view
    toggleViewMode = () => {
        this.setState(prevState => ({
            viewMode: prevState.viewMode === 'images' ? 'list' : 'images',
            displayItems: false, // Hide items when changing view mode
            selectedItems: [] // Reset selection when changing view mode
        }));
    };

    // Handle View button click
    handleViewClick = () => {
        if (this.state.selectedWardrobe) {
            this.fetchWardrobeItems(this.state.selectedWardrobe.name);
            // Reset selection when viewing new items
            this.setState({ selectedItems: [] });
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
        
        this.setState({ loading: true, isDeleting: true });
        
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
            this.setState({ loading: false, isDeleting: false });
        }
    };
    
    // New methods for multiple item selection and bulk deletion
    handleItemSelection = (item) => {
        this.setState(prevState => {
            const isAlreadySelected = prevState.selectedItems.some(selected => selected.id === item.id);
            
            if (isAlreadySelected) {
                // Remove item from selection
                return {
                    selectedItems: prevState.selectedItems.filter(selected => selected.id !== item.id)
                };
            } else {
                // Add item to selection
                return {
                    selectedItems: [...prevState.selectedItems, item]
                };
            }
        });
    };
    
    // Handle select all items
    handleSelectAll = () => {
        this.setState(prevState => {
            // If all items are already selected, deselect all
            if (prevState.selectedItems.length === prevState.items.length) {
                return { selectedItems: [] };
            }
            // Otherwise select all items
            return { selectedItems: [...prevState.items] };
        });
    };
    
    handleBulkDeleteClick = () => {
        if (this.state.selectedItems.length > 0) {
            this.setState({
                showBulkDeleteConfirm: true
            });
        }
    };
    
    handleCancelBulkDelete = () => {
        this.setState({
            showBulkDeleteConfirm: false
        });
    };
    
    handleConfirmBulkDelete = async () => {
        const { selectedItems, selectedWardrobe } = this.state;
        if (selectedItems.length === 0) return;
        
        this.setState({ loading: true, isDeleting: true });
        
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                throw new Error("User ID not found. Please log in again.");
            }
            
            // Process each item deletion sequentially with better error handling
            let failedItems = [];
            let successCount = 0;
            
            for (const item of selectedItems) {
                try {
                    console.log(`Attempting to delete item ${item.id}...`);
                    
                    const response = await fetch("https://4awnw7asd9.execute-api.us-east-1.amazonaws.com/dev/removeItem", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": localStorage.getItem("idToken")
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            item_id: item.id
                        })
                    });
                    
                    // Check if response is ok (200-299 status code)
                    if (response.ok) {
                        // Update cache for successful deletion
                        if (selectedWardrobe) {
                            removeItemFromCache(selectedWardrobe.name, item.id);
                            console.log(`Successfully deleted item ${item.id}`);
                        }
                        successCount++;
                    } else {
                        // Handle HTTP errors (non-2xx responses)
                        const errorText = await response.text().catch(() => "Unknown error");
                        let errorMessage = `Server returned ${response.status}`;
                        
                        try {
                            const errorJson = JSON.parse(errorText);
                            if (errorJson && errorJson.message) {
                                errorMessage = errorJson.message;
                            }
                        } catch (e) {
                            // If parsing fails, just use the error text
                            if (errorText && errorText !== "Unknown error") {
                                errorMessage = errorText;
                            }
                        }
                        
                        console.error(`Error deleting item ${item.id}: ${errorMessage}`);
                        failedItems.push({...item, error: errorMessage});
                        
                        // If we get a 502 or 500, add a small delay before the next request
                        if (response.status === 502 || response.status === 500) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                } catch (error) {
                    console.error(`Exception while deleting item ${item.id}:`, error);
                    failedItems.push({...item, error: error.message});
                    // Add a small delay before the next request
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Update the UI with successfully deleted items
            const successfullyDeletedIds = selectedItems
                .filter(item => !failedItems.some(failed => failed.id === item.id))
                .map(item => item.id);
            
            const updatedItems = this.state.items.filter(item => !successfullyDeletedIds.includes(item.id));
            
            // Prepare user feedback messages
            let successMessage = successCount > 0 ? 
                `Successfully deleted ${successCount} item${successCount !== 1 ? 's' : ''}.` : '';
                
            let errorMessage = failedItems.length > 0 ? 
                `Failed to delete ${failedItems.length} item${failedItems.length !== 1 ? 's' : ''}.` : '';
            
            // Update state
            this.setState({
                items: updatedItems,
                showBulkDeleteConfirm: false,
                selectedItems: [],
                error: errorMessage,
                successMessage: successMessage
            });
            
            // Clear success message after 3 seconds
            if (successMessage) {
                setTimeout(() => {
                    this.setState(prevState => {
                        // Only clear if the message hasn't changed
                        if (prevState.successMessage === successMessage) {
                            return { successMessage: '' };
                        }
                        return null;
                    });
                }, 3000);
            }
            
        } catch (error) {
            this.setState({
                error: `Failed to delete items: ${error.message}`,
                showBulkDeleteConfirm: false
            });
        } finally {
            this.setState({ loading: false, isDeleting: false });
        }
    };
    
    // New method to handle delete wardrobe button click
    handleDeleteWardrobeClick = () => {
        this.setState({
            showDeleteWardrobeConfirm: true
        });
    };
    
    // New method to handle cancel delete wardrobe
    handleCancelDeleteWardrobe = () => {
        this.setState({
            showDeleteWardrobeConfirm: false
        });
    };
    
    // New method to handle confirm delete wardrobe
    handleConfirmDeleteWardrobe = async () => {
        const { selectedWardrobe } = this.state;
        if (!selectedWardrobe) return;
        
        this.setState({ loading: true, isDeletingWardrobe: true });
        
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                throw new Error("User ID not found. Please log in again.");
            }
            
            // Call the API to delete the wardrobe
            const response = await fetch("https://h16jlm6x32.execute-api.us-east-1.amazonaws.com/dev/removeWardrobe", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("idToken")
                },
                body: JSON.stringify({
                    user_id: userId,
                    wardrobe_name: selectedWardrobe.name
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Update local cache
            removeWardrobeFromCache(selectedWardrobe.name);
            clearWardrobeItemsCache(selectedWardrobe.name);
            
            // Update local state
            const updatedWardrobes = this.state.wardrobes.filter(w => w.name !== selectedWardrobe.name);
            
            this.setState({
                wardrobes: updatedWardrobes,
                selectedWardrobe: null,
                items: [],
                displayItems: false,
                showDeleteWardrobeConfirm: false,
                error: '',
                successMessage: `Wardrobe "${selectedWardrobe.name}" deleted successfully. ${result.itemsDeleted > 0 ? `${result.itemsDeleted} items were also removed.` : ''}`
            });
            
            // If no more wardrobes, show the "Create Wardrobe First" screen
            if (updatedWardrobes.length === 0) {
                this.setState({ hasWardrobes: false });
            }
            
            // Clear success message after 5 seconds
            setTimeout(() => {
                this.setState({ successMessage: '' });
            }, 5000);
            
        } catch (error) {
            this.setState({
                error: `Failed to delete wardrobe: ${error.message}`,
                showDeleteWardrobeConfirm: false
            });
        } finally {
            this.setState({ loading: false, isDeletingWardrobe: false });
        }
    };
    
    render() {
        const { isLoading, isAuthenticated } = this.props;
        
        if (isLoading || !isAuthenticated) {
            return null;
        }
        
        const { wardrobes, selectedWardrobe, items, loading, error, viewMode, displayItems, hasWardrobes,
                showConfirmModal, showBulkDeleteConfirm, showDeleteWardrobeConfirm, successMessage, isDeleting, isDeletingWardrobe, selectedItems } = this.state;
        
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
                                <button 
                                    onClick={this.handleCancelDelete} 
                                    className="cancel-btn"
                                    disabled={isDeleting}
                                >Cancel</button>
                                <button 
                                    onClick={this.handleConfirmDelete} 
                                    className="delete-btn"
                                    disabled={isDeleting}
                                >{isDeleting ? "Deleting..." : "Delete"}</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Delete Wardrobe Confirmation Modal */}
                {showDeleteWardrobeConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Delete Wardrobe</h3>
                            <p>Are you sure you want to delete the wardrobe "{selectedWardrobe?.name}"?</p>
                            <p>This will also delete all items in this wardrobe. This action cannot be undone.</p>
                            <div className="modal-buttons">
                                <button 
                                    onClick={this.handleCancelDeleteWardrobe} 
                                    className="cancel-btn"
                                    disabled={isDeletingWardrobe}
                                >Cancel</button>
                                <button 
                                    onClick={this.handleConfirmDeleteWardrobe} 
                                    className="delete-btn"
                                    disabled={isDeletingWardrobe}
                                >{isDeletingWardrobe ? "Deleting..." : "Delete Wardrobe"}</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Bulk Delete Confirmation Modal */}
                {showBulkDeleteConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Delete Multiple Items</h3>
                            <p>Are you sure you want to delete {selectedItems.length} selected items?</p>
                            <p>This action cannot be undone.</p>
                            <div className="modal-buttons">
                                <button 
                                    onClick={this.handleCancelBulkDelete} 
                                    className="cancel-btn"
                                    disabled={isDeleting}
                                >Cancel</button>
                                <button 
                                    onClick={this.handleConfirmBulkDelete} 
                                    className="delete-btn"
                                    disabled={isDeleting}
                                >{isDeleting ? "Deleting..." : "Delete Selected"}</button>
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
                    
                    {/* View and Delete Wardrobe buttons */}
                    <div className="view-actions">
                        {selectedWardrobe && displayItems && (
                            <button 
                                className="delete-wardrobe-btn" 
                                onClick={this.handleDeleteWardrobeClick}
                            >
                                Delete Wardrobe
                            </button>
                        )}
                        <button className="view-button small-right" onClick={this.handleViewClick}>View</button>
                    </div>
                    
                    {loading && <div className="loading">Loading items...</div>}
                    {error && <p className="error-message">{error}</p>}
                    
                    {!loading && !error && displayItems && items.length === 0 && selectedWardrobe && (
                        <p className="no-items-message">No items found in this wardrobe.</p>
                    )}
                    
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    
                    {!loading && !error && displayItems && items.length > 0 && (
                        <>
                            {/* Bulk actions bar */}
                            <div className="bulk-actions">
                                <div className="selection-controls">
                                    <button 
                                        className="select-all-btn"
                                        onClick={this.handleSelectAll}
                                    >
                                        {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <span className="selected-count">
                                        {selectedItems.length > 0 ? `${selectedItems.length} items selected` : ''}
                                    </span>
                                </div>
                                <button 
                                    className={`bulk-delete-btn ${selectedItems.length === 0 ? 'disabled' : ''}`}
                                    onClick={this.handleBulkDeleteClick}
                                    disabled={selectedItems.length === 0}
                                >
                                    Delete Selected
                                </button>
                            </div>
                            
                            <div className={`items-container ${viewMode}`}>
                                {viewMode === 'images' ? (
                                    // Image view mode
                                    items.map(item => {
                                        const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
                                        
                                        return (
                                            <div key={item.id} className={`item-card ${isSelected ? 'selected' : ''}`}>
                                                {/* Selection checkbox */}
                                                <div className="item-select">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => this.handleItemSelection(item)}
                                                        className="item-checkbox"
                                                    />
                                                </div>
                                                
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
                                        );
                                    })
                                ) : (
                                    // List view mode
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th className="select-column">Select</th>
                                                <th>Type</th>
                                                <th>Color</th>
                                                <th>Weather</th>
                                                <th>Style</th>
                                                <th>Location</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => {
                                                const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
                                                
                                                return (
                                                    <tr key={item.id} className={isSelected ? 'selected' : ''}>
                                                        <td className="select-column">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => this.handleItemSelection(item)}
                                                                className="item-checkbox"
                                                            />
                                                        </td>
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
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