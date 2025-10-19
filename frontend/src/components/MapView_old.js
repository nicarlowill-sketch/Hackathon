import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
console.log("Rendering from MAPVIEW_OLD.JS");

const MapView = ({ markers = [], setSelectedLocation }) => {
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      center: [18.1096, -77.2975], // Default Jamaica
      zoom: 8,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Helper to color markers by category
  const getMarkerColor = (category) => {
    switch (category?.toLowerCase()) {
      case "food": return "red";
      case "tourism": return "blue";
      case "emergency": return "orange";
      case "education": return "green";
      default: return "purple";
    }
  };

  // Normalize markers input safely
  const normalizeMarkers = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "object") return Object.values(data);
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      return [];
    }
  };

  // Render markers
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current) return;

    const safeMarkers = normalizeMarkers(markers);

    console.log("Rendering markers:", safeMarkers);

    markersLayerRef.current.clearLayers();

    safeMarkers.forEach((marker) => {
      if (!marker || !marker.latitude || !marker.longitude) return;

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
  }, [markers, mapReady]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "100vh",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    ></div>
  );
};

export default MapView;
