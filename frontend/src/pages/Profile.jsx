import React from "react";
import "../assets/styles/Home.css";

const Profile = () => {
  const name = localStorage.getItem("name") || "Guest";
  const userId = localStorage.getItem("user_id") || "N/A";

  return (
    <div className="profile-page">
      <div className="welcome-section">
        <h1>Your Profile</h1>
        <p>Manage your account information</p>
      </div>
      
      <div className="profile-details">
        <div className="profile-card">
          <h3>Account Information</h3>
          <div className="profile-info">
            <div className="info-item">
              <label>Username:</label>
              <p>{name}</p>
            </div>
            <div className="info-item">
              <label>User ID:</label>
              <p>{userId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 