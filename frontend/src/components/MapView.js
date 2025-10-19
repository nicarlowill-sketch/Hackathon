import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import './MapView.css';

const JAMAICA_CENTER = [18.1096, -77.2975];

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

const getMarkerColor = (category) => {
const colors = {
event: '#00A8E8',
obstacle: '#FFB627',
object: '#00C9A7',
alert: '#FF6B6B'
};
return colors[category] || '#00C9A7';
};

// Helper: safely normalize marker input
const normalizeMarkers = (data) => {
if (!data) return [];
if (Array.isArray(data)) return data;
if (typeof data === 'object') return Object.values(data);
try {
const parsed = JSON.parse(data);
return Array.isArray(parsed) ? parsed : Object.values(parsed);
} catch {
return [];
}
};

const MapView = ({
markers,
selectedMarker,
onMarkerClick,
onMapClick,
onLocationMarker,
onDeleteMarker,
currentUser,
darkMode
}) => {
const mapRef = useRef(null);
const mapInstanceRef = useRef(null);
const markersLayerRef = useRef(null);
const labelsLayerRef = useRef(null);
const [userLocation, setUserLocation] = useState(null);
const [gettingLocation, setGettingLocation] = useState(false);
const [currentZoom, setCurrentZoom] = useState(9);

useEffect(() => {
if (mapInstanceRef.current) return;

const jamaicaBounds = [
  [17.7, -78.4],
  [18.6, -76.1]
];

const map = L.map(mapRef.current, {
  center: JAMAICA_CENTER,
  zoom: 9,
  zoomControl: true,
  minZoom: 8,
  maxZoom: 16,
  maxBounds: jamaicaBounds,
  maxBoundsViscosity: 0.8
});

const tileLayer = darkMode
  ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 16
    })
  : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 16
    });

tileLayer.addTo(map);
map.on('zoomend', () => setCurrentZoom(map.getZoom()));
mapInstanceRef.current = map;
markersLayerRef.current = L.layerGroup().addTo(map);
labelsLayerRef.current = L.layerGroup().addTo(map);

return () => {
  map.remove();
  mapInstanceRef.current = null;
};


}, []);

useEffect(() => {
if (!mapInstanceRef.current) return;
const map = mapInstanceRef.current;
map.eachLayer((layer) => {
if (layer instanceof L.TileLayer) map.removeLayer(layer);
});

const tileLayer = darkMode
  ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 16
    })
  : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 16
    });
tileLayer.addTo(map);


}, [darkMode]);

useEffect(() => {
if (!labelsLayerRef.current || !mapInstanceRef.current) return;
labelsLayerRef.current.clearLayers();

if (currentZoom <= 9) {
  JAMAICA_PARISHES.forEach((parish) => {
    const parishLabel = L.divIcon({
      html: `<div class="parish-label">${parish.name}</div>`,
      className: 'custom-label-icon',
      iconSize: [150, 30],
      iconAnchor: [75, 15]
    });
    L.marker(parish.coords, { icon: parishLabel }).addTo(labelsLayerRef.current);
  });
} else {
  JAMAICA_TOWNS.forEach((town) => {
    if (currentZoom >= town.minZoom) {
      const townLabel = L.divIcon({
        html: `<div class="town-label">${town.name}</div>`,
        className: 'custom-label-icon',
        iconSize: [120, 25],
        iconAnchor: [60, 12]
      });
      L.marker(town.coords, { icon: townLabel }).addTo(labelsLayerRef.current);
    }
  });
}


}, [currentZoom]);

// Marker rendering
useEffect(() => {
if (!markersLayerRef.current) return;

markersLayerRef.current.clearLayers();
const safeMarkers = normalizeMarkers(markers);
safeMarkers.forEach((marker) => {
  if (!marker || !marker.latitude || !marker.longitude) return;
  const color = getMarkerColor(marker.category);
  const leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
    radius: 8,
    fillColor: color,
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9,
    className: 'pulse-marker'
  });

  const updateTime = new Date(marker.updated_at || marker.created_at).toLocaleString();
  const popupContent = `
    <div class="marker-popup">
      <h3>${marker.title}</h3>
      <p class="category-badge ${marker.category}">${marker.category?.toUpperCase()}</p>
      <p>${marker.description || ''}</p>
      ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" />` : ''}
      <p>📍 ${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}</p>
      <p>Posted by: ${marker.user_email || 'Anonymous'}</p>
      <p>🕒 ${updateTime}</p>
      ${currentUser && currentUser.id === marker.user_id ? `
        <button class="delete-btn" onclick="window.deleteMarker('${marker.id}')">🗑️ Delete</button>
      ` : ''}
    </div>`;
  leafletMarker.bindPopup(popupContent);
  leafletMarker.on('click', () => onMarkerClick(marker));
  leafletMarker.addTo(markersLayerRef.current);
});

window.deleteMarker = (markerId) => {
  if (window.confirm('Are you sure you want to delete this marker?')) onDeleteMarker(markerId);
};


}, [markers, currentUser]);

const getUserLocation = () => {
if (!navigator.geolocation) {
alert('Geolocation is not supported by your browser');
return;
}

setGettingLocation(true);
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    if (latitude >= 17.7 && latitude <= 18.6 && longitude >= -78.4 && longitude <= -76.1) {
      setUserLocation({ lat: latitude, lng: longitude });
      mapInstanceRef.current.setView([latitude, longitude], 13, { animate: true });
      onLocationMarker(latitude, longitude);
    } else alert('You appear to be outside of Jamaica.');
    setGettingLocation(false);
  },
  (err) => {
    console.error('Error getting location:', err);
    alert('Unable to get your location.');
    setGettingLocation(false);
  },
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
);


};

return (
<div className="map-container">
<div ref={mapRef} className="leaflet-map" />
<div className="marker-legend">
<h4>Marker Types</h4>
<div className="legend-items">
<div className="legend-item"><span className="legend-dot event"></span><span>Event</span></div>
<div className="legend-item"><span className="legend-dot obstacle"></span><span>Obstacle</span></div>
<div className="legend-item"><span className="legend-dot object"></span><span>Object</span></div>
<div className="legend-item"><span className="legend-dot alert"></span><span>Alert</span></div>
</div>
</div>

  <button
    className="use-location-btn"
    onClick={getUserLocation}
    disabled={gettingLocation}
    title="Use my current location to add marker"
  >
    {gettingLocation ? '📍 Getting location...' : '📍 Use My Location to Add Marker'}
  </button>

  <div className="map-instructions">
    <p>📍 Use your device location to add credible markers!</p>
  </div>
</div>


);
};

export default MapView;

