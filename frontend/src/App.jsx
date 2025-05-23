import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddItem from "./pages/AddItem";
import CreateWardrobe from "./pages/create-wardrobe-flow/CreateWardrobe";
import OutfitRecommendation from "./pages/OutfitRecommendation";
import Settings from "./pages/Settings";
import ViewWardrobe from "./pages/ViewWardrobe";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Profile from "./pages/Profile";

// Simple auth check - we'll consider a user logged in if they have a user_id in localStorage
const isLoggedIn = () => {
  return localStorage.getItem("user_id") !== null;
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes with Layout */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/home" element={<Home />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/create-wardrobe" element={<CreateWardrobe />} />
          <Route path="/outfit-recommendation" element={<OutfitRecommendation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/view-wardrobe" element={<ViewWardrobe />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
