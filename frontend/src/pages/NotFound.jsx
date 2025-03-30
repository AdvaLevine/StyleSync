import { Link } from "react-router-dom"
import logo from "../assets/images/Logo.png";
import 'bootstrap/dist/css/bootstrap.min.css'

const NotFound = () => {
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center vh-100 text-center not-found-bg">
        {/* Logo */}
        <img
          src={logo}
          alt="StyleSync Logo"
          className="mb-2"
          style={{ width: "180px" }}
        />
  
        {/* 404 Title */}
        <h1 className="display-4 fw-bold text-muted">404 ERROR</h1>
        <p className="lead mb-4 text-dark">
          This page didn’t make the runway.
        </p>
  
        {/* Go Back Button */}
        <Link to="/" className="btn btn-outline-danger px-4 py-2">
          GO BACK
        </Link>
      </div>
    );
  };

export default NotFound;