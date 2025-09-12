import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getCachedWardrobes } from "../services/wardrobeCache";
import { getCachedTotalItemsCount } from "../services/itemsCache";
import { Sparkles, Loader2, RefreshCw,Eye,Calendar,Tag,FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categoryIcons = {
  tops: "👕",
  bottoms: "👖",
  outerwear: "🧥",
  dresses: "👗",
  footwear: "👟",
  accessories: "👜"
};

const GenerateCustomOutfit = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState("Local Weather");
  const [cachedWeather, setCachedWeather] = useState("");
  const [formality, setFormality] = useState("Any Formality");
  const [colorPalette, setColorPalette] = useState("Any Colors");
  const [error, setError] = useState();
  const [viewMode, setViewMode] = useState("visual");
  const [wardrobes, setWardrobes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [styleDescription, setStyleDescription] = useState("");
  const [recommendation, setRecommendation] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's todays events
        const cachedEvents = JSON.parse(localStorage.getItem('calendar_cache'));
        if (cachedEvents && cachedEvents.date === new Date().toDateString()) {
            setCalendarEvents(cachedEvents.events);
        }
        
        // Fetch cached weather
        const cachedWeather = localStorage.getItem("weather_cache");
        if (cachedWeather) {
          setCachedWeather(cachedWeather);
        } else {
          setCachedWeather(""); 
        }

        // Fetch all wardrobes and items from cache
        const wardrobeData = await getCachedWardrobes();
        setWardrobes(wardrobeData);
        setTotalItems(getCachedTotalItemsCount());
      } catch (err) {
        console.error("Error fetching wardrobes:", err);
      }
    }

    fetchData();
  }, [])

  // Generate Outfit Recommendation
  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    const userId = localStorage.getItem("user_id");
    
    try {
      // --------------------------------------Get All Items--------------------------------------
      const getResponse = await fetch(`https://n44pfzmdl8.execute-api.us-east-1.amazonaws.com/dev/get-all-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const getData = await getResponse.json();

      if (!getResponse.ok) {
        throw new Error("Failed to fetch items");
      }

      const wardrobeItems = JSON.parse(getData.body).map((item, index) => ({
        index,
        itemtype: item.itemtype,
        color: item.color,
        weather: item.weather,
        style: item.style,
        url: item.photo_url,
        item_description: item.item_description
      }));
      // -------------------------------------------------------------------------------------------------------------
      // --------------------------------------Outfit Recommendation Request------------------------------------------
      console.log(JSON.stringify({
          user_id: userId,
          weather: weather === "Local Weather" ? cachedWeather : weather,
          formality,
          color_palette: colorPalette,
          style_description: styleDescription,
          wardrobe_items: wardrobeItems,
          calendar_events: calendarEvents,
        }))
      const response = await fetch("https://ailfiw08sa.execute-api.us-east-1.amazonaws.com/dev/getOutfitRecommendationFromOpenAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          weather: weather === "Local Weather" ? cachedWeather : weather,
          formality,
          color_palette: colorPalette,
          style_description: styleDescription,
          wardrobe_items: wardrobeItems,
          calendar_events: calendarEvents,
        }),
      });
  
      const returnedData = await response.json();
      console.log(returnedData);
      if (returnedData.statusCode === 200) {
        const parsedBody = JSON.parse(returnedData.body);

        const recommendation = {
          name: parsedBody.name || `${weather} ${formality} Look`,
          description: parsedBody.description || "This outfit is designed to match your style and weather preferences.",
          items: parsedBody.items.map((item, index) => ({
            id: index + 1,
            name: item.color.join(" ") + " " + item.itemtype,
            category: item.itemtype,
            color: item.color.join(", "),
            image_url: item.url
          }))
        };
        setRecommendation(recommendation);
      } else {
        console.error("Failed to generate outfit recommendation:", returnedData.body);
      }
      } catch (err) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setIsGenerating(false);
      }
  };
  
  if (wardrobes.length === 0) {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <Sparkles className="mb-4" style={{ width: '3rem', height: '3rem', color: '#93c5fd' }} />
        <h1 className="h4 fw-bold text-dark mb-2">Create a Wardrobe First</h1>
        <p className="text-muted mb-4">You need to create a wardrobe to get outfit recommendations</p>
        <button 
          onClick={() => navigate("/create-wardrobe")}
          className="btn btn-primary px-4 py-2 fw-semibold"
        >
          Create Your First Wardrobe!
        </button>
      </div>
    </div>
  );
}

  if (totalItems < 5) {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <Sparkles className="mb-4" style={{ width: '3rem', height: '3rem', color: '#93c5fd' }} />
        <h1 className="h4 fw-bold text-dark mb-2">Add More Items</h1>
        <p className="text-muted mb-4">You need atleast 5 items in your wardrobes to generate outfits</p>
        <button 
          onClick={() => navigate("/add-item")}
          className="btn btn-primary px-4 py-2 fw-semibold"
        >
          Add Items!
        </button>
      </div>
    </div>
  );
}
  // Show recommendation to user

    return (
  <div className="container mt-4">
    {/* Header */}
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div className="d-flex align-items-center">
        <div>
          <h1 className="h4 fw-bold text-dark">Outfit Recommendations</h1>
          <p className="text-muted mb-0">Get AI-powered outfit suggestions</p>
        </div>
      </div>
    </div>

    {/* Two Column Layout */}
    <div className="row g-4">
      {/* Left Column - Generation Settings */}
      <div className="col-md-4">
        <div className="card shadow-sm h-100">
          <div className="card-header">
            <h5 className="mb-0">Generation Settings</h5>
          </div>
          <div className="card-body">
            {/* Weather */}
            <div className="mb-3">
              <label className="form-label">Weather</label>
              <select className="form-select" value={weather} onChange={(e) => setWeather(e.target.value)}>
                <option value="Local Weather">Local Weather</option>
                <option value="Any Weather">Any Weather</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cool">Cool</option>
                <option value="Cold">Cold</option>
                <option value="Rainy">Rainy</option>
                <option value="Snowy">Snowy</option>
              </select>
            </div>

            {/* Formality */}
            <div className="mb-3">
              <label className="form-label">Formality</label>
              <select className="form-select" value={formality} onChange={(e) => setFormality(e.target.value)}>
                <option value="Any">Any Formality</option>
                <option value="Casual">Casual</option>
                <option value="Formal">Formal</option>
                <option value="Business">Business</option>
                <option value="Sport">Sport</option>
                <option value="Party">Party</option>
                <option value="Beach">Beach</option>
              </select>
            </div>

            {/* Color Palette */}
            <div className="mb-3">
              <label className="form-label">Color</label>
              <select className="form-select" value={colorPalette} onChange={(e) => setColorPalette(e.target.value)}>
                <option value="Any">Any</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Neutrals">Neutrals</option>
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
                <option value="Warm">Warm</option>
                <option value="Cool">Cool</option>
                <option value="High Contrast">High Contrast</option>
              </select>
            </div>

            {/* Style Notes */}
            <div className="mb-3">
              <label className="form-label">Style Notes (Optional)</label>
              <textarea
                className="form-control"
                rows="3"
                maxLength={100}
                placeholder="Specific preferences like color palette, style influence, etc."
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
              />
              <div className="form-text">{styleDescription.length}/100 characters</div>
            </div>

            {/* Generate Button */}
            <div className="d-grid">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating || totalItems < 3}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="me-2 spinner-border spinner-border-sm" />
                    Generating...
                  </>
                ) : recommendation.length > 0 ? (
                  <>
                    <RefreshCw className="me-2" size={16} />
                    Regenerate Outfit
                  </>
                ) : (
                  <>
                    <Sparkles className="me-2" size={16} />
                    Generate Outfits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Outfit Suggestion */}
      <div className="col-md-8">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header pb-2">
            <h5 className="card-title mb-0">Outfit Suggestion</h5>
          </div>
          <div className="card-body">
            {isGenerating ? (
              <div className="py-5 text-center">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3" style={{ width: "64px", height: "64px" }}>
                  <Loader2 className="text-primary spinner-border" style={{ width: "32px", height: "32px" }} />
                </div>
                <h5 className="fw-medium text-dark mb-2">Generating Your Outfit</h5>
                <p className="text-muted">Our AI is creating a stylish combination just for you...</p>
              </div>
            ) : recommendation.length !== 0 ? (
              error ? (
                <div className="py-5 text-center text-danger">
                  <Sparkles className="mb-3" style={{ width: "48px", height: "48px" }} />
                  <h5 className="fw-medium mb-2">Generation Failed</h5>
                  <p>{error}</p>
                </div>
              ) : (
                <div className="bg-light rounded p-4 mb-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start mb-3 gap-2">
                    <h5 className="fw-bold text-dark">{recommendation.name}</h5>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary d-flex align-items-center gap-1">
                        <Calendar size={12} />
                        {weather}
                      </span>
                      <span className="badge bg-info bg-opacity-10 text-info border border-info d-flex align-items-center gap-1">
                        <Tag size={12} />
                        {formality}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted mb-3">{recommendation.description}</p>

                  {/* Tabs */}
                  <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${viewMode === "visual" ? "active" : ""}`}
                        onClick={() => setViewMode("visual")}
                      >
                        <Eye size={14} className="me-1" /> Visual
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${viewMode === "textual" ? "active" : ""}`}
                        onClick={() => setViewMode("textual")}
                      >
                        <FileText size={14} className="me-1" /> Textual
                      </button>
                    </li>
                  </ul>

                  {/* Visual Items */}
                  {viewMode === "visual" && (
                    <div className="row g-3">
                      {recommendation?.items?.map((item) => (
                        <div key={item.id} className="col-6 col-sm-4">
                          <div className="bg-white rounded shadow-sm p-3 text-center h-100">
                            <div className="bg-light rounded d-flex align-items-center justify-content-center mb-2" style={{ height: "80px" }}>
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="img-fluid rounded" style={{ maxHeight: "70px", maxWidth: "100%", objectFit: "contain" }}/>
                              ) : (
                                <span className="fs-2">{categoryIcons[item.category] || "👕"}</span>
                              )}
                            </div>
                            <h6 className="fw-medium small text-dark">{item.name}</h6>
                            <small className="text-muted text-capitalize">
                              {item.category} {item.color && `• ${item.color}`}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Textual Items */}
                  {viewMode === "textual" && (
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h6 className="fw-semibold mb-2 text-dark">Outfit Items:</h6>
                      <ul className="ps-3 mb-0">
                        {recommendation?.items?.map(item => (
                          <li key={item.id} className="small text-muted">
                            <strong>{item.name}</strong> ({item.category}{item.color && `, ${item.color}`}{item.brand && `, ${item.brand}`})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-center mt-4">

                  </div>
                </div>
              )
            ) : (
              <div className="py-5 text-center">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3" style={{ width: "64px", height: "64px" }}>
                  <Sparkles className="text-primary" size={32} />
                </div>
                <h5 className="fw-medium text-dark mb-2">Ready for Inspiration?</h5>
                <p className="text-muted mb-3">
                  {true
                    ? "Select your preferences and generate a stylish outfit combination."
                    : "Upload an inspiration image and we'll match it with your wardrobe items."}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={isGenerating || totalItems.length < 3}
                >
                  <Sparkles className="me-2" size={16} />
                  Generate Outfit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
  

export default GenerateCustomOutfit;