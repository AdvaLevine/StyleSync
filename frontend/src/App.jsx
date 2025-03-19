import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddItem from "./pages/AddItem";
import CreateWardrobe from "./pages/CreateWardrobe";
import OutfitRecommendation from "./pages/OutfitRecommendation";
import Settings from "./pages/Settings";
import ViewWardrobe from "./pages/ViewWardrobe";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/create-wardrobe" element={<CreateWardrobe />} />
        <Route path="/outfit-recommendation" element={<OutfitRecommendation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/view-wardrobe" element={<ViewWardrobe />} />
      </Routes>
    </Router>
  );
};

export default App;
