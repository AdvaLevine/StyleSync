import React, { useState, useEffect } from "react";
import { User, Mail, Calendar, Save } from "lucide-react";
import "../assets/styles/Profile.css";
import userPool from "../aws/UserPool";
import MoonLoader from "react-spinners/MoonLoader";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    sub: "",
    createdAt: ""
  });
  
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    favoriteStyle: "",
    phoneNumber: ""
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      try {
        // Get current authenticated user
        const currentUser = userPool.getCurrentUser();
        
        if (!currentUser) {
          setError("User not authenticated. Please log in again.");
          setLoading(false);
          return;
        }
        
        currentUser.getSession((err, session) => {
          if (err) {
            console.error("Session error:", err);
            setError("Failed to get user session. Please log in again.");
            setLoading(false);
            return;
          }
          
          // Get user attributes
          currentUser.getUserAttributes((err, attributes) => {
            if (err) {
              console.error("Attributes error:", err);
              setError("Failed to get user information. Please try again later.");
              setLoading(false);
              return;
            }
            
            const userAttrs = {};
            attributes.forEach(attr => {
              userAttrs[attr.getName()] = attr.getValue();
            });
            
            // Check for saved profile data in localStorage
            const savedBio = localStorage.getItem("user_bio") || "";
            const savedStyle = localStorage.getItem("user_favorite_style") || "";
            const savedPhone = localStorage.getItem("user_phone") || "";
            
            // Update user data
            setUserData({
              name: userAttrs.name || localStorage.getItem("name") || "User",
              email: userAttrs.email || "",
              sub: userAttrs.sub || localStorage.getItem("user_id") || "",
              createdAt: userAttrs['custom:createdAt'] || new Date().toLocaleDateString()
            });
            
            // Update form data
            setFormData({
              fullName: userAttrs.name || localStorage.getItem("name") || "User",
              bio: savedBio,
              favoriteStyle: savedStyle,
              phoneNumber: savedPhone || userAttrs.phone_number || "",
            });
            
            setLoading(false);
          });
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        
        // Show specific error message based on the error
        if (err.message) {
          setError(`Error: ${err.message}`);
        } else {
          setError("Failed to load profile data. Please try again later.");
        }
        
        // Fallback to localStorage if Cognito fetch fails
        const name = localStorage.getItem("name") || "User";
        const savedBio = localStorage.getItem("user_bio") || "";
        const savedStyle = localStorage.getItem("user_favorite_style") || "";
        const savedPhone = localStorage.getItem("user_phone") || "";
        
        setUserData({
          name: name,
          email: localStorage.getItem("email") || "",
          sub: localStorage.getItem("user_id") || "",
          createdAt: new Date().toLocaleDateString()
        });
        
        setFormData({
          fullName: name,
          bio: savedBio,
          favoriteStyle: savedStyle,
          phoneNumber: savedPhone,
        });
        
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear any previous error/success messages when user starts editing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.fullName || formData.fullName.trim() === "") {
      setError("Full name is required");
      return false;
    }
    
    // Phone validation - optional but if provided must be valid
    if (formData.phoneNumber && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Validate form before submitting
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      // Get current authenticated user
      const currentUser = userPool.getCurrentUser();
      
      if (!currentUser) {
        setError("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }
      
      currentUser.getSession((err, session) => {
        if (err) {
          console.error("Session error:", err);
          setError("Failed to get user session. Please log in again.");
          setLoading(false);
          return;
        }
        
        // In a real app, you would update the user attributes here
        try {
          // Save all profile data to localStorage
          localStorage.setItem("name", formData.fullName);
          localStorage.setItem("user_bio", formData.bio);
          localStorage.setItem("user_favorite_style", formData.favoriteStyle);
          localStorage.setItem("user_phone", formData.phoneNumber);
          
          // Update local userData state
          setUserData(prev => ({
            ...prev,
            name: formData.fullName
          }));
          
          setLoading(false);
          setSuccess(true);
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setSuccess(false);
          }, 5000);
        } catch (storageError) {
          console.error("Storage error:", storageError);
          setError("Failed to save your profile. Please try again.");
          setLoading(false);
        }
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      
      // Show specific error message based on the error
      if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError("Failed to update profile. Please try again later.");
      }
      
      setLoading(false);
    }
  };

  // Function to dismiss the success message
  const dismissSuccess = () => {
    setSuccess(false);
  };
  
  // Function to dismiss the error message
  const dismissError = () => {
    setError(null);
  };

  if (loading && !userData.name) {
    return (
      <div className="profile-page profile-loading">
        <MoonLoader size={40} color="#3b82f6" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">Your Profile</h1>
      </div>
      
      {error && (
        <div className="profile-error">
          <span>{error}</span>
          <button className="dismiss-button error-dismiss" onClick={dismissError}>×</button>
        </div>
      )}
      
      {success && (
        <div className="profile-success">
          <span>Profile updated successfully!</span>
          <button className="dismiss-button" onClick={dismissSuccess}>×</button>
        </div>
      )}
      
      <div className="profile-container">
        <div className="profile-top">
          <div className="profile-avatar">
            <User size={36} />
          </div>
          <div className="profile-user-info">
            <h2>{userData.name}</h2>
            <p className="profile-email">{userData.email}</p>
          </div>
        </div>
        
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group full-width">
            <label className="form-label">Full Name</label>
            <input 
              type="text"
              name="fullName"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>
          
          <div className="form-group full-width">
            <label className="form-label">Bio</label>
            <input 
              type="text"
              name="bio"
              className="form-input"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Favorite Style</label>
            <input 
              type="text"
              name="favoriteStyle"
              className="form-input"
              value={formData.favoriteStyle}
              onChange={handleChange}
              placeholder="e.g., Casual, Formal, Vintage"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="tel"
              name="phoneNumber"
              className="form-input"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Your phone number"
            />
          </div>
          
          <div className="info-row full-width">
            <div className="info-icon">
              <Mail size={20} />
            </div>
            <div className="info-content">
              <h3 className="info-label">Email Address</h3>
              <p className="info-value">{userData.email}</p>
            </div>
          </div>
          
          <div className="info-row full-width">
            <div className="info-icon">
              <Calendar size={20} />
            </div>
            <div className="info-content">
              <h3 className="info-label">Account Created</h3>
              <p className="info-value">{userData.createdAt}</p>
            </div>
          </div>
          
          <div className="form-group full-width">
            <button 
              type="submit" 
              className="save-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <MoonLoader size={16} color="#ffffff" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 