import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Color based on category
const getMarkerColor = (category) => {
  switch (category) {
    case "parish":
      return "red";
    case "town":
      return "blue";
    default:
      return "gray";
  }
};

const MapView = ({ markers = [] }) => {
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Initialize the map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map").setView([18.1096, -77.2975], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // ✅ Ensure markers is always an array
    const safeMarkers = Array.isArray(markers)
      ? markers
      : Object.values(markers || {});

    safeMarkers.forEach((marker) => {
      if (!marker.latitude || !marker.longitude) return;

      const color = getMarkerColor(marker.category);

      const leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .addTo(markersLayerRef.current)
        .on("click", () => setSelectedLocation(marker));
    });
  }, [markers]);

  return (
    <div style={{ position: "relative" }}>
      <div id="map" style={{ height: "100vh", width: "100%" }}></div>

      {selectedLocation && (
        <div className="location-info-panel">
          <button onClick={() => setSelectedLocation(null)}>×</button>
          <h3>{selectedLocation.name}</h3>
          <p>
            {selectedLocation.type === "parish" ? "Parish" : "Town"}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
