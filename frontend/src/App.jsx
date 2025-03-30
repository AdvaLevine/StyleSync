import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddItem from "./pages/AddItem";
import CreateWardrobe from "./pages/create-wardrobe-flow/CreateWardrobe";
import OutfitRecommendation from "./pages/OutfitRecommendation";
import Settings from "./pages/Settings";
import ViewWardrobe from "./pages/ViewWardrobe";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/create-wardrobe" element={<CreateWardrobe />} />
        <Route path="/outfit-recommendation" element={<OutfitRecommendation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/view-wardrobe" element={<ViewWardrobe />} />
        <Route path="/create-wardrobe" element={<CreateWardrobe />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
