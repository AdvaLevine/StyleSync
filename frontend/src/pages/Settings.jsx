import React from "react";
import { Settings as SettingsIcon, Sun, Moon, Save } from "lucide-react";
import userPool from "../aws/UserPool";
import "../assets/styles/Settings.css";

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            preferences: {
                darkMode: false,
                notifications: true,
                language: "English"
            },
            loading: false,
            success: false,
            error: null
        };
    }

componentDidMount() {
        // Load saved preferences from localStorage on initial render
        try {
            const savedPrefs = localStorage.getItem("user_preferences");
            if (savedPrefs) {
                const preferences = JSON.parse(savedPrefs);
                this.setState({ preferences });
                
                // Apply dark mode immediately if it was previously enabled
                if (preferences.darkMode) {
                    document.body.classList.add("dark-theme");
                }
            } else {
                // Check if there's a standalone dark mode flag for backward compatibility
                const darkModeFlag = localStorage.getItem("darkMode");
                if (darkModeFlag === "true") {
                    const newPreferences = {
                        darkMode: true,
                        notifications: true,
                        privateWardrobe: false,
                        language: "English"
                    };
                    
                    this.setState({ preferences: newPreferences });
                    
                    // Save the complete preferences object
                    localStorage.setItem("user_preferences", JSON.stringify(newPreferences));
                    
                    document.body.classList.add("dark-theme");
                }
            }
        } catch (err) {
            console.error("Error loading preferences:", err);
        }
    }

    handleToggle = (setting) => {
        this.setState(prevState => {
            const newPreferences = {
                ...prevState.preferences,
                [setting]: !prevState.preferences[setting]
            };
            
            // If toggling dark mode, apply/remove the class immediately for instant feedback
            if (setting === 'darkMode') {
                document.body.classList.toggle("dark-theme", newPreferences.darkMode);
                // Also set the standalone flag for quick access
                localStorage.setItem("darkMode", newPreferences.darkMode.toString());
            }
            
            return { preferences: newPreferences };
        });
    };

    handleLanguageChange = (e) => {
        this.setState(prevState => ({
            preferences: {
                ...prevState.preferences,
                language: e.target.value
            }
        }));
    };

    savePreferences = () => {
        this.setState({
            loading: true,
            error: null
        });
        
        try {
            // Save to localStorage
            localStorage.setItem("user_preferences", JSON.stringify(this.state.preferences));
            
            // Set standalone dark mode flag for quick access across the app
            localStorage.setItem("darkMode", this.state.preferences.darkMode.toString());
            
            // Apply dark mode if selected (redundant but ensures consistency)
            document.body.classList.toggle("dark-theme", this.state.preferences.darkMode);
            
            this.setState({ success: true });
            setTimeout(() => this.setState({ success: false }), 3000);
        } catch (err) {
            console.error("Error saving preferences:", err);
            this.setState({ error: "Failed to save preferences" });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleDeleteAccount = () => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            this.setState({
                loading: true,
                error: null
            });
            
            // Get current user
            const currentUser = userPool.getCurrentUser();
            
            if (currentUser) {
                currentUser.getSession((err, session) => {
                    if (err) {
                        console.error("Error getting session:", err);
                        this.setState({
                            error: "Failed to authenticate",
                            loading: false
                        });
                        return;
                    }
                    
                    // Delete user account
                    currentUser.deleteUser((err) => {
                        if (err) {
                            console.error("Error deleting account:", err);
                            this.setState({
                                error: "Failed to delete account: " + err.message,
                                loading: false
                            });
                        } else {
                            // Preserve dark mode before clearing
                            const darkModeFlag = localStorage.getItem("darkMode");
                            const userPreferences = localStorage.getItem("user_preferences");
                            let darkModePreference = false;
                            
                            if (userPreferences) {
                                try {
                                    const prefs = JSON.parse(userPreferences);
                                    darkModePreference = prefs.darkMode;
                                } catch (err) {
                                    console.error("Error parsing preferences:", err);
                                }
                            } else if (darkModeFlag === "true") {
                                darkModePreference = true;
                            }

                            // Clear local storage
                            localStorage.clear();

                            // Restore dark mode preference
                            if (darkModePreference) {
                                localStorage.setItem("darkMode", "true");
                                localStorage.setItem("user_preferences", JSON.stringify({
                                    darkMode: true,
                                    notifications: true,
                                    privateWardrobe: false,
                                    language: "English"
                                }));
                            }

                            // Redirect to login page
                            window.location.href = "/login";
                        }
                    });
                });
            } else {
                this.setState({
                    error: "User not authenticated",
                    loading: false
                });
            }
        }
    };

    render() {
        const { preferences, loading, success, error } = this.state;
        const userPhone = localStorage.getItem("user_phone");
        
        return ( 
            <div className="settings-page">
                <h1 className="settings-title">Settings</h1>
                
                <div className="settings-card">
                    <div className="settings-header">
                        <SettingsIcon size={20} className="settings-icon" />
                        <h2>App Preferences</h2>
                    </div>
                    <p className="settings-description">Customize your StyleSync experience</p>
                    
                    <div className="settings-option">
                        <div className="settings-option-text">
                            <h3>Dark Mode</h3>
                            <p>Switch to dark theme</p>
                        </div>
                        <div className="toggle-container">
                            <span className={`mode-icon ${!preferences.darkMode ? "active" : ""}`}>
                                <Sun size={16} />
                            </span>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={preferences.darkMode}
                                    onChange={() => this.handleToggle("darkMode")}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span className={`mode-icon ${preferences.darkMode ? "active" : ""}`}>
                                <Moon size={16} />
                            </span>
                        </div>
                    </div>
                    
                    <div className="settings-option">
                        <div className="settings-option-text">
                            <h3>Daily Style Notifications</h3>
                            <p>Receive daily outfit tips and style suggestions via SMS</p>
                            {!userPhone && (
                                <p className="phone-warning">⚠️ Add your phone number in your profile to enable notifications</p>
                            )}
                        </div>
                        <div className="notification-controls">
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={preferences.notifications}
                                    onChange={() => this.handleToggle("notifications")}
                                    disabled={!userPhone}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="settings-option">
                        <div className="settings-option-text">
                            <h3>Language</h3>
                        </div>
                        <select 
                            className="language-select"
                            value={preferences.language}
                            onChange={this.handleLanguageChange}
                        >
                            <option value="English">English</option>
                        </select>
                    </div>
                    
                    <button 
                        className="save-preferences-button"
                        onClick={this.savePreferences}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : (
                            <>
                                <Save size={18} />
                                Save Preferences
                            </>
                        )}
                    </button>
                    
                    {success && <div className="success-message">Preferences saved successfully!</div>}
                    {error && <div className="error-message">{error}</div>}
                </div>
                
                <div className="settings-card danger-zone">
                    <h2 className="danger-title">Danger Zone</h2>
                    <div className="danger-option">
                        <div className="danger-text">
                            <h3>Delete Account</h3>
                            <p>Once you delete your account, all of your data will be permanently removed. This action cannot be undone.</p>
                        </div>
                        <button 
                            className="delete-account-button"
                            onClick={this.handleDeleteAccount}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Delete Account"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default Settings;