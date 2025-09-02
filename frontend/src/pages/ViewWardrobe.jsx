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
            
            // Updated filter related state
            filterActive: false,
            filters: {
                color: [],
                style: [],
                itemType: [],
                description: false,
                weather: [],
                shelf: []
            },
            filteredItems: [],
            // Track which filter category is currently expanded
            expandedFilter: null, 
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
            // Get the current items list (either filtered or all items)
            const currentItems = prevState.filterActive ? prevState.filteredItems : prevState.items;
            
            // If all current items are already selected, deselect all
            if (prevState.selectedItems.length === currentItems.length) {
                return { selectedItems: [] };
            }
            // Otherwise select all current items
            return { selectedItems: [...currentItems] };
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
        
        this.setState({ loading: true, isDeletingWardrobe: true, error: '' });
        
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                throw new Error("User ID not found. Please log in again.");
            }
            
            // First, fetch all items in the wardrobe if we haven't already
            let itemsToDelete = [];
            if (!this.state.displayItems) {
                this.setState({ error: '' });
                
                try {
                    if (needsItemsCacheUpdate(selectedWardrobe.name)) {
                        console.log(`Fetching items for wardrobe ${selectedWardrobe.name} before deletion...`);
                        itemsToDelete = await fetchAndCacheItems(selectedWardrobe.name, 'list');
                    } else {
                        console.log(`Using cached items for wardrobe ${selectedWardrobe.name} before deletion...`);
                        itemsToDelete = getCachedItems(selectedWardrobe.name);
                    }
                } catch (error) {
                    console.error("Error fetching items before wardrobe deletion:", error);
                    // Continue with wardrobe deletion even if item fetch fails
                }
            } else {
                itemsToDelete = this.state.items;
            }
            
            // Delete all items in the wardrobe
            let failedItems = 0;
            let successCount = 0;
            
            if (itemsToDelete.length > 0) {
                console.log(`Deleting ${itemsToDelete.length} items before wardrobe deletion...`);
                
                for (const item of itemsToDelete) {
                    try {
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
                        
                        if (response.ok) {
                            successCount++;
                        } else {
                            failedItems++;
                            console.error(`Failed to delete item ${item.id}: HTTP ${response.status}`);
                            
                            // Add a small delay before the next request on failure
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (error) {
                        failedItems++;
                        console.error(`Exception while deleting item ${item.id}:`, error);
                        
                        // Add a small delay before the next request
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                
                console.log(`Deleted ${successCount} items; ${failedItems} items failed to delete`);
            }
            
            // Now delete the wardrobe itself
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
            
            // Update local cache
            removeWardrobeFromCache(selectedWardrobe.name);
            clearWardrobeItemsCache(selectedWardrobe.name);
            
            // Update local state
            const updatedWardrobes = this.state.wardrobes.filter(w => w.name !== selectedWardrobe.name);
            
            let statusMessage = `Wardrobe "${selectedWardrobe.name}" deleted successfully.`;
            if (successCount > 0) {
                statusMessage += ` ${successCount} items were also removed.`;
            }
            if (failedItems > 0) {
                statusMessage += ` Note: ${failedItems} items could not be deleted.`;
            }
            
            this.setState({
                wardrobes: updatedWardrobes,
                selectedWardrobe: null,
                items: [],
                displayItems: false,
                showDeleteWardrobeConfirm: false,
                error: '',
                successMessage: statusMessage
            });
            
            // If no more wardrobes, show the "Create Wardrobe First" screen
            if (updatedWardrobes.length === 0) {
                this.setState({ hasWardrobes: false });
            }
            
            // Clear success message after 5 seconds
            setTimeout(() => {
                this.setState(prevState => {
                    // Only clear if the message hasn't changed
                    if (prevState.successMessage === statusMessage) {
                        return { successMessage: '' };
                    }
                    return null;
                });
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
    
    // Toggle filter category expansion
    toggleFilterExpansion = (filterType) => {
        this.setState(prevState => ({
            expandedFilter: prevState.expandedFilter === filterType ? null : filterType
        }));
    };

    // Handle filter selection/deselection
    handleFilterChange = (type, value) => {
        this.setState(prevState => {
            const updatedFilters = { ...prevState.filters };
            
            // Special case for description which is a boolean
            if (type === 'description') {
                updatedFilters.description = !updatedFilters.description;
            } else {
                // For array-based filters: add if not present, remove if present
                if (updatedFilters[type].includes(value)) {
                    updatedFilters[type] = updatedFilters[type].filter(item => item !== value);
                } else {
                    updatedFilters[type] = [...updatedFilters[type], value];
                }
            }
            
            // Check if we have any active filters
            const hasActiveFilters = Object.values(updatedFilters).some(filter => 
                Array.isArray(filter) ? filter.length > 0 : filter
            );
            
            // Apply all active filters to get the filtered items
            let filteredItems = this.state.items;
            if (hasActiveFilters) {
                filteredItems = this.applyAllFilters(updatedFilters);
            }
            
            return {
                filters: updatedFilters,
                filterActive: hasActiveFilters,
                filteredItems: hasActiveFilters ? filteredItems : [],
                // Reset selection when changing filters
                selectedItems: []
            };
        });
    };

    // Apply all active filters to the items
    applyAllFilters = (filters) => {
        let filteredItems = [...this.state.items];
        
        // Apply color filter
        if (filters.color.length > 0) {
            filteredItems = filteredItems.filter(item => 
                Array.isArray(item.color) && 
                item.color.some(color => 
                    filters.color.some(filterColor => 
                        color.toLowerCase() === filterColor.toLowerCase()
                    )
                )
            );
        }
        
        // Apply style filter
        if (filters.style.length > 0) {
            filteredItems = filteredItems.filter(item => 
                Array.isArray(item.style) && 
                item.style.some(style => 
                    filters.style.some(filterStyle => 
                        style.toLowerCase() === filterStyle.toLowerCase()
                    )
                )
            );
        }
        
        // Apply item type filter
        if (filters.itemType.length > 0) {
            filteredItems = filteredItems.filter(item => 
                item.itemType && 
                filters.itemType.some(filterType => 
                    item.itemType.toLowerCase() === filterType.toLowerCase()
                )
            );
        }
        
        // Apply description filter
        if (filters.description) {
            filteredItems = filteredItems.filter(item => 
                item.item_description && item.item_description.trim() !== ''
            );
        }
        
        // Apply weather filter
        if (filters.weather.length > 0) {
            filteredItems = filteredItems.filter(item => 
                Array.isArray(item.weather) && 
                item.weather.some(weather => 
                    filters.weather.some(filterWeather => 
                        weather.toLowerCase() === filterWeather.toLowerCase()
                    )
                )
            );
        }
        
        // Apply shelf filter
        if (filters.shelf.length > 0) {
            filteredItems = filteredItems.filter(item => 
                item.shelf && 
                filters.shelf.some(filterShelf => 
                    item.shelf.toString() === filterShelf.toString()
                )
            );
        }
        
        return filteredItems;
    };

    // Clear all filters
    handleClearFilters = () => {
        this.setState({
            filterActive: false,
            filters: {
                color: [],
                style: [],
                itemType: [],
                description: false,
                weather: [],
                shelf: []
            },
            filteredItems: [],
            expandedFilter: null,
            selectedItems: []
        });
    };

    // Get all available filter options from items
    getFilterOptions = () => {
        const { items } = this.state;
        
        // Extract all unique values for each filter type
        const options = {
            color: [...new Set(
                items.flatMap(item => 
                    Array.isArray(item.color) ? item.color : [])
            )].sort(),
            
            style: [...new Set(
                items.flatMap(item => 
                    Array.isArray(item.style) ? item.style : [])
            )].sort(),
            
            itemType: [...new Set(
                items.map(item => item.itemType).filter(Boolean)
            )].sort(),
            
            weather: [...new Set(
                items.flatMap(item => 
                    Array.isArray(item.weather) ? item.weather : [])
            )].sort(),
            
            shelf: [...new Set(
                items.map(item => item.shelf).filter(Boolean)
            )].sort((a, b) => a - b) // Numeric sort for shelf numbers
        };
        
        return options;
    };

    // Render the scrollable filters UI
    renderScrollableFilters = () => {
        const { loading, expandedFilter, filters } = this.state;
        const filterOptions = this.getFilterOptions();
        
        const filterCategories = [
            { key: 'color', icon: '🎨', label: 'Color' },
            { key: 'style', icon: '👗', label: 'Style' },
            { key: 'itemType', icon: '👕', label: 'Type' },
            { key: 'weather', icon: '☔', label: 'Weather' },
            { key: 'shelf', icon: '📚', label: 'Shelf' },
            { key: 'description', icon: '📝', label: 'Description' }
        ];
        
        // Count active filters for badge display
        const getActiveCount = (type) => {
            if (type === 'description') {
                return filters.description ? 1 : 0;
            }
            return filters[type].length;
        };
        
        // Calculate total active filters
        const totalActiveFilters = Object.entries(filters).reduce((count, [key, value]) => {
            if (key === 'description') {
                return count + (value ? 1 : 0);
            }
            return count + (Array.isArray(value) ? value.length : 0);
        }, 0);
        
        return (
            <div className="filter-section">
                <div className="filter-header">
                    <h3>Filter Items</h3>
                    {this.state.filterActive && (
                        <button 
                            className="clear-filters-btn"
                            onClick={this.handleClearFilters}
                        >
                            Clear All ({totalActiveFilters})
                        </button>
                    )}
                </div>
                
                <div className="filter-categories-scroll">
                    <div className="filter-categories">
                        {filterCategories.map(category => (
                            <div 
                                key={category.key}
                                className={`filter-category ${expandedFilter === category.key ? 'expanded' : ''} ${getActiveCount(category.key) > 0 ? 'active' : ''}`}
                                onClick={() => this.toggleFilterExpansion(category.key)}
                            >
                                <div className="filter-category-header">
                                    <span className="filter-icon">{category.icon}</span>
                                    <span className="filter-label">{category.label}</span>
                                    {getActiveCount(category.key) > 0 && (
                                        <span className="filter-badge">{getActiveCount(category.key)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Expanded filter options */}
                {expandedFilter && (
                    <div className="filter-options-container">
                        <div className="filter-options-header">
                            <h4>
                                {filterCategories.find(c => c.key === expandedFilter)?.label} Options
                            </h4>
                            <button 
                                className="close-filter-btn"
                                onClick={() => this.toggleFilterExpansion(null)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="filter-options-scroll">
                            {expandedFilter === 'description' ? (
                                <div className="description-filter-option">
                                    <label className="filter-option">
                                        <input 
                                            type="checkbox"
                                            checked={filters.description}
                                            onChange={() => this.handleFilterChange('description')}
                                            disabled={loading}
                                        />
                                        Has Description
                                    </label>
                                </div>
                            ) : (
                                <div className="filter-options">
                                    {filterOptions[expandedFilter]?.map(option => (
                                        <label key={option} className="filter-option">
                                            <input 
                                                type="checkbox"
                                                checked={filters[expandedFilter].includes(option)}
                                                onChange={() => this.handleFilterChange(expandedFilter, option)}
                                                disabled={loading}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Active filter summary */}
                {this.renderActiveFiltersSummary()}
            </div>
        );
    };

    // Render a summary of active filters
    renderActiveFiltersSummary = () => {
        const { filterActive, filters, filteredItems, items } = this.state;
        
        if (!filterActive) return null;
        
        // Create summary of active filters with specific values
        const activeSummaries = [];
        
        if (filters.color.length > 0) {
            activeSummaries.push(`Colors: ${filters.color.join(', ')}`);
        }
        
        if (filters.style.length > 0) {
            activeSummaries.push(`Styles: ${filters.style.join(', ')}`);
        }
        
        if (filters.itemType.length > 0) {
            activeSummaries.push(`Types: ${filters.itemType.join(', ')}`);
        }
        
        if (filters.weather.length > 0) {
            activeSummaries.push(`Weather: ${filters.weather.join(', ')}`);
        }
        
        if (filters.shelf.length > 0) {
            activeSummaries.push(`Shelves: ${filters.shelf.join(', ')}`);
        }
        
        if (filters.description) {
            activeSummaries.push('Has Description');
        }
        
        return (
            <div className="active-filters-summary">
                <div className="active-filters-header">
                    <span className="filter-icon">🔍</span>
                    Filtered by:
                </div>
                
                <div className="active-filters-list">
                    {activeSummaries.map((summary, index) => (
                        <div key={index} className="filter-summary-item">
                            {summary}
                        </div>
                    ))}
                </div>
                
                <div className="filter-results-count">
                    Showing {filteredItems.length} of {items.length} items
                </div>
            </div>
        );
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
                    
                    {/* View button */}
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
                            
                            {/* New scrollable filter UI */}
                            {this.renderScrollableFilters()}
                            
                            <div className={`items-container ${viewMode}`}>
                                {(this.state.filterActive ? this.state.filteredItems : items).map(item => {
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
                                })}
                            </div>
                            
                            {/* Delete Wardrobe button in a new section */}
                            <div className="wardrobe-management-actions">
                                <button 
                                    className="delete-wardrobe-btn" 
                                    onClick={this.handleDeleteWardrobeClick}
                                >
                                    Delete Wardrobe
                                </button>
                            </div>
                        </>
                    )}
                    
                    {/* Add Delete Wardrobe button when there are no items but wardrobe is selected */}
                    {!loading && !error && displayItems && items.length === 0 && selectedWardrobe && (
                        <div className="wardrobe-management-actions">
                            <button 
                                className="delete-wardrobe-btn" 
                                onClick={this.handleDeleteWardrobeClick}
                            >
                                Delete Wardrobe
                            </button>
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