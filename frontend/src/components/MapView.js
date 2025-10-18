import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import './MapView.css';

const JAMAICA_CENTER = [18.1096, -77.2975];

const getMarkerIcon = (category) => {
  const icons = {
    event: '🎉',
    obstacle: '⚠️',
    object: '📍',
    alert: '🚨'
  };
  
  const colors = {
    event: '#00A8E8',
    obstacle: '#FFB627',
    object: '#00C9A7',
    alert: '#FF6B6B'
  };

  return L.divIcon({
    html: `<div class="custom-marker" style="background-color: ${colors[category]}">
             <span class="marker-icon">${icons[category]}</span>
           </div>`,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const MapView = ({
  markers,
  selectedMarker,
  onMarkerClick,
  onMapClick,
  onDeleteMarker,
  currentUser,
  darkMode
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: JAMAICA_CENTER,
      zoom: 9,
      zoomControl: true
    });

    // Add tile layer
    const tileLayer = darkMode
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        });

    tileLayer.addTo(map);

    // Handle map clicks
    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer on dark mode change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileLayer = darkMode
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        });

    tileLayer.addTo(map);
  }, [darkMode]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const icon = getMarkerIcon(marker.category);
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon });

      const popupContent = `
        <div class="marker-popup" data-testid="marker-popup-${marker.id}">
          <h3>${marker.title}</h3>
          <p class="category-badge ${marker.category}">${marker.category.toUpperCase()}</p>
          <p class="description">${marker.description}</p>
          ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="marker-image" />` : ''}
          <p class="user-info">Posted by: ${marker.user_email}</p>
          <p class="date-info">${new Date(marker.created_at).toLocaleDateString()}</p>
          ${currentUser && currentUser.id === marker.user_id ? `
            <button class="delete-btn" onclick="window.deleteMarker('${marker.id}')" data-testid="delete-marker-btn">
              🗑️ Delete
            </button>
          ` : ''}
        </div>
      `;

      leafletMarker.bindPopup(popupContent);
      leafletMarker.on('click', () => onMarkerClick(marker));
      leafletMarker.addTo(markersLayerRef.current);
    });

    // Global delete function
    window.deleteMarker = (markerId) => {
      if (window.confirm('Are you sure you want to delete this marker?')) {
        onDeleteMarker(markerId);
      }
    };
  }, [markers, currentUser]);

  // Handle selected marker
  useEffect(() => {
    if (!selectedMarker || !mapInstanceRef.current) return;

    mapInstanceRef.current.setView(
      [selectedMarker.latitude, selectedMarker.longitude],
      13,
      { animate: true }
    );
  }, [selectedMarker]);

  return (
    <div className="map-container" data-testid="map-container">
      <div ref={mapRef} className="leaflet-map" />
      <div className="map-instructions">
        <p>📍 Click anywhere on the map to add a marker!</p>
      </div>
    </div>
  );
};

export default MapView;