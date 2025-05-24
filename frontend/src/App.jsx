import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import AddItem from "./pages/AddItem";
import CreateWardrobe from "./pages/CreateWardrobe";
import OutfitRecommendation from "./pages/OutfitRecommendation";
import Settings from "./pages/Settings";
import ViewWardrobe from "./pages/ViewWardrobe";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <Router>
      <Routes>        
        {/* Protected routes with Layout */}
        <Route element={
            <Layout />
        }>
          <Route path="/login" element={<LoginPage />} />
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
