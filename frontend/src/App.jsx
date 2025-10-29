import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Autosuggest from "react-autosuggest";
import { useEffect, useState } from "react";
import axios from "axios";
import ErrorBoundary from "./components/ErrorBoundary";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});


function FlyToLocation({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates) {
      map.flyTo(coordinates, 6);
    }
  }, [coordinates, map]);
  return null;
}

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [minMag, setMinMag] = useState(0);
  const [region, setRegion] = useState("global");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const regionBounds = {
    global: [-90, 90, -180, 180],
    africa: [-35, 38, -20, 55],
    asia: [-10, 80, 60, 150],
    europe: [35, 72, -25, 45],
    north_america: [5, 85, -170, -50],
    south_america: [-60, 15, -90, -30],
    australia: [-50, -10, 110, 155],
    antarctica: [-90, -60, -180, 180],
  };

  const inRegion = (lat, lon) => {
    const [latMin, latMax, lonMin, lonMax] = regionBounds[region];
    return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
  };

  useEffect(() => {
    axios.get("https://earthquake-visualizer-backend.onrender.com/api/earthquakes")
      .then(res => {
        setEarthquakes(res.data?.features || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("API error:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const placeNames = Array.isArray(earthquakes)
    ? [...new Set(earthquakes.map(eq => eq.properties.place))]
    : [];

  const getSuggestions = (value) => {
    const input = value.trim().toLowerCase();
    return placeNames.filter(name =>
      name.toLowerCase().includes(input)
    );
  };

  const onSuggestionsFetchRequested = ({ value }) => {
    setSuggestions(getSuggestions(value));
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const inputProps = {
    placeholder: "Search by city, country, or region",
    value: query,
    onChange: (_, { newValue }) => setQuery(newValue),
    className: "border px-2 py-1 rounded w-96",
  };

  const onSuggestionSelected = (_, { suggestion }) => {
    const match = earthquakes.find(eq =>
      eq.properties.place === suggestion
    );
    if (match) {
      const [lon, lat] = match.geometry.coordinates;
      setSelectedCoords([lat, lon]);
    }
  };

  const filteredQuakes = earthquakes.filter(eq => {
    const [lon, lat] = eq.geometry.coordinates;
    const matchQuery = query === "" || eq.properties.place.toLowerCase().includes(query.toLowerCase());
    return eq.properties.mag >= minMag && inRegion(lat, lon) && matchQuery;
  });

  const totalQuakes = filteredQuakes.length;
  const avgMag = totalQuakes === 0 ? 0 : (
    filteredQuakes.reduce((sum, eq) => sum + eq.properties.mag, 0) / totalQuakes
  ).toFixed(2);

  const getColor = (mag) => {
    if (mag > 7) return "bg-red-600";
    if (mag >= 4) return "bg-orange-500";
    return "bg-yellow-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-600">
        Loading earthquake data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-red-600">
        Failed to load earthquake data. Please check your backend.
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-white text-black h-screen w-screen flex flex-col">
        <div className="p-4 shadow z-10 flex flex-wrap items-center gap-4">
          <label className="font-medium">Min Magnitude:</label>
          <input
            type="range"
            min="0"
            max="8"
            step="0.1"
            value={minMag}
            onChange={e => setMinMag(parseFloat(e.target.value))}
            className="w-64"
          />
          <span className="font-semibold">{minMag}</span>

          <label className="ml-6 font-medium">Region:</label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {Object.keys(regionBounds).map(r => (
              <option key={r} value={r}>
                {r.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <div className="ml-6">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={s => s}
              renderSuggestion={s => <div>{s}</div>}
              inputProps={inputProps}
              onSuggestionSelected={onSuggestionSelected}
            />
          </div>
        </div>

        <div className="px-4 py-2 text-sm bg-gray-100 flex justify-between items-center">
          <span>Total Earthquakes: <strong>{totalQuakes}</strong></span>
          <span>Average Magnitude: <strong>{avgMag}</strong></span>
        </div>

        <MapContainer
          key={`${region}-${minMag}-${query}`}
          center={[20, 0]}
          zoom={2}
          className="flex-grow z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {selectedCoords && <FlyToLocation coordinates={selectedCoords} />}
          {filteredQuakes.map(eq => {
            const [lon, lat] = eq.geometry.coordinates;
            const color = getColor(eq.properties.mag);
            return (
              <Marker key={eq.id} position={[lat, lon]}>
                <Popup>
                  <div className={`text-sm font-medium p-2 rounded ${color} text-white`}>
                    <p>{eq.properties.place}</p>
                    <p>Mag: <span className="font-bold">{eq.properties.mag}</span></p>
                    <p>{new Date(eq.properties.time).toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
