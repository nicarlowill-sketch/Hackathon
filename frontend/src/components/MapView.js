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

// Jamaica outline GeoJSON (accurate)
const JAMAICA_OUTLINE = {
  "type": "Feature",
  "properties": { "name": "Jamaica" },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-78.366, 18.225], [-78.338, 18.275], [-78.293, 18.315], [-78.237, 18.347],
      [-78.170, 18.392], [-78.126, 18.421], [-78.069, 18.446], [-78.007, 18.467],
      [-77.931, 18.487], [-77.867, 18.497], [-77.799, 18.503], [-77.724, 18.506],
      [-77.645, 18.505], [-77.564, 18.499], [-77.481, 18.490], [-77.398, 18.478],
      [-77.314, 18.465], [-77.229, 18.451], [-77.144, 18.438], [-77.058, 18.427],
      [-76.972, 18.419], [-76.887, 18.414], [-76.802, 18.412], [-76.718, 18.412],
      [-76.634, 18.414], [-76.551, 18.417], [-76.469, 18.420], [-76.389, 18.423],
      [-76.310, 18.425], [-76.233, 18.424], [-76.159, 18.420], [-76.188, 18.375],
      [-76.217, 18.329], [-76.243, 18.282], [-76.265, 18.234], [-76.282, 18.186],
      [-76.294, 18.137], [-76.300, 18.088], [-76.299, 18.039], [-76.292, 17.990],
      [-76.280, 17.942], [-76.263, 17.895], [-76.241, 17.849], [-76.215, 17.805],
      [-76.186, 17.763], [-76.267, 17.755], [-76.349, 17.751], [-76.431, 17.750],
      [-76.514, 17.753], [-76.596, 17.759], [-76.678, 17.768], [-76.760, 17.779],
      [-76.841, 17.793], [-76.921, 17.809], [-77.000, 17.827], [-77.078, 17.846],
      [-77.154, 17.867], [-77.229, 17.889], [-77.303, 17.912], [-77.375, 17.936],
      [-77.446, 17.961], [-77.515, 17.986], [-77.582, 18.012], [-77.648, 18.038],
      [-77.712, 18.065], [-77.774, 18.092], [-77.834, 18.119], [-77.893, 18.145],
      [-77.949, 18.172], [-78.004, 18.197], [-78.056, 18.221], [-78.107, 18.244],
      [-78.155, 18.266], [-78.201, 18.287], [-78.245, 18.305], [-78.287, 18.321],
      [-78.327, 18.335], [-78.348, 18.282], [-78.362, 18.254], [-78.366, 18.225]
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
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

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

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Check if user is in Jamaica (approximate bounds)
        if (latitude >= 17.7 && latitude <= 18.6 && 
            longitude >= -78.4 && longitude <= -76.1) {
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Center map on user location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 13, { animate: true });
          }
          
          // Automatically trigger add marker
          onMapClick(latitude, longitude);
        } else {
          alert('You appear to be outside of Jamaica. This app is for Jamaica locations only.');
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

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