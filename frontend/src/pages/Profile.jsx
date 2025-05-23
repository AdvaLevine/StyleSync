import React from "react";
import { User, Save, ChevronLeft } from "lucide-react";
import "../assets/styles/Profile.css";
import userPool from "../aws/UserPool";
import MoonLoader from "react-spinners/MoonLoader";
import { Link } from "react-router-dom";

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
        createdAt: ""
      },
      formData: {
        fullName: "",
        bio: "",
        favoriteStyle: "",
        phoneNumber: ""
      }
    };
  }

  componentDidMount() {
    this.fetchUserData();
  }

  fetchUserData = async () => {
    this.setState({
      loading: true,
      error: null,
      success: false
    });
    
    try {
      // Get current authenticated user
      const currentUser = userPool.getCurrentUser();
      
      if (!currentUser) {
        this.setState({
          error: "User not authenticated. Please log in again.",
          loading: false
        });
        return;
      }
      
      currentUser.getSession((err, session) => {
        if (err) {
          console.error("Session error:", err);
          this.setState({
            error: "Failed to get user session. Please log in again.",
            loading: false
          });
          return;
        }
        
        // Get user attributes
        currentUser.getUserAttributes((err, attributes) => {
          if (err) {
            console.error("Attributes error:", err);
            this.setState({
              error: "Failed to get user information. Please try again later.",
              loading: false
            });
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
          
          // Update user data and form data
          this.setState({
            userData: {
              name: userAttrs.name || localStorage.getItem("name") || "User",
              email: userAttrs.email || "",
              sub: userAttrs.sub || localStorage.getItem("user_id") || "",
              createdAt: userAttrs['custom:createdAt'] || new Date().toLocaleDateString()
            },
            formData: {
              fullName: userAttrs.name || localStorage.getItem("name") || "User",
              bio: savedBio,
              favoriteStyle: savedStyle,
              phoneNumber: savedPhone || userAttrs.phone_number || "",
            },
            loading: false
          });
        });
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      
      // Show specific error message based on the error
      const errorMessage = err.message 
        ? `Error: ${err.message}` 
        : "Failed to load profile data. Please try again later.";
      
      // Fallback to localStorage if Cognito fetch fails
      const name = localStorage.getItem("name") || "User";
      const savedBio = localStorage.getItem("user_bio") || "";
      const savedStyle = localStorage.getItem("user_favorite_style") || "";
      const savedPhone = localStorage.getItem("user_phone") || "";
      
      this.setState({
        error: errorMessage,
        userData: {
          name: name,
          email: localStorage.getItem("email") || "",
          sub: localStorage.getItem("user_id") || "",
          createdAt: new Date().toLocaleDateString()
        },
        formData: {
          fullName: name,
          bio: savedBio,
          favoriteStyle: savedStyle,
          phoneNumber: savedPhone,
        },
        loading: false
      });
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      },
      // Clear any previous error/success messages when user starts editing
      error: null,
      success: false
    }));
  };

  validateForm = () => {
    // Basic validation
    if (!this.state.formData.fullName || this.state.formData.fullName.trim() === "") {
      this.setState({ error: "Full name is required" });
      return false;
    }
    
    // Phone validation - optional but if provided must be valid
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
    
    // Validate form before submitting
    if (!this.validateForm()) {
      this.setState({ loading: false });
      return;
    }
    
    try {
      // Get current authenticated user
      const currentUser = userPool.getCurrentUser();
      
      if (!currentUser) {
        this.setState({
          error: "User not authenticated. Please log in again.",
          loading: false
        });
        return;
      }
      
      currentUser.getSession((err, session) => {
        if (err) {
          console.error("Session error:", err);
          this.setState({
            error: "Failed to get user session. Please log in again.",
            loading: false
          });
          return;
        }
        
        // In a real app, you would update the user attributes here
        try {
          // Save all profile data to localStorage
          localStorage.setItem("name", this.state.formData.fullName);
          localStorage.setItem("user_bio", this.state.formData.bio);
          localStorage.setItem("user_favorite_style", this.state.formData.favoriteStyle);
          localStorage.setItem("user_phone", this.state.formData.phoneNumber);
          
          // Update local userData state
          this.setState(prevState => ({
            userData: {
              ...prevState.userData,
              name: this.state.formData.fullName
            },
            loading: false,
            success: true
          }));
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.setState({ success: false });
          }, 5000);
          
        } catch (saveErr) {
          console.error("Error saving profile:", saveErr);
          this.setState({
            error: "Failed to save profile data. Please try again.",
            loading: false
          });
        }
      });
    } catch (error) {
      console.error("Profile update error:", error);
      this.setState({
        error: "An unexpected error occurred. Please try again later.",
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

  render() {
    const { loading, error, success, userData, formData } = this.state;
    
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
          <Link to="/" className="back-button">
            <ChevronLeft size={20} />
          </Link>
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
              <p className="profile-email">Member since {userData.createdAt}</p>
            </div>
          </div>

          <h2 className="profile-title">Edit Your Information</h2>
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
                required
              />
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
              />
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

export default Profile; 