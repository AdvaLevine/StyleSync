import React from "react";
import "../assets/styles/login.css";
import logo from "../assets/images/Logo.png";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="login-container">
      {/* Logo & Tagline */}
      <div className="logo-container">
          <img src={logo} alt="StyleSync Logo" className="logo" />
        </div>
      
      {/* Login Box */}
      <div className="login-box">
        {/* Login Title */}
        <h2>Login</h2>
        <p className="login-subtitle">Sign in to continue</p>

        {/* Login Form */}
        <form>
          <label >Name</label>
          <input type="text" placeholder="Enter your name" required />

          <label >Password</label>
          <input type="password" placeholder="********" required />

          <button type="submit">Sign in</button>
        </form>

        {/* Forgot Password & Signup Links */}
        <div className="links">
          <a href="https://www.google.com/">Forgot Password?</a>
          <Link to="/signup">Sign up!</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
