import React from "react";
import { User, Save, ChevronLeft} from "lucide-react";
import "../assets/styles/Profile.css";
import MoonLoader from "react-spinners/MoonLoader";
import { Link } from "react-router-dom";
import { withAuth } from "react-oidc-context";

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      success: false,
      userData: {
        name: "",
        email: "",
        sub: "",
        birthdate: "",
      },
      formData: {
        fullName: "",
        bio: "",
        favoriteStyle: "",
        phoneNumber: ""
      },
      //lastUpdated: null,
      apiCallInProgress: false, // Add flag to prevent duplicate calls
      maxNameLength: 50,
      maxBioLength: 500 // Add bio character limit
    };
    
    // Flag to prevent duplicate API calls during mounting
    this.isDataFetched = false;
  }

  componentDidMount() {
    if (!this.isDataFetched) {
      this.isDataFetched = true;
      this.fetchUserData();
    }
  }

  componentDidUpdate(prevProps) {
    // Only refresh user data when authentication state changes from false to true
    if (!prevProps.auth.isAuthenticated && this.props.auth.isAuthenticated && 
        !this.state.apiCallInProgress) {
      this.fetchUserData();
    }
    
    // Or if the user object changes significantly
    if (prevProps.auth.user?.profile?.sub !== this.props.auth.user?.profile?.sub && 
        !this.state.apiCallInProgress) {
      this.fetchUserData();
    }
  }

  fetchUserData = async () => {
    // Set flag to prevent duplicate API calls
    this.setState({
      loading: true,
      error: null,
      success: false,
      apiCallInProgress: true
    });
      
    try {
      const { auth } = this.props;
      
      if (!auth.isAuthenticated) {
        this.setState({
          error: "User not authenticated. Please log in again.",
          loading: false,
          apiCallInProgress: false
        });
        return;
      }
      
      // Get user info
      let userId, name, email, birthdate;
      
      // MODIFIED: Prioritize using localStorage for name to maintain consistency
      name = localStorage.getItem("name");
      
      if (auth.user && auth.user.profile) {
        userId = auth.user.profile.sub;
        // Only use auth name if localStorage name is not available
        if (!name) name = auth.user.profile.name;
        email = auth.user.profile.email;
        birthdate = auth.user.profile.birthdate;
      }
      
      userId = userId || localStorage.getItem("user_id");
      email = email || localStorage.getItem("email");
      birthdate = birthdate || localStorage.getItem("birthdate");
      
      if (!userId) {
        this.setState({
          error: "User ID not found. Please log in again.",
          loading: false,
          apiCallInProgress: false
        });
        return;
      }
      
      // Store basic user identity in localStorage
      localStorage.setItem("user_id", userId);
      localStorage.setItem("name", name);
      localStorage.setItem("email", email);
      if (birthdate) localStorage.setItem("birthdate", birthdate);
      
      // Using URLSearchParams to properly build the query string
      const params = new URLSearchParams();
      params.append('user_id', userId);
      params.append('default_full_name', name || "Guest");
      
      // Add cache-busting parameter to avoid browser caching
      params.append('_nocache', Date.now().toString());
      
      // Build the complete API URL
      const baseUrl = 'https://gotj7x3lhh.execute-api.us-east-1.amazonaws.com/dev/profileInfo';
      const apiUrl = `${baseUrl}?${params.toString()}`;
      
      console.log(`Fetching profile for user ID: ${userId}`);
      console.log("API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      
      // Get the response as JSON
      const apiResponse = await response.json();
      console.log("Raw API response:", apiResponse);
      
      // IMPORTANT: Extract the profile data from the "body" property if it exists
      // This is the key fix - the Lambda returns an object with a "body" property
      // that contains the actual profile data as a string
      let profileData;
      if (apiResponse.body && typeof apiResponse.body === 'string') {
        try {
          // Parse the nested JSON string in the body property
          profileData = JSON.parse(apiResponse.body);
          console.log("Extracted profile data from body:", profileData);
        } catch (parseError) {
          console.error("Error parsing profile data from body:", parseError);
          profileData = {}; // Default if parsing fails
        }
      } else {
        // If response doesn't have body property, use the response directly
        profileData = apiResponse;
      }
      
      // Check if we have valid profile data
      if (!profileData || typeof profileData !== 'object') {
        throw new Error("Invalid profile data format");
      }
      
      // Store fetched profile data in localStorage
      localStorage.setItem("user_bio", profileData.bio || "");
      localStorage.setItem("user_favorite_style", profileData.favoriteStyle || "");
      localStorage.setItem("user_phone", profileData.phoneNumber || "");
      localStorage.setItem("user_updated_at", profileData.updatedAt || "");
      
      // Update state with fresh profile data
      this.setState({
        userData: {
          name: name,
          email: email,
          sub: userId,
          birthdate: birthdate
        },
        formData: {
          fullName: profileData.fullName || name,
          bio: profileData.bio || "",
          favoriteStyle: profileData.favoriteStyle || "",
          phoneNumber: profileData.phoneNumber || ""
        },
        lastUpdated: profileData.updatedAt ? new Date(profileData.updatedAt) : null,
        loading: false,
        apiCallInProgress: false
      });
      
    } catch (err) {
      console.error("Error fetching user data:", err);
      
      // Fall back to cached data
      const name = localStorage.getItem("name");
      const email = localStorage.getItem("email");
      const userId = localStorage.getItem("user_id");
      const birthdate = localStorage.getItem("birthdate");
      const savedBio = localStorage.getItem("user_bio") || "";
      const savedStyle = localStorage.getItem("user_favorite_style") || "";
      const savedPhone = localStorage.getItem("user_phone") || "";
      const lastUpdated = localStorage.getItem("user_updated_at") || null;
      
      this.setState({
        error: "Failed to load profile data. Using cached data if available.",
        userData: {
          name: name || "Guest",
          email: email || "No email provided",
          sub: userId || "",
          birthdate: birthdate || "Not provided"
        },
        formData: {
          fullName: name || "Guest",
          bio: savedBio,
          favoriteStyle: savedStyle,
          phoneNumber: savedPhone
        },
        lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
        loading: false,
        apiCallInProgress: false
      });
    }
  };
    
  handleChange = (e) => {
    const { name, value } = e.target;
    
    // For fullName field, enforce max length
    if (name === 'fullName' && value.length > this.state.maxNameLength) {
      return; // Don't update state if over max length
    }
    
    // For bio field, enforce max length
    if (name === 'bio' && value.length > this.state.maxBioLength) {
      return; // Don't update state if over max length
    }
    
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      },
      error: null,
      success: false
    }));
  };

  validateForm = () => {
    if (!this.state.formData.fullName || this.state.formData.fullName.trim() === "") {
      this.setState({ error: "Full name is required" });
      return false;
    }
    
    // Check name length
    if (this.state.formData.fullName.length > this.state.maxNameLength) {
      this.setState({ error: `Full name cannot exceed ${this.state.maxNameLength} characters` });
      return false;
    }
    
    // Check bio length
    if (this.state.formData.bio && this.state.formData.bio.length > this.state.maxBioLength) {
      this.setState({ error: `Bio cannot exceed ${this.state.maxBioLength} characters` });
      return false;
    }
    
    // Phone validation
    if (this.state.formData.phoneNumber && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(this.state.formData.phoneNumber)) {
      this.setState({ error: "Please enter a valid phone number" });
      return false;
    }
    
    return true;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({
      loading: true,
      error: null,
      success: false
    });
    
    if (!this.validateForm()) {
      this.setState({ loading: false });
      return;
    }
    
    try {
      const { auth } = this.props;
      
      if (!auth.isAuthenticated) {
        this.setState({
          error: "User not authenticated. Please log in again.",
          loading: false
        });
        return;
      }
      
      const userId = auth.user?.profile?.sub || localStorage.getItem("user_id");
      const accessToken = auth.user?.access_token; // Get the access token

      if (!userId || !accessToken) {
        this.setState({
          error: "User ID or token not found. Please log in again.",
          loading: false
        });
        return;
      }
      
      // Debug what we're sending
      console.log("Sending profile update with user ID:", userId);
      
      // Send profile update to backend API with authorization header
      const response = await fetch('https://rhkrhlq101.execute-api.us-east-1.amazonaws.com/dev/updateProfileInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("idToken")
        },
        body: JSON.stringify({
          userId: userId,
          fullName: this.state.formData.fullName,
          bio: this.state.formData.bio,
          favoriteStyle: this.state.formData.favoriteStyle,
          phoneNumber: this.state.formData.phoneNumber
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Profile update API error:", errorText);
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      // Get current time for local update
      const now = new Date();
      
      // Update localStorage with new profile data
      localStorage.setItem("name", this.state.formData.fullName);
      localStorage.setItem("user_bio", this.state.formData.bio || "");
      localStorage.setItem("user_favorite_style", this.state.formData.favoriteStyle || "");
      localStorage.setItem("user_phone", this.state.formData.phoneNumber || "");
      localStorage.setItem("user_updated_at", now.toISOString());
      
      // Update local userData state - make sure we're updating the name in userData too
      this.setState(prevState => ({
        userData: {
          ...prevState.userData,
          name: this.state.formData.fullName  // This ensures userData.name matches formData.fullName
        },
        lastUpdated: now,
        loading: false,
        success: true
      }));
      
      // ADDITION: Update auth user profile name if possible
      if (auth.user && auth.user.profile) {
        // This is just a local update and won't persist in the actual auth system
        // but helps with consistency during the current session
        auth.user.profile.name = this.state.formData.fullName;
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        this.setState({ success: false });
      }, 3000);
        
    } catch (error) {
      console.error("Profile update error:", error);
      this.setState({
        error: "Failed to update profile. Please try again later.",
        loading: false
      });
    }
  };

  dismissSuccess = () => {
    this.setState({ success: false });
  };
  
  dismissError = () => {
    this.setState({ error: null });
  };

  formatDate = (dateString) => {
    if (!dateString || dateString === "Not provided" || dateString === "No birthdate provided") {
      return "Not provided";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; 
      }

      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return null;
      
      // Format as DD/MM/YYYY HH:MM
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      console.error("Error formatting datetime:", e);
      return null;
    }
  };

  render() {
    const { loading, error, success, userData, formData, maxNameLength, maxBioLength /*lastUpdated*/ } = this.state;
    const { auth } = this.props;
    
    const formattedBirthdate = this.formatDate(userData.birthdate);
    //const formattedLastUpdated = this.formatDateTime(lastUpdated);

    if (!auth.isAuthenticated) {
      return (
        <div className="profile-page">
          <div className="profile-header">
            <h1 className="profile-main-title">Your Profile</h1>
          </div>
          <div className="profile-container">
            <div className="profile-error">
              <span>You need to be logged in to view your profile.</span>
              <Link to="/login" className="login-link">
                Log in now
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (loading && !userData.name) {
      return (
        <div className="profile-page">
          <div className="profile-header">
            <Link to="/" className="back-button">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="profile-main-title">Your Profile</h1>
          </div>
          <div className="profile-container">
            <div className="profile-loading">
              <MoonLoader color="#3b82f6" loading={loading} size={40} />
              <p>Loading profile data...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1 className="profile-main-title">Your Profile</h1>
        </div>
        <div className="profile-container">
          <div className="profile-top">
            <div className="profile-avatar">
              <User size={24} />
            </div>
            <div className="profile-user-info">
              <h2>{userData.name}</h2>
              <p className="profile-email">{userData.email}</p>
              <p className="profile-email">Birth date: {formattedBirthdate}</p>
            </div>
          </div>
          
          <h2 className="profile-title">Edit Your Information</h2>
          
          {/* {formattedLastUpdated && (
            <div className="last-updated">
              <Clock size={14} />
              <span>Last updated: {formattedLastUpdated}</span>
            </div>
          )} */}
          
          <form className="profile-form" onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input 
                className="form-input"
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={this.handleChange}
                maxLength={maxNameLength}
                required
              />
              <div className="char-counter">
                {formData.fullName ? formData.fullName.length : 0}/{maxNameLength} characters
              </div>
            </div>
            
            <div className="form-group full-width">
              <label className="form-label" htmlFor="bio">Bio</label>
              <textarea
                className="form-input"
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={this.handleChange}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={maxBioLength}
              />
              <div className="char-counter">
                {formData.bio ? formData.bio.length : 0}/{maxBioLength} characters
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="favoriteStyle">Favorite Style</label>
              <select
                className="form-input"
                id="favoriteStyle"
                name="favoriteStyle"
                value={formData.favoriteStyle}
                onChange={this.handleChange}
              >
                <option value="">Select your style...</option>
                <option value="Casual">Casual</option>
                <option value="Formal">Formal</option>
                <option value="Sporty">Sporty</option>
                <option value="Vintage">Vintage</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Bohemian">Bohemian</option>
                <option value="Streetwear">Streetwear</option>
                <option value="Business">Business</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="phoneNumber">Phone Number (optional)</label>
              <input 
                className="form-input"
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={this.handleChange}
                placeholder="(123) 456-7890"
              />
            </div>
            
            <div className="button-container">
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <MoonLoader color="#ffffff" loading={loading} size={16} />
                  </span>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {success && (
            <div className="profile-success">
              <span>Profile updated successfully!</span>
              <button
                type="button"
                className="dismiss-button"
                onClick={this.dismissSuccess}
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="profile-error">
              <span>{error}</span>
              <button
                type="button"
                className="dismiss-button error-dismiss"
                onClick={this.dismissError}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withAuth(Profile);