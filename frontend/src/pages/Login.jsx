import React, { useState } from "react";
import "../assets/styles/login.css";
import logo from "../assets/images/Logo.png";
import { Link, useNavigate } from "react-router-dom";
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import userPool from "../aws/UserPool";

const Login = () => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);

    const user = new CognitoUser({ Username: email, Pool: userPool});
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        console.log("Login success:", result);

        user.getUserAttributes((err, attributes) => {
          if (err) {
            console.error("Failed to get user attributes:", err);
            return;
          }
      
          const attrs = {};
          attributes.forEach(attr => {
            attrs[attr.getName()] = attr.getValue();
          });
          
          localStorage.setItem("name", attrs.name);
          navigate("/home", { state: { name: attrs.name } });
        });
      },
      onFailure: (err) => {
        const message = err.message.includes(":")
        ? err.message.split(":").slice(1).join(":").trim()
        : err.message;
        setError(message);
      }
    })
  }

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
        <form onSubmit={handleLogin}>
          <label >Email</label>
          <input type="text" placeholder="Enter your email" required onChange={(e) => setEmail(e.target.value)}/>

          <label >Password</label>
          <input type="password" placeholder="********" required onChange={(e) => setPassword(e.target.value)}/>

          <button type="submit">Sign in</button>
          {error && <p className="error-message">{error}</p>}
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
