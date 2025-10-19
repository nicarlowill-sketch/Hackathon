import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

const MapView = ({ markers = [] }) => {
const mapRef = useRef(null);
const markersLayerRef = useRef(null);
const [selectedLocation, setSelectedLocation] = useState(null);
const [gettingLocation, setGettingLocation] = useState(false);

// Initialize map only once
useEffect(() => {
if (mapRef.current) return;

const newMap = L.map("map").setView([18.1096, -77.2975], 8); // Default Jamaica
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(newMap);

const layerGroup = L.layerGroup().addTo(newMap);
mapRef.current = newMap;
markersLayerRef.current = layerGroup;


}, []);

// Render and update markers safely
useEffect(() => {
if (!markersLayerRef.current) return;

// Clear any previous markers
markersLayerRef.current.clearLayers();

// Ensure markers is an array
if (!Array.isArray(markers)) {
  console.warn("Markers is not an array:", markers);
  return;
}

const getMarkerColor = (category) => {
  switch (category) {
    case "Safe":
      return "green";
    case "Warning":
      return "orange";
    case "Danger":
      return "red";
    default:
      return "blue";
  }
};

markers.forEach((marker) => {
  if (!marker.latitude || !marker.longitude) return;

  const color = getMarkerColor(marker.category);

  const leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
    radius: 8,
    color,
    fillColor: color,
    fillOpacity: 0.7,
  })
    .addTo(markersLayerRef.current)
    .on("click", () => setSelectedLocation(marker));
});


}, [markers]);

// Use My Location button handler
const handleUseMyLocation = () => {
if (!navigator.geolocation) {
alert("Geolocation is not supported by your browser.");
return;
}

setGettingLocation(true);
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    mapRef.current.setView([latitude, longitude], 13);

    L.circleMarker([latitude, longitude], {
      radius: 10,
      color: "blue",
      fillColor: "blue",
      fillOpacity: 0.7,
    })
      .addTo(markersLayerRef.current)
      .bindPopup("You are here!")
      .openPopup();

    setGettingLocation(false);
  },
  (error) => {
    console.error("Error getting location:", error);
    alert("Unable to retrieve your location.");
    setGettingLocation(false);
  }
);


};

return (
<div style={{ position: "relative" }}>
<div id="map" style={{ height: "100vh", width: "100%" }}></div>

  <button
    onClick={handleUseMyLocation}
    disabled={gettingLocation}
    style={{
      position: "absolute",
      top: 20,
      left: 20,
      background: "#007bff",
      color: "white",
      border: "none",
      padding: "10px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      zIndex: 1000,
    }}
  >
    📍 {gettingLocation ? "Locating..." : "Use My Location"}
  </button>

  {selectedLocation && (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
        maxWidth: "250px",
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => setSelectedLocation(null)}
        style={{
          float: "right",
          background: "none",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        ✖
      </button>
      <h3 style={{ marginTop: "0.5rem" }}>{selectedLocation.name}</h3>
      <p>
        Type:{" "}
        {selectedLocation.type === "parish" ? "Parish" : "Town"}
      </p>
    </div>
  )}
</div>


);
};

export default MapView;