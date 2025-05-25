import React from "react";
import { User, Save, ChevronLeft } from "lucide-react";
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
      }
    };
  }

  componentDidMount() {
    this.fetchUserData();
  }

  componentDidUpdate(prevProps) {
    // Refresh user data when authentication state changes
    if (
      prevProps.auth.isAuthenticated !== this.props.auth.isAuthenticated ||
      prevProps.auth.user !== this.props.auth.user
    ) {
      this.fetchUserData();
    }
  }

  fetchUserData = async () => {
    this.setState({
      loading: true,
      error: null,
      success: false
    });
      
    try {
      const { auth } = this.props;
      
      // Check if user is authenticated via react-oidc-context
      if (!auth.isAuthenticated) {
        this.setState({
          error: "User not authenticated. Please log in again.",
          loading: false
        });
        return;
      }
      
      // Try to get user info directly from auth.user first
      let userId, name, email, birthdate;
      
      if (auth.user && auth.user.profile) {
        userId = auth.user.profile.sub;
        name = auth.user.profile.name;
        email = auth.user.profile.email;
        birthdate = auth.user.profile.birthdate;

      }
      
      // If values are missing from auth.user, try localStorage
      userId = userId || localStorage.getItem("user_id");
      name = name || localStorage.getItem("name");
      email = email || localStorage.getItem("email");
      birthdate = birthdate || localStorage.getItem("birthdate");
      
      // Check for saved profile data in localStorage
      const savedBio = localStorage.getItem("user_bio") || "";
      const savedStyle = localStorage.getItem("user_favorite_style") || "";
      const savedPhone = localStorage.getItem("user_phone") || "";
      
      if (!userId || !name) {
        this.setState({
          error: "User information not found. Please log in again.",
          loading: false
        });
        return;
      }
      
      // Update user data and form data
      this.setState({
        userData: {
          name: name,
          email: email,
          sub: userId,
          birthdate: birthdate
        },
        formData: {
          fullName: name,
          bio: savedBio,
          favoriteStyle: savedStyle,
          phoneNumber: savedPhone
        },
        loading: false
      });
      
    } catch (err) {
      console.error("Error fetching user data:", err);
      
      // Fallback to localStorage if fetch fails
      const name = localStorage.getItem("name");
      const email = localStorage.getItem("email");
      const userId = localStorage.getItem("user_id");
      const birthdate = localStorage.getItem("birthdate");
      const savedBio = localStorage.getItem("user_bio") || "";
      const savedStyle = localStorage.getItem("user_favorite_style") || "";
      const savedPhone = localStorage.getItem("user_phone") || "";
      
      this.setState({
        error: "Failed to load profile data. Using cached data.",
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
      error: null,
      success: false
    }));
  };

  validateForm = () => {
    if (!this.state.formData.fullName || this.state.formData.fullName.trim() === "") {
      this.setState({ error: "Full name is required" });
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

  render() {
    const { loading, error, success, userData, formData } = this.state;
    const { auth } = this.props;
    
    const formattedBirthdate = this.formatDate(userData.birthdate);

    if (!auth.isAuthenticated) {
      return (
        <div className="profile-page">
          <div className="profile-header">
            <Link to="/" className="back-button">
              <ChevronLeft size={20} />
            </Link>
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
              <p className="profile-email">Birth date: {formattedBirthdate}</p>
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

export default withAuth(Profile);