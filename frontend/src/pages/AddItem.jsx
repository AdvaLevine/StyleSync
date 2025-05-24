import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../assets/styles/AddItem.css";
import Dropdown from '../components/Dropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { useAuth } from "react-oidc-context";
import { useCheckUserLoggedIn } from "../hooks/useCheckUserLoggedIn";
import { getCachedWardrobes } from '../services/wardrobeCache';
import { addItemToCache } from '../services/itemsCache';
import { Shirt } from "lucide-react";

class AddItem extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            wardrobes: [],
            selectedWardrobe: null, 
            errorMessage: "",
            formError: "",
            formErrorStep2: "",
            uploadProgress: 0,
            isUploading: false,
            hasWardrobes: true, // Track if user has any wardrobes
            fromDate: {
                wardrobe: "",
                itemType: "",
                color: [],
                weather: [],
                style: [],
                door: "",
                shelf: "",
                photo: null,
                photoUrl: "", // Will store the S3 URL of the uploaded photo
            },
            step: 1,
        };
    
        // S3 bucket name - should match the one in your Lambda
        this.BUCKET_NAME = 'wardrobe-item-images';
        this.navigate = props.navigate;
        this.auth = props.auth;
    }

    componentDidMount() {
        // Load wardrobes from cache with better error handling
        const cached = getCachedWardrobes();
        if (cached && cached.length > 0) {
            this.setState({
                wardrobes: cached,
                hasWardrobes: true
            });
        } else {
            // User has no wardrobes, show the "Create Wardrobe First" screen
            this.setState({ hasWardrobes: false });
        }
    }

    handleInputChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "door" && this.state.selectedWardrobe) {
            const maxDoors = this.state.selectedWardrobe.num_of_doors;
            if (value < 1 || value > maxDoors) {
                this.setState({
                    errorMessage: `Please enter a door number between 1 and ${maxDoors}.`,
                    fromDate: {
                        ...this.state.fromDate,
                        door: ""
                    }
                });
                return;
            } else {
                this.setState({ errorMessage: "" }); 
            }
        }

        this.setState({
            fromDate: {
                ...this.state.fromDate,
                [name]: files ? files[0] : value
            }
        });
    };

    handleWardrobeSelect = (wardrobeName) => {
        if (!wardrobeName) {
            this.setState({
                selectedWardrobe: null,
                fromDate: {
                    ...this.state.fromDate,
                    wardrobe: "",
                    door: "", 
                    shelf: "", 
                    itemType: "", 
                    color: [],
                    weather: [],
                    style: [],
                    photo: null,
                    photoUrl: ""
                },
                errorMessage: ""
            });
            return;
        }

        const wardrobe = this.state.wardrobes.find((w) => w.name === wardrobeName);
        if (!wardrobe) {
            this.setState({
                selectedWardrobe: null,
                fromDate: {
                    ...this.state.fromDate,
                    wardrobe: "",
                    door: "", 
                    shelf: "", 
                    itemType: "", 
                    color: [],
                    weather: [],
                    style: [],
                    photo: null,
                    photoUrl: ""
                }
            });
        } else {
            const isSameWardrobe = this.state.fromDate.wardrobe === wardrobeName;
            
            if (isSameWardrobe) {
                this.setState({
                    selectedWardrobe: wardrobe,
                    fromDate: {
                        ...this.state.fromDate,
                        wardrobe: wardrobeName
                    }
                });
            } else {
                this.setState({
                    selectedWardrobe: wardrobe,
                    fromDate: {
                        ...this.state.fromDate,
                        wardrobe: wardrobeName,
                        door: "", 
                        shelf: "", 
                        itemType: "", 
                        color: [],
                        weather: [],
                        style: [],
                        photo: null,
                        photoUrl: ""
                    }
                });
            }
        }

        this.setState({ errorMessage: "" }); 
    };

    // Get a presigned URL from Lambda
    getPresignedUrl = async (file) => {
        try {
            // יצירת שם קובץ ייחודי
            const timestamp = new Date().getTime();
            const fileName = `${timestamp}-${file.name}`;
            
            // ננסה שיטת GET עם פרמטרים ב-URL
            const url = `https://j9z90t8zqh.execute-api.us-east-1.amazonaws.com/dev/presigned-url?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(file.type)}`;
            
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get presigned URL: ${response.statusText}`);
            }
            
            // הדפסה של התגובה המלאה
            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error("Invalid response format from server");
            }
            
            // בדוק אם התגובה היא מבנה עם body פנימי
            if (typeof data.body === 'string') {
                try {
                    const parsedBody = JSON.parse(data.body);
                    
                    if (parsedBody.uploadURL) {
                        return {
                            uploadURL: parsedBody.uploadURL,
                            fileName: fileName
                        };
                    }
                } catch (e) {
                    // Silent catch
                }
            }
            
            // נסה למצוא את ה-URL בכל מיני מקומות אפשריים
            if (data.uploadURL) {
                return {
                    uploadURL: data.uploadURL,
                    fileName: fileName
                };
            }
            
            throw new Error("No upload URL returned from server");
        } catch (error) {
            throw error;
        }
    };
    
    // Upload image to S3 using presigned URL
    uploadImageToS3 = async (file) => {
        try {
            this.setState({
                isUploading: true,
                uploadProgress: 0
            });
            
            // Get presigned URL from Lambda
            const presignedData = await this.getPresignedUrl(file);
            
            if (!presignedData || !presignedData.uploadURL) {
                throw new Error("No valid upload URL received");
            }
            
            // Create a new XMLHttpRequest for tracking upload progress
            const xhr = new XMLHttpRequest();
            
            // Store reference to component for use in callback
            const self = this;
            
            // Improved progress event handling with explicit React state updates
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    // Force React state update with setTimeout to ensure UI updates
                    setTimeout(() => {
                        self.setState({ uploadProgress: percentComplete });
                    }, 0);
                }
            };
            
            // Setup promise to track completion
            return new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Since we're using PUT, construct the S3 URL
                        const s3Url = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${presignedData.fileName}`;
                        
                        resolve({
                            url: s3Url,
                            fileName: presignedData.fileName
                        });
                    } else {
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = (e) => {
                    reject(new Error('Network error during upload'));
                };
                
                // PUT request for the presigned URL
                xhr.open('PUT', presignedData.uploadURL);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });
        } catch (error) {
            throw error;
        } finally {
            // Don't immediately hide the upload status when complete
            if (this.state.uploadProgress >= 100) {
                setTimeout(() => {
                    this.setState({ isUploading: false });
                }, 2000); // Show the success message for 2 seconds
            }
        }
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!this.state.fromDate.color || !Array.isArray(this.state.fromDate.color) || this.state.fromDate.color.length === 0) {
            this.setState({ formErrorStep2: "Please choose at least one color" });
            return;
        }
        
        if (!this.state.fromDate.weather || !Array.isArray(this.state.fromDate.weather) || this.state.fromDate.weather.length === 0) {
            this.setState({ formErrorStep2: "Please choose at least one weather type" });
            return;
        }
        
        if (!this.state.fromDate.style || !Array.isArray(this.state.fromDate.style) || this.state.fromDate.style.length === 0) {
            this.setState({ formErrorStep2: "Please choose at least one style" });
            return;
        }
        
        if (!this.state.fromDate.photo) {
            this.setState({ formErrorStep2: "Please upload a photo" });
            return;
        }
        
        this.setState({ formErrorStep2: "" });
        
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Please log in again – user id missing.");
            return;
        }

        try {
            // First upload the image to S3
            const uploadResult = await this.uploadImageToS3(this.state.fromDate.photo);
            
            // Update form data with photoUrl
            const updatedFromDate = {
                ...this.state.fromDate,
                photoUrl: uploadResult.url
            };
            this.setState({ fromDate: updatedFromDate });
            
            // Create payload with the image URL
            const payload = {
                user_id: userId,
                wardrobe: this.state.fromDate.wardrobe,
                itemType: Array.isArray(this.state.fromDate.itemType) ? this.state.fromDate.itemType[0] : this.state.fromDate.itemType,
                color: this.state.fromDate.color,
                weather: this.state.fromDate.weather,
                style: this.state.fromDate.style,
                door: this.state.fromDate.door,
                shelf: this.state.fromDate.shelf,
                photoUrl: uploadResult.url
            };

            const res = await fetch("https://ul2bdgg3g9.execute-api.us-east-1.amazonaws.com/dev/item", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("idToken") 
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            }

            await res.json();
            
            // Create a new item object for the cache
            const newItem = {
                id: Date.now().toString(), // temporary ID until we get one from the server
                user_id: userId,
                wardrobe: this.state.fromDate.wardrobe,
                itemType: Array.isArray(this.state.fromDate.itemType) ? this.state.fromDate.itemType[0] : this.state.fromDate.itemType,
                color: this.state.fromDate.color,
                weather: this.state.fromDate.weather,
                style: this.state.fromDate.style,
                door: this.state.fromDate.door,
                shelf: this.state.fromDate.shelf,
                photoUrl: uploadResult.url,
                createdAt: new Date().toISOString()
            };
            
            // Add the new item directly to the cache
            // This will also update the total count and mark it as current
            addItemToCache(this.state.fromDate.wardrobe, newItem);
            
            // Navigate to home
            this.props.navigate("/home");
        } catch (err) {
            alert(`Could not add item: ${err.message}`);
        }
    };

    commonOptions = ["Shirt", "Pants", "Dress", "Jacket", "Shoes", "Hat", "Scarf", "Belt", "Socks", "Gloves"];
    colorOptions = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Orange", "Brown"];
    weatherOptions = ["Hot", "Cold", "Rainy", "Snow", "Windy", "Sunny", "Cloudy", "Stormy", "Foggy", "Humid"];
    styleOptions = ["Casual", "Formal", "Fancy", "Business", "Sports", "Party", "Beach", "Outdoor", "Elegant", "Vintage"];

    validateStep1 = () => {
        if (!this.state.fromDate.wardrobe) {
            this.setState({ formError: "Please choose a wardrobe" });
            return false;
        }
        if (!this.state.fromDate.door) {
            this.setState({ formError: "Please enter a door number" });
            return false;
        }
        if (!this.state.fromDate.shelf) {
            this.setState({ formError: "Please enter a shelf number" });
            return false;
        }
        if (!this.state.fromDate.itemType) {
            this.setState({ formError: "Please choose an item type" });
            return false;
        }
        
        this.setState({ formError: "" });
        return true;
    };

    handleNextStep = () => {
        if (this.validateStep1()) {
            this.setState({ step: 2 });
        }
    };

    render() {
        // If user has no wardrobes, show the "Create Wardrobe First" screen
        if (!this.state.hasWardrobes) {
            return (
                <div className="add-item-container">
                    <div className="no-wardrobe-message">
                        <div className="no-wardrobe-icon">
                            <Shirt size={48} />
                        </div>
                        <h2>Create a Wardrobe First</h2>
                        <p>You need to create a wardrobe before adding items</p>
                        <Link to="/create-wardrobe" className="create-wardrobe-btn">
                            Create Your First Wardrobe
                        </Link>
                    </div>
                </div>
            );
        }

        // Check authentication using the auth prop from the wrapper
        const { isAuthenticated } = this.props;
        
        if (!isAuthenticated) {
            return null;
        } else { 
            return (
                <div className="add-item-container">
                    <div className="add-item-box">
                        <h2>Add Item</h2>
                        {this.state.step === 1 && (
                            <form>
                                <Dropdown
                                    options={this.state.wardrobes.length > 0 ? this.state.wardrobes.map((w) => w.name) : []} 
                                    label="Choose Wardrobe"
                                    placeholder="Start typing wardrobe name..."
                                    onSelect={this.handleWardrobeSelect}
                                    initialValue={this.state.fromDate.wardrobe}
                                />

                                <label>Choose Door</label>
                                <input
                                    type="number"
                                    name="door"
                                    placeholder="Door Number"
                                    min="1"
                                    max={this.state.selectedWardrobe ? this.state.selectedWardrobe.num_of_doors : ""}
                                    value={this.state.fromDate.door}
                                    onChange={this.handleInputChange}
                                    disabled={!this.state.fromDate.wardrobe}
                                    required
                                />
                                {this.state.errorMessage && <p className="error-message">{this.state.errorMessage}</p>}

                                <label>Choose Shelf</label>
                                <input
                                    type="number"
                                    name="shelf"
                                    placeholder="Shelf Number"
                                    min="1"
                                    value={this.state.fromDate.shelf}
                                    onChange={this.handleInputChange}
                                    disabled={!this.state.fromDate.door} 
                                    required
                                />

                                <Dropdown
                                    options={this.commonOptions}
                                    label="Choose Item Type"
                                    placeholder="Start typing item type..."
                                    onSelect={(selected) => this.handleInputChange({ target: { name: 'itemType', value: selected } })}
                                    disabled={!this.state.fromDate.door} 
                                    initialValue={this.state.fromDate.itemType}
                                />

                                {this.state.formError && <p className="error-message">{this.state.formError}</p>}
                                <button type="button" onClick={this.handleNextStep}>Next</button>
                            </form>
                        )}

                        {this.state.step === 2 && (
                            <form onSubmit={this.handleSubmit}>
                                {this.state.fromDate.itemType && (
                                    <>
                                        <MultiSelectDropdown
                                            options={this.colorOptions}
                                            label="Choose Color"
                                            placeholder="Start typing color..."
                                            onSelect={(selected) => this.handleInputChange({ target: { name: 'color', value: selected } })}
                                            initialSelectedOptions={this.state.fromDate.color}
                                        />

                                        <MultiSelectDropdown
                                            options={this.weatherOptions}
                                            label="Choose Weather Type"
                                            placeholder="Start typing weather..."
                                            onSelect={(selected) => this.handleInputChange({ target: { name: 'weather', value: selected } })}
                                            initialSelectedOptions={this.state.fromDate.weather}
                                        />

                                        <MultiSelectDropdown
                                            options={this.styleOptions}
                                            label="Choose Style"
                                            placeholder="Start typing style..."
                                            onSelect={(selected) => this.handleInputChange({ target: { name: 'style', value: selected } })}
                                            initialSelectedOptions={this.state.fromDate.style}
                                        />

                                        <label>Upload Photo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            name="photo"
                                            onChange={this.handleInputChange}
                                        />
                                        
                                        {this.state.isUploading && (
                                            <div className="upload-progress">
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill" 
                                                        style={{ width: `${this.state.uploadProgress}%` }}
                                                    ></div>
                                                </div>
                                                <div className="progress-text">
                                                    {this.state.uploadProgress < 100 
                                                        ? "Uploading..." 
                                                        : "✓ Upload Complete!"}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {this.state.formErrorStep2 && <p className="error-message">{this.state.formErrorStep2}</p>}

                                <div className="buttons-container">
                                    <button 
                                        type="button" 
                                        className="back-btn" 
                                        onClick={() => {
                                            this.setState({ step: 1 });
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="add-btn"
                                        disabled={this.state.isUploading}
                                    >
                                        {this.state.isUploading ? "Uploading..." : "Add"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            );
        }
    }
}

// Add a wrapper that provides navigation and authentication
const AddItemWithNavigation = (props) => {
    const navigate = useNavigate();
    const auth = useAuth();
    const { isLoading, isAuthenticated } = useCheckUserLoggedIn(auth);
    
    if (isLoading) {
        return null;
    }
    
    return <AddItem {...props} navigate={navigate} auth={auth} isAuthenticated={isAuthenticated} />;
};

export default AddItemWithNavigation;