import React from "react";
//import { Link } from "react-router-dom";
import "../assets/styles/Signup.css";  

const Signup = () => {
  return (
    <div className="signup-container">
      {/* Back Button */}
      <a to="/login" className="back-button">←</a>

      {/* Signup Box */}
      <div className="signup-box">
        <h2>Create Account</h2>
        <p className="subtitle">Already Registered? <a to="/login"><br></br>Login Here</a></p>

        <form>
          <label>Name</label>
          <input type="text" placeholder="Enter your name" required />

          <label>Email</label>
          <input type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input type="password" placeholder="********" required />

          <label>Date of Birth</label>
          <input type="date" required />

          <button type="submit">Sign up</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
