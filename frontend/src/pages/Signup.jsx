import React from "react";
import { Link } from "react-router-dom";
import "../assets/styles/Signup.css";  
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import UserPool from "../aws/UserPool";
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState();
  const navigate = useNavigate();

  /* Sign-up Logic */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
  
    // Cognito user attributes
    const attributeList = [
      new CognitoUserAttribute({ Name: "name", Value: name }),
      new CognitoUserAttribute({ Name: "birthdate", Value: dob }),
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ];
  
    // Sign up user using Cognito User Pool
    UserPool.signUp(email, password, attributeList, null, (err, result) => {
      setIsPending(false);
      if (err) {
        const message = err.message.includes(":")
        ? err.message.split(":").slice(1).join(":").trim()
        : err.message;

        setError(message);
        return;
      }
  
      // Navigate to confirmation or home page with user details
      localStorage.setItem("name", name);
    navigate("/home", { state: { name: name } });
    });
  };

  return (
    <div className="signup-container">
      {/* Back Button */}
      <Link to="/" className="back-button">⟵</Link>
      <video
          autoPlay
          muted
          loop
          className="background-video"
        >
          <source src={require('../assets/videos/SignUpBackground.mp4')} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
      {/* Signup Box */}
      <div className="signup-box">
        <h2>Create Account</h2>
        <p className="subtitle subtitle-top">Sign up to get started!</p>
        <form  className="signup-form" onSubmit={handleSubmit}>
          <label>Name</label>
          <input 
            className="signup-input" 
            type="text" 
            placeholder="Enter your name" 
            required 
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <label>Email</label>
          <input 
            className="signup-input" 
            type="email" 
            placeholder="Enter your email"
            required 
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <label>Password</label>
          <input 
            className="signup-input" 
            type="password" 
            placeholder="********"
            required 
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <label>Date of Birth</label>
          <input className="signup-input" type="date" min="1910-01-01" max="2009-12-31" required value={dob} onChange={(e) => setDob(e.target.value)}/>

          <button type="submit">Sign up</button>
          {isPending && <h1>Loading...</h1>} 
          {error && <p className="error-message">{error}</p>}
        </form>
        <p className="subtitle">Already have an account? <Link to="/"> Log in</Link></p>
      </div>
    </div>
  );
};

export default Signup;
