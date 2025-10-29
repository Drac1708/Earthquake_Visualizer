import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

// StrictMode can trigger double renders in dev, causing Leaflet errors.
// You can disable it temporarily if you're seeing map crashes or autosuggest warnings.

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
