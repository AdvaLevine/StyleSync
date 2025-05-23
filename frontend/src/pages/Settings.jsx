import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Sun, Moon, Save } from "lucide-react";
import userPool from "../aws/UserPool";
import "../assets/styles/Settings.css";

const Settings = () => {
    const [preferences, setPreferences] = useState({
        darkMode: false,
        notifications: true,
        privateWardrobe: false,
        language: "English"
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Load saved preferences from localStorage on initial render
    useEffect(() => {
        try {
            const savedPrefs = localStorage.getItem("user_preferences");
            if (savedPrefs) {
                setPreferences(JSON.parse(savedPrefs));
            }
        } catch (err) {
            console.error("Error loading preferences:", err);
        }
    }, []);

    const handleToggle = (setting) => {
        setPreferences(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handleLanguageChange = (e) => {
        setPreferences(prev => ({
            ...prev,
            language: e.target.value
        }));
    };

    const savePreferences = () => {
        setLoading(true);
        setError(null);
        
        try {
            // Save to localStorage
            localStorage.setItem("user_preferences", JSON.stringify(preferences));
            
            // Apply dark mode if selected
            document.body.classList.toggle("dark-theme", preferences.darkMode);
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving preferences:", err);
            setError("Failed to save preferences");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        // Show confirmation dialog
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            setLoading(true);
            setError(null);
            
            // Get current user
            const currentUser = userPool.getCurrentUser();
            
            if (currentUser) {
                currentUser.getSession((err, session) => {
                    if (err) {
                        console.error("Error getting session:", err);
                        setError("Failed to authenticate");
                        setLoading(false);
                        return;
                    }
                    
                    // Delete user account
                    currentUser.deleteUser((err) => {
                        if (err) {
                            console.error("Error deleting account:", err);
                            setError("Failed to delete account: " + err.message);
                        } else {
                            // Clear local storage
                            localStorage.clear();
                            // Redirect to login page
                            window.location.href = "/login";
                        }
                        setLoading(false);
                    });
                });
            } else {
                setError("User not authenticated");
                setLoading(false);
            }
        }
    };

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
                                onChange={() => handleToggle("darkMode")}
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
                        <h3>Notifications</h3>
                        <p>Receive outfit suggestions and tips</p>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={preferences.notifications}
                            onChange={() => handleToggle("notifications")}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                
                <div className="settings-option">
                    <div className="settings-option-text">
                        <h3>Private Wardrobe</h3>
                        <p>Keep your wardrobe private from other users</p>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={preferences.privateWardrobe}
                            onChange={() => handleToggle("privateWardrobe")}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                
                <div className="settings-option">
                    <div className="settings-option-text">
                        <h3>Language</h3>
                    </div>
                    <select 
                        className="language-select"
                        value={preferences.language}
                        onChange={handleLanguageChange}
                    >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                    </select>
                </div>
                
                <button 
                    className="save-preferences-button"
                    onClick={savePreferences}
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
                        onClick={handleDeleteAccount}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Delete Account"}
                    </button>
                </div>
            </div>
        </div>
    );
};
 
export default Settings;