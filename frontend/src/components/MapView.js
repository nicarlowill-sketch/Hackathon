import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import './MapView.css';

const JAMAICA_CENTER = [18.1096, -77.2975];

// Jamaica parishes and major cities with coordinates
const JAMAICA_LOCATIONS = [
  { name: 'Kingston', type: 'capital', coords: [18.0179, -76.8099], parish: 'Kingston' },
  { name: 'Montego Bay', type: 'city', coords: [18.4762, -77.8939], parish: 'St. James' },
  { name: 'Spanish Town', type: 'city', coords: [17.9911, -76.9567], parish: 'St. Catherine' },
  { name: 'Portmore', type: 'city', coords: [17.9546, -76.8827], parish: 'St. Catherine' },
  { name: 'Mandeville', type: 'city', coords: [18.0412, -77.5055], parish: 'Manchester' },
  { name: 'Ocho Rios', type: 'city', coords: [18.4052, -77.1034], parish: 'St. Ann' },
  { name: 'Port Antonio', type: 'city', coords: [18.1773, -76.4528], parish: 'Portland' },
  { name: 'Negril', type: 'city', coords: [18.2687, -78.3481], parish: 'Westmoreland' },
  { name: 'May Pen', type: 'city', coords: [17.9645, -77.2419], parish: 'Clarendon' },
  { name: 'Savanna-la-Mar', type: 'city', coords: [18.2189, -78.1326], parish: 'Westmoreland' },
  { name: 'Falmouth', type: 'city', coords: [18.4919, -77.6561], parish: 'Trelawny' },
  { name: 'Morant Bay', type: 'city', coords: [17.8814, -76.4092], parish: 'St. Thomas' },
  { name: 'Black River', type: 'city', coords: [18.0261, -77.8514], parish: 'St. Elizabeth' },
  { name: 'Lucea', type: 'city', coords: [18.4509, -78.1736], parish: 'Hanover' }
];

// Jamaica outline GeoJSON (simplified)
const JAMAICA_OUTLINE = {
  "type": "Feature",
  "properties": { "name": "Jamaica" },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-78.3690, 18.2690], [-78.2200, 18.4500], [-77.8800, 18.4900],
      [-77.5800, 18.4800], [-77.2000, 18.5200], [-76.9000, 18.5000],
      [-76.5000, 18.4200], [-76.2000, 18.3500], [-76.1800, 18.1500],
      [-76.2500, 17.9000], [-76.5000, 17.8500], [-76.8700, 17.8600],
      [-77.2000, 17.8800], [-77.5500, 17.9200], [-77.8000, 18.0000],
      [-78.2000, 18.1000], [-78.3600, 18.2000], [-78.3690, 18.2690]
    ]]
  }
};

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
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Jamaica bounds to restrict view
    const jamaicaBounds = [
      [17.7, -78.4],  // Southwest
      [18.6, -76.1]   // Northeast
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

    // Add vibrant neon tile layer
    const tileLayer = darkMode
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 16,
          className: 'neon-map-dark'
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 16,
          className: 'neon-map-light'
        });

    tileLayer.addTo(map);

    // Add Jamaica outline with vibrant neon border
    const jamaicaOutlineLayer = L.geoJSON(JAMAICA_OUTLINE, {
      style: {
        color: darkMode ? '#00E5FF' : '#00C9A7',
        weight: 5,
        opacity: 1,
        fillColor: 'transparent',
        fillOpacity: 0,
        className: 'jamaica-outline'
      }
    }).addTo(map);

    // Add location markers for parishes and cities
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

      const locationMarker = L.marker(location.coords, { icon: locationIcon });
      
      locationMarker.on('click', () => {
        setSelectedLocation(location);
        map.setView(location.coords, 11, { animate: true });
      });

      locationMarker.addTo(map);
    });

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
          maxZoom: 16,
          className: 'neon-map-dark'
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 16,
          className: 'neon-map-light'
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
      
      {/* Location Info Panel */}
      {selectedLocation && (
        <div className="location-info-panel" data-testid="location-info-panel">
          <button 
            className="close-location-btn"
            onClick={() => setSelectedLocation(null)}
            data-testid="close-location-btn"
          >
            ×
          </button>
          <h3>{selectedLocation.name}</h3>
          <p className="parish-name">Parish of {selectedLocation.parish}</p>
          <p className="location-type">
            {selectedLocation.type === 'capital' ? '🏛️ Capital City' : '🏙️ Major City'}
          </p>
          <div className="location-markers-count">
            {markers.filter(m => 
              Math.abs(m.latitude - selectedLocation.coords[0]) < 0.1 && 
              Math.abs(m.longitude - selectedLocation.coords[1]) < 0.1
            ).length} markers in this area
          </div>
        </div>
      )}
      
      <div className="map-instructions">
        <p>📍 Click anywhere on the map to add a marker!</p>
      </div>
    </div>
  );
};

export default MapView;