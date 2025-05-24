import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import MoonLoader from "react-spinners/MoonLoader";
import { useAuth } from "react-oidc-context";
import { useCheckUserLoggedIn } from "../hooks/useCheckUserLoggedIn";

const GenerateCustomOutfit = () => {
  const [weather, setWeather] = useState("Any Weather");
  const [timeOfDay, setTimeOfDay] = useState("Any Time");
  const [formality, setFormality] = useState("Any Level");
  const [colorPalette, setColorPalette] = useState("Any Colors");
  const [error, setError] = useState();
  const [isPending, setIsPending] = useState(false);
  const auth = useAuth();
  
  // Generate Outfit Recommendation
  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const userId = localStorage.getItem("user_id");

    try {
      // --------------------------------------Get All Items--------------------------------------
      const getResponse = await fetch(`https://ejvfo74uj1.execute-api.us-east-1.amazonaws.com/deploy/get-all-items`, {
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
        url: item.photo_url
      }));
      console.log("Wardrobe Items:", wardrobeItems);
      // --------------------------------------------------------------------------------------------
      // --------------------------------------Outfit Recommendation Request------------------------------------------
      const response = await fetch("https://qma6omedi4.execute-api.us-east-1.amazonaws.com/dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          weather,
          time_of_day: timeOfDay,
          formality,
          color_palette: colorPalette,
          wardrobe_items: wardrobeItems,
        }),
      });
  
      const returnedData = await response.json();
      if (returnedData.statusCode === 200) {
        alert(returnedData.body);
      } else {
        setError(returnedData.body)
      }
      } catch (err) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setIsPending(false);
      }
  };
  
  // Show recommendation to user


  const { isLoading, isAuthenticated } = useCheckUserLoggedIn(auth);

  if (isLoading || !isAuthenticated) {
    return null;
  } else { 
    return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card p-4 shadow-sm">
          <h1 className="card-title text-center">Generate Outfit Recommendation</h1>
          <div className="row g-3">
            <div className="col-md-6">
              <label>Weather Conditions</label>
              <select className="form-select" value={weather} onChange={(e) => setWeather(e.target.value)}>
                <option>Any Weather</option>
                <option>Sunny</option>
                <option>Rainy</option>
                <option>Cold</option>
              </select>
            </div>

            <div className="col-md-6">
              <label>Time of Day</label>
              <select className="form-select" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
                <option>Any Time</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </div>

            <div className="col-md-6">
              <label>Formality Level</label>
              <select className="form-select" value={formality} onChange={(e) => setFormality(e.target.value)}>
                <option>Any Level</option>
                <option>Casual</option>
                <option>Business Casual</option>
                <option>Formal</option>
              </select>
            </div>

            <div className="col-md-6">
              <label>Preferred Color Palette</label>
              <select className="form-select" value={colorPalette} onChange={(e) => setColorPalette(e.target.value)}>
                <option>Any Colors</option>
                <option>Warm</option>
                <option>Cool</option>
                <option>Neutral</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button className="btn btn-primary" onClick={handleGenerate}>Generate Custom Outfit</button>
          </div>

          {error && <p className="error-message">{"error"}</p>}
            {/* Loader Container */}
            {isPending && (
                <div className="loader-container mt-2">
                    <MoonLoader 
                        size={30} 
                        speedMultiplier={0.7} 
                        color="#36d7b7"
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
  }
  
};

export default GenerateCustomOutfit;