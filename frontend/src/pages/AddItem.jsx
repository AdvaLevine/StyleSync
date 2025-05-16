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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const isFirstRender = useRef(true);
    const [fromDate, setFromDate] = useState({
        wardrobe: "",
        itemType: "",
        color: [],
        weather: [],
        style: [],
        door: "",
        shelf: "",
        photo: null,
        photoUrl: "", // Will store the S3 URL of the uploaded photo
    });
    const [step, setStep] = useState(1);
    
    // S3 bucket name - should match the one in your Lambda
    const BUCKET_NAME = 'wardrobe-item-images';

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
        if (!wardrobeName) {
            setSelectedWardrobe(null);
            setFromDate((prev) => ({
                ...prev,
                wardrobe: "",
                door: "", 
                shelf: "", 
                itemType: "", 
                color: [],
                weather: [],
                style: [],
                photo: null,
                photoUrl: "",
            }));
            setErrorMessage("");
            return;
        }

        const wardrobe = wardrobes.find((w) => w.name === wardrobeName);
        if (!wardrobe) {
            setSelectedWardrobe(null);
            setFromDate((prev) => ({
                ...prev,
                wardrobe: "",
                door: "", 
                shelf: "", 
                itemType: "", 
                color: [],
                weather: [],
                style: [],
                photo: null,
                photoUrl: "",
            }));
        } else {
            const isSameWardrobe = fromDate.wardrobe === wardrobeName;

            setSelectedWardrobe(wardrobe);
            
            if (isSameWardrobe) {
                setFromDate((prev) => ({
                    ...prev,
                    wardrobe: wardrobeName,
                }));
            } else {
                setFromDate((prev) => ({
                    ...prev,
                    wardrobe: wardrobeName,
                    door: "", 
                    shelf: "", 
                    itemType: "", 
                    color: [],
                    weather: [],
                    style: [],
                    photo: null,
                    photoUrl: "",
                }));
            }
        }

        setErrorMessage(""); 
    };

    // Get a presigned URL from Lambda
    const getPresignedUrl = async (file) => {
        try {
            // יצירת שם קובץ ייחודי
            const timestamp = new Date().getTime();
            const fileName = `${timestamp}-${file.name}`;
            
            console.log("Requesting presigned URL for file:", fileName);
            
            // ננסה שיטת GET עם פרמטרים ב-URL
            const url = `https://j9z90t8zqh.execute-api.us-east-1.amazonaws.com/dev/presigned-url?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(file.type)}`;
            
            console.log("Requesting from URL:", url);
            
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to get presigned URL: ${response.statusText}`);
            }
            
            // הדפסה של התגובה המלאה
            const responseText = await response.text();
            console.log("Raw response from Lambda:", responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse response as JSON:", e);
                throw new Error("Invalid response format from server");
            }
            
            console.log("Parsed data:", data);
            
            // בדוק אם התגובה היא מבנה עם body פנימי
            if (typeof data.body === 'string') {
                try {
                    const parsedBody = JSON.parse(data.body);
                    console.log("Parsed body:", parsedBody);
                    
                    if (parsedBody.uploadURL) {
                        return {
                            uploadURL: parsedBody.uploadURL,
                            fileName: fileName
                        };
                    }
                } catch (e) {
                    console.error("Failed to parse body:", e);
                }
            }
            
            // נסה למצוא את ה-URL בכל מיני מקומות אפשריים
            if (data.uploadURL) {
                return {
                    uploadURL: data.uploadURL,
                    fileName: fileName
                };
            }
            
            console.error("No uploadURL found in response:", data);
            throw new Error("No upload URL returned from server");
        } catch (error) {
            console.error("Error getting presigned URL:", error);
            throw error;
        }
    };
    
    // אם שיטת GET אינה עובדת, נסה להשתמש בנתיב /upload עם שיטת POST
    // https://j9z90t8zqh.execute-api.us-east-1.amazonaws.com/dev/upload
    
    // Upload image to S3 using presigned URL
    const uploadImageToS3 = async (file) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);
            
            // Get presigned URL from Lambda
            console.log("Getting presigned URL...");
            const presignedData = await getPresignedUrl(file);
            
            console.log("Presigned data received:", presignedData);
            
            if (!presignedData || !presignedData.uploadURL) {
                console.error("Invalid presigned data:", presignedData);
                throw new Error("No valid upload URL received");
            }
            
            // Create a new XMLHttpRequest for tracking upload progress
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                    console.log(`Upload progress: ${percentComplete}%`);
                }
            };
            
            // Setup promise to track completion
            return new Promise((resolve, reject) => {
                xhr.onload = () => {
                    console.log("Upload response status:", xhr.status);
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Since we're using PUT, construct the S3 URL
                        const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${presignedData.fileName}`;
                        console.log("Successfully constructed S3 URL:", s3Url);
                        
                        resolve({
                            url: s3Url,
                            fileName: presignedData.fileName
                        });
                    } else {
                        console.error("Upload failed with status:", xhr.status, xhr.responseText);
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = (e) => {
                    console.error("XHR error during upload:", e);
                    reject(new Error('Network error during upload'));
                };
                
                // PUT request for the presigned URL
                console.log("Opening PUT request to:", presignedData.uploadURL);
                xhr.open('PUT', presignedData.uploadURL);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });
        } catch (error) {
            console.error("Error uploading to S3:", error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!fromDate.color || !Array.isArray(fromDate.color) || fromDate.color.length === 0) {
            setFormErrorStep2("Please choose at least one color");
            return;
        }
        
        if (!fromDate.weather || !Array.isArray(fromDate.weather) || fromDate.weather.length === 0) {
            setFormErrorStep2("Please choose at least one weather type");
            return;
        }
        
        if (!fromDate.style || !Array.isArray(fromDate.style) || fromDate.style.length === 0) {
            setFormErrorStep2("Please choose at least one style");
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

        try {
            // First upload the image to S3
            const uploadResult = await uploadImageToS3(fromDate.photo);
            
            // Update form data with photoUrl
            const updatedFromDate = {
                ...fromDate,
                photoUrl: uploadResult.url
            };
            setFromDate(updatedFromDate);
            
            // Create payload with the image URL
            const payload = {
                user_id: userId,
                wardrobe: fromDate.wardrobe,
                itemType: Array.isArray(fromDate.itemType) ? fromDate.itemType[0] : fromDate.itemType,
                color: fromDate.color,
                weather: fromDate.weather,
                style: fromDate.style,
                door: fromDate.door,
                shelf: fromDate.shelf,
                photoUrl: uploadResult.url
            };

            console.log('Sending payload:', payload);
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
    const styleOptions = ["Casual", "Formal", "Fancy", "Business", "Sports", "Party", "Beach", "Outdoor", "Elegant", "Vintage"];

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

                                <MultiSelectDropdown
                                    options={styleOptions}
                                    label="Choose Style"
                                    placeholder="Start typing style..."
                                    onSelect={(selected) => handleInputChange({ target: { name: 'style', value: selected } })}
                                    initialSelectedOptions={fromDate.style}
                                />

                                <label>Upload Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    name="photo"
                                    onChange={handleInputChange}
                                />
                                
                                {isUploading && (
                                    <div className="upload-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="progress-text">{uploadProgress}% Uploaded</div>
                                    </div>
                                )}
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
                            <button 
                                type="submit" 
                                className="add-btn"
                                disabled={isUploading}
                            >
                                {isUploading ? "Uploading..." : "Add"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddItem;