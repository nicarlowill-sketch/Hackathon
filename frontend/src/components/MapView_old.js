// MapView.js
import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = ({ markers }) => {
  const [map, setMap] = useState(null);
  const [safeMarkers, setSafeMarkers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // ✅ Initialize map once
  useEffect(() => {
    if (!map) {
      const newMap = L.map("map").setView([18.1096, -77.2975], 8); // Jamaica default center
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(newMap);
      setMap(newMap);
    }
  }, [map]);

  // ✅ Handle incoming markers safely
  useEffect(() => {
    console.log("🧭 Incoming markers raw value:", markers);
    console.log("🧭 Type:", typeof markers);
    console.log("🧭 Array.isArray:", Array.isArray(markers));

    if (!Array.isArray(markers)) {
      console.warn("⚠️ Expected markers array but got:", markers);

      if (markers && typeof markers === "object") {
        const converted = Object.values(markers);
        console.log("🧩 Converted object to array:", converted);
        setSafeMarkers(converted);
        return;
      }

      setSafeMarkers([]);
      return;
    }

    setSafeMarkers(markers);
  }, [markers]);

  // ✅ Add markers to the map
  useEffect(() => {
    if (!map) return;

    // Clear old markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new ones safely
    if (!Array.isArray(safeMarkers)) {
      console.warn("⚠️ safeMarkers is not an array:", safeMarkers);
      return;
    }

    safeMarkers.forEach((marker) => {
      if (!marker || !marker.lat || !marker.lng) return;

      const leafletMarker = L.marker([marker.lat, marker.lng]).addTo(map);
      leafletMarker.on("click", () => setSelectedLocation(marker));
    });
  }, [map, safeMarkers]);

  // ✅ “Use My Location” button handler
  const handleUseMyLocation = () => {
    if (!map) return;
    setGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();
          map.setView([latitude, longitude], 12);
          setGettingLocation(false);
        },
        (err) => {
          alert("Location access denied or unavailable.");
          console.error(err);
          setGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
      setGettingLocation(false);
    }
  };

  return (
    <div className="map-container">
      <div id="map" style={{ height: "600px", width: "100%" }}></div>

      <button
        className="use-location-btn"
        onClick={handleUseMyLocation}
        disabled={gettingLocation}
      >
        📍 Use My Location
      </button>

      {selectedLocation && (
        <div className="location-info-panel">
          <button onClick={() => setSelectedLocation(null)}>✖</button>
          <h3>{selectedLocation.name}</h3>
          <p>{selectedLocation.type === "parish" ? "Parish" : "Town"}</p>
        </div>
      )}
    </div>
  );
};

export default MapView;
