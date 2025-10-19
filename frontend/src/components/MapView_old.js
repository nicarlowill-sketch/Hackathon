import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import './MapView.css';

const JAMAICA_CENTER = [18.1096, -77.2975];

// Jamaica parishes with their approximate centers
const JAMAICA_PARISHES = [
  { name: 'Kingston', coords: [18.0179, -76.8099] },
  { name: 'St. Andrew', coords: [18.0333, -76.7833] },
  { name: 'St. Thomas', coords: [17.9833, -76.4] },
  { name: 'Portland', coords: [18.1333, -76.4167] },
  { name: 'St. Mary', coords: [18.3667, -76.9167] },
  { name: 'St. Ann', coords: [18.4333, -77.2] },
  { name: 'Trelawny', coords: [18.35, -77.6] },
  { name: 'St. James', coords: [18.4667, -77.9167] },
  { name: 'Hanover', coords: [18.4167, -78.1333] },
  { name: 'Westmoreland', coords: [18.2333, -78.15] },
  { name: 'St. Elizabeth', coords: [18.0833, -77.75] },
  { name: 'Manchester', coords: [18.0833, -77.5] },
  { name: 'Clarendon', coords: [17.95, -77.25] },
  { name: 'St. Catherine', coords: [18.0, -77.0] }
];

// Jamaica major towns
const JAMAICA_TOWNS = [
  { name: 'Kingston', coords: [18.0179, -76.8099], minZoom: 9 },
  { name: 'Montego Bay', coords: [18.4762, -77.8939], minZoom: 9 },
  { name: 'Spanish Town', coords: [17.9911, -76.9567], minZoom: 10 },
  { name: 'Portmore', coords: [17.9546, -76.8827], minZoom: 10 },
  { name: 'Mandeville', coords: [18.0412, -77.5055], minZoom: 10 },
  { name: 'Ocho Rios', coords: [18.4052, -77.1034], minZoom: 10 },
  { name: 'Port Antonio', coords: [18.1773, -76.4528], minZoom: 10 },
  { name: 'Negril', coords: [18.2687, -78.3481], minZoom: 10 },
  { name: 'May Pen', coords: [17.9645, -77.2419], minZoom: 11 },
  { name: 'Savanna-la-Mar', coords: [18.2189, -78.1326], minZoom: 11 },
  { name: 'Falmouth', coords: [18.4919, -77.6561], minZoom: 11 },
  { name: 'Morant Bay', coords: [17.8814, -76.4092], minZoom: 11 },
  { name: 'Black River', coords: [18.0261, -77.8514], minZoom: 11 },
  { name: 'Lucea', coords: [18.4509, -78.1736], minZoom: 11 }
];

// ✅ Combine parishes and towns into one array
const JAMAICA_LOCATIONS = [
  ...JAMAICA_PARISHES.map(p => ({ ...p, type: 'parish', parish: p.name })),
  ...JAMAICA_TOWNS.map(t => ({ ...t, type: 'town', parish: t.name }))
];

// Marker icon builder
const getMarkerIcon = (category) => {
  const icons = { event: '🎉', obstacle: '⚠️', object: '📍', alert: '🚨' };
  const colors = { event: '#00A8E8', obstacle: '#FFB627', object: '#00C9A7', alert: '#FF6B6B' };

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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const jamaicaBounds = [
      [17.7, -78.4],
      [18.6, -76.1]
    ];

    const map = L.map(mapRef.current, {
      center: JAMAICA_CENTER,
      zoom: 9,
      minZoom: 8,
      maxZoom: 16,
      maxBounds: jamaicaBounds,
      maxBoundsViscosity: 0.8
    });

    const tileLayer = darkMode
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');

    tileLayer.addTo(map);

    // ✅ Add Jamaica location markers
    JAMAICA_LOCATIONS.forEach(location => {
      const locationIcon = L.divIcon({
        html: `<div class="location-marker ${location.type}" data-location="${location.name}">
                 <span class="location-dot"></span>
                 <span class="location-label">${location.name}</span>
               </div>`,
        className: 'custom-location-icon',
        iconSize: [120, 40],
        iconAnchor: [60, 20]
      });

      const marker = L.marker(location.coords, { icon: locationIcon });
      marker.on('click', () => {
        setSelectedLocation(location);
        map.setView(location.coords, 11, { animate: true });
      });
      marker.addTo(map);
    });

    map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => map.remove();
  }, []);

  // ✅ Update markers safely
  useEffect(() => {
    if (!markersLayerRef.current) return;

    console.log("🧭 Incoming markers raw value:", markers);
    console.log("🧭 Type:", typeof markers);
    console.log("🧭 Array.isArray:", Array.isArray(markers));

    const safeMarkers = Array.isArray(markers)
      ? markers
      : Array.isArray(markers?.data)
      ? markers.data
      : [];

    if (!Array.isArray(safeMarkers)) {
      console.warn("⚠️ Expected markers array but got:", safeMarkers);
      return;
    }

    markersLayerRef.current.clearLayers();

    safeMarkers.forEach((marker) => {
      const icon = getMarkerIcon(marker.category);
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon });
      const popupContent = `
        <div class="marker-popup">
          <h3>${marker.title}</h3>
          <p class="category-badge ${marker.category}">${marker.category.toUpperCase()}</p>
          <p>${marker.description}</p>
          ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" />` : ''}
          ${currentUser && currentUser.id === marker.user_id ? `
            <button onclick="window.deleteMarker('${marker.id}')">🗑️ Delete</button>` : ''}
        </div>`;
      leafletMarker.bindPopup(popupContent);
      leafletMarker.on('click', () => onMarkerClick(marker));
      leafletMarker.addTo(markersLayerRef.current);
    });

    window.deleteMarker = (id) => {
      if (window.confirm('Delete this marker?')) onDeleteMarker(id);
    };
  }, [markers, currentUser]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="leaflet-map" />
      <button
        className="use-location-btn"
        onClick={() => alert('Location feature placeholder')}
        disabled={gettingLocation}
      >
        📍 Use My Location
      </button>

      {selectedLocation && (
        <div className="location-info-panel">
          <button onClick={() => setSelectedLocation(null)}>×</button>
          <h3>{selectedLocation.name}</h3>
          <p>{selectedLocation.type === 'parish' ? 'Parish' : 'Town'}</p>
        </div>
      )}
    </div>
  );
};

export default MapView;
