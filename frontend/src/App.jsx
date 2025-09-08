import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import "./assets/styles/dark-theme.css";
import notificationService from "./services/notificationService";

// Scroll restoration wrapper
function ScrollToTop() {
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

class App extends React.Component {
  componentDidMount() {
    // Initialize dark mode on app startup
    this.initializeDarkMode();

    // Process daily notifications
    this.processDailyNotifications();
  }

  initializeDarkMode = () => {
    try {
      // Check for dark mode preference
      const darkModeFlag = localStorage.getItem("darkMode");
      const savedPrefs = localStorage.getItem("user_preferences");
      
      let isDarkMode = false;
      
      if (savedPrefs) {
        const preferences = JSON.parse(savedPrefs);
        isDarkMode = preferences.darkMode;
      } else if (darkModeFlag === "true") {
        isDarkMode = true;
      }
      
      // Apply dark mode class if enabled
      if (isDarkMode) {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }
    } catch (err) {
      console.error("Error initializing dark mode:", err);
    }
  };

  processDailyNotifications = async () => {
    try {
      // Only process notifications if user is logged in
      const userId = localStorage.getItem("user_id");
      if (userId) {
        await notificationService.processDailyNotification();
      }
    } catch (error) {
      console.error("Error processing daily notifications:", error);
    }
  };

  render() {
    return (
      <Router>
        <ScrollToTop />
        <Routes>        
          <Route path="/login" element={<LoginPage />} />
          {/* Protected routes with Layout */}
          <Route element={<Layout />}>
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
  }
}

export default App;