import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import './MapView.css';

const JAMAICA_CENTER = [18.1096, -77.2975];

// Jamaica parishes
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

// Accurate Jamaica coastline GeoJSON
const JAMAICA_OUTLINE = {"type":"Feature","properties":{"name":"Jamaica"},"geometry":{"type":"Polygon","coordinates":[[[-77.569,18.490],[-77.500,18.505],[-77.431,18.513],[-77.361,18.518],[-77.291,18.520],[-77.221,18.518],[-77.151,18.513],[-77.082,18.505],[-77.014,18.494],[-76.947,18.481],[-76.882,18.466],[-76.818,18.449],[-76.756,18.430],[-76.695,18.410],[-76.636,18.388],[-76.579,18.365],[-76.524,18.341],[-76.471,18.316],[-76.420,18.290],[-76.371,18.263],[-76.325,18.236],[-76.281,18.208],[-76.240,18.179],[-76.201,18.150],[-76.165,18.120],[-76.180,18.080],[-76.195,18.040],[-76.207,18.000],[-76.217,17.960],[-76.224,17.920],[-76.228,17.880],[-76.228,17.840],[-76.225,17.800],[-76.218,17.761],[-76.280,17.753],[-76.343,17.748],[-76.407,17.746],[-76.471,17.747],[-76.536,17.751],[-76.600,17.758],[-76.664,17.768],[-76.728,17.780],[-76.791,17.795],[-76.853,17.812],[-76.914,17.831],[-76.974,17.852],[-77.033,17.875],[-77.091,17.899],[-77.147,17.925],[-77.202,17.952],[-77.256,17.980],[-77.308,18.009],[-77.359,18.039],[-77.408,18.070],[-77.455,18.101],[-77.501,18.133],[-77.545,18.165],[-77.588,18.197],[-77.629,18.229],[-77.668,18.261],[-77.706,18.293],[-77.742,18.324],[-77.776,18.355],[-77.809,18.385],[-77.840,18.414],[-77.869,18.443],[-77.897,18.470],[-77.923,18.496],[-77.947,18.521],[-77.970,18.545],[-77.991,18.567],[-78.011,18.587],[-78.029,18.606],[-78.046,18.623],[-78.062,18.638],[-78.076,18.651],[-78.089,18.663],[-78.101,18.673],[-78.112,18.681],[-78.122,18.688],[-78.131,18.693],[-78.140,18.696],[-78.148,18.697],[-78.156,18.697],[-78.164,18.695],[-78.172,18.691],[-78.180,18.686],[-78.188,18.680],[-78.196,18.672],[-78.204,18.663],[-78.212,18.653],[-78.220,18.642],[-78.228,18.630],[-78.236,18.617],[-78.244,18.604],[-78.252,18.590],[-78.260,18.575],[-78.268,18.560],[-78.276,18.545],[-78.284,18.530],[-78.292,18.514],[-78.299,18.498],[-78.306,18.482],[-78.313,18.466],[-78.319,18.450],[-78.325,18.434],[-78.330,18.417],[-78.335,18.401],[-78.339,18.385],[-78.343,18.368],[-78.346,18.352],[-78.349,18.336],[-78.351,18.320],[-78.352,18.304],[-78.353,18.288],[-78.353,18.272],[-78.352,18.256],[-78.300,18.270],[-78.247,18.283],[-78.194,18.295],[-78.141,18.305],[-78.087,18.314],[-78.033,18.321],[-77.979,18.327],[-77.925,18.331],[-77.871,18.333],[-77.817,18.334],[-77.763,18.333],[-77.709,18.330],[-77.655,18.326],[-77.602,18.320],[-77.549,18.313],[-77.496,18.304],[-77.444,18.294],[-77.392,18.283],[-77.341,18.271],[-77.291,18.258],[-77.241,18.244],[-77.192,18.229],[-77.144,18.213],[-77.096,18.197],[-77.050,18.180],[-77.004,18.162],[-76.960,18.144],[-76.916,18.126],[-76.874,18.107],[-76.832,18.088],[-76.792,18.068],[-76.753,18.048],[-76.715,18.028],[-76.678,18.008],[-76.642,17.987],[-76.608,17.967],[-76.574,17.946],[-76.542,17.925],[-76.511,17.904],[-76.481,17.883],[-76.453,17.862],[-76.425,17.841],[-76.399,17.820],[-76.374,17.799],[-76.350,17.778],[-76.327,17.757],[-76.305,17.736],[-76.284,17.715],[-76.265,17.694],[-76.246,17.674],[-76.229,17.654],[-76.213,17.634],[-76.198,17.614],[-76.185,17.595],[-76.172,17.576],[-76.161,17.557],[-76.180,17.550],[-76.200,17.544],[-76.220,17.540],[-76.240,17.537],[-76.260,17.535],[-76.280,17.535],[-76.300,17.536],[-76.320,17.539],[-76.340,17.543],[-76.360,17.549],[-76.460,17.570],[-76.560,17.595],[-76.660,17.625],[-76.760,17.658],[-76.860,17.695],[-76.960,17.735],[-77.060,17.778],[-77.160,17.825],[-77.260,17.875],[-77.360,17.928],[-77.460,17.985],[-77.560,18.045],[-77.660,18.108],[-77.760,18.175],[-77.850,18.242],[-77.930,18.310],[-78.000,18.378],[-78.060,18.445],[-78.110,18.510],[-78.150,18.572],[-78.180,18.630],[-78.200,18.684],[-78.210,18.733],[-78.210,18.777],[-78.200,18.815],[-78.180,18.848],[-78.150,18.875],[-78.110,18.897],[-78.060,18.913],[-78.000,18.924],[-77.930,18.930],[-77.850,18.930],[-77.760,18.925],[-77.660,18.915],[-77.569,18.490]]]}};

const getMarkerColor = (category) => {
  const colors = {
    event: '#00A8E8',
    obstacle: '#FFB627',
    object: '#00C9A7',
    alert: '#FF6B6B'
  };
  return colors[category] || '#00C9A7';
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
  const labelsLayerRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(9);

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
          maxZoom: 16,
          className: 'neon-map-dark'
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 16,
          className: 'neon-map-light'
        });

    tileLayer.addTo(map);

    // Handle map clicks - disabled for marker creation (location required)
    map.on('click', (e) => {
      // Do nothing - markers can only be added via geolocation
    });

    // Track zoom changes
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    labelsLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer on dark mode change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    // Remove all tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add appropriate tile layer for mode
    const tileLayer = darkMode
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 16,
          className: 'map-tiles'
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 16,
          className: 'map-tiles'
        });

    tileLayer.addTo(map);

    // Update outline color
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        layer.setStyle({
          color: darkMode ? '#555555' : '#cccccc',
          weight: 2,
          opacity: 0.6
        });
      }
    });
  }, [darkMode]);
  // Update labels based on zoom
  useEffect(() => {
    if (!labelsLayerRef.current || !mapInstanceRef.current) return;

    labelsLayerRef.current.clearLayers();

    // Show parishes at low zoom
    if (currentZoom <= 9) {
      JAMAICA_PARISHES.forEach(parish => {
        const parishLabel = L.divIcon({
          html: `<div class="parish-label">${parish.name}</div>`,
          className: 'custom-label-icon',
          iconSize: [150, 30],
          iconAnchor: [75, 15]
        });
        L.marker(parish.coords, { icon: parishLabel }).addTo(labelsLayerRef.current);
      });
    }
    // Show towns at medium/high zoom
    else {
      JAMAICA_TOWNS.forEach(town => {
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

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const color = getMarkerColor(marker.category);
      
      // Create color-coded dot marker
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
        <div class="marker-popup" data-testid="marker-popup-${marker.id}">
          <h3>${marker.title}</h3>
          <p class="category-badge ${marker.category}">${marker.category.toUpperCase()}</p>
          <p class="description">${marker.description}</p>
          ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="marker-image" />` : ''}
          <p class="location-coords">📍 ${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}</p>
          <p class="user-info">Posted by: ${marker.user_email}</p>
          <p class="date-info">🕒 ${updateTime}</p>
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

    window.deleteMarker = (markerId) => {
      if (window.confirm('Are you sure you want to delete this marker?')) {
        onDeleteMarker(markerId);
      }
    };
  }, [markers, currentUser]);

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
        
        if (latitude >= 17.7 && latitude <= 18.6 && 
            longitude >= -78.4 && longitude <= -76.1) {
          setUserLocation({ lat: latitude, lng: longitude });
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 13, { animate: true });
          }
          
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

  return (
    <div className="map-container" data-testid="map-container">
      <div ref={mapRef} className="leaflet-map" />
      
      <button
        className="use-location-btn"
        onClick={getUserLocation}
        disabled={gettingLocation}
        data-testid="use-location-btn"
        title="Use my current location"
      >
        {gettingLocation ? (
          <span className="location-spinner">📍</span>
        ) : (
          <>📍 Use My Location</>
        )}
      </button>
      
      <div className="map-instructions">
        <p>📍 Click anywhere on the map to add a marker!</p>
      </div>
    </div>
  );
};

export default MapView;
