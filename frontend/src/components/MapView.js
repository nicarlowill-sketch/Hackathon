import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, MapPin } from 'lucide-react';
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
    event: '#00ffff',      // Neon cyan for events
    traffic: '#00a8e8',    // Neon blue for traffic
    hazard: '#ff6b6b',     // Neon red for hazards
    weather: '#00c9a7',    // Neon green for weather
    crime: '#ffa500',      // Neon orange for crime
    food: '#ffd700',       // Neon yellow for food
    service: '#8b5cf6',    // Purple for services
    object: '#00ff88'      // Neon green for objects
  };
  return colors[category] || '#00ff88';
};

const getMarkerSize = () => {
  // Use a consistent, smaller size for all markers (category-based, not urgency)
  return 6;
};

// Parish icons removed - using default map template

// Helper: safely normalize marker input
const normalizeMarkers = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
};

const MapView = ({
  markers,
  selectedMarker,
  highlightedMarker,
  onMarkerClick,
  onMapClick,
  onLocationMarker,
  onEventMarker,
  onDeleteMarker,
  currentUser,
  darkMode,
  onParishClick
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(9);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const jamaicaBounds = [
      [17.7, -78.4],
      [18.6, -76.1]
    ];

    const map = L.map(mapRef.current, {
      center: JAMAICA_CENTER,
      zoom: 9,
      zoomControl: true,
      minZoom: 8,
      maxZoom: 18,
      maxBounds: jamaicaBounds,
      maxBoundsViscosity: 0.8
    });

    const tileLayer = darkMode
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 18
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 18
        });

    tileLayer.addTo(map);
    map.on('zoomend', () => setCurrentZoom(map.getZoom()));
    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    labelsLayerRef.current = L.layerGroup().addTo(map);

    // Enable map click to add markers
    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [darkMode, onMapClick]);

  // Update tile layer when dark mode changes
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
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 18
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 18
        });

    tileLayer.addTo(map);
  }, [darkMode]);

  // Render parish and town labels (non-interactive)
  useEffect(() => {
    if (!labelsLayerRef.current || !mapInstanceRef.current) return;
    
    labelsLayerRef.current.clearLayers();

    // Parish labels removed - using default map template
    // Show town labels at higher zoom levels
    if (currentZoom >= 10) {
      JAMAICA_TOWNS.forEach((town) => {
        if (currentZoom >= town.minZoom) {
          const townLabel = L.divIcon({
            html: `<div class="town-label">${town.name}</div>`,
            className: 'custom-label-icon',
            iconSize: [70, 18],
            iconAnchor: [35, 9]
          });
          L.marker(town.coords, { icon: townLabel }).addTo(labelsLayerRef.current);
        }
      });
    }
  }, [currentZoom]);

  // Handle map zoom changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const handleZoom = () => {
        const newZoom = mapInstanceRef.current.getZoom();
        setCurrentZoom(newZoom);
      };
      
      mapInstanceRef.current.on('zoomend', handleZoom);
      
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off('zoomend', handleZoom);
        }
      };
    }
  }, []);

  // Handle highlighted marker from feed navigation
  useEffect(() => {
    if (highlightedMarker && mapInstanceRef.current) {
      const markerCoords = [highlightedMarker.latitude, highlightedMarker.longitude];
      
      // Zoom to marker
      mapInstanceRef.current.setView(markerCoords, 14, {
        animate: true,
        duration: 1.5
      });

      // Open popup after zoom animation
      setTimeout(() => {
        // Find the marker element and trigger click to open popup
        const markerElements = document.querySelectorAll('.pulse-marker');
        markerElements.forEach(element => {
          const marker = L.DomEvent.getEventTarget(element);
          if (marker && marker._latlng) {
            const lat = marker._latlng.lat;
            const lng = marker._latlng.lng;
            if (Math.abs(lat - highlightedMarker.latitude) < 0.0001 && 
                Math.abs(lng - highlightedMarker.longitude) < 0.0001) {
              marker.openPopup();
            }
          }
        });
      }, 2000);
    }
  }, [highlightedMarker]);

  // Render markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    console.log('MapView received markers:', markers.length);
    console.log('Markers data:', markers);
    
    markersLayerRef.current.clearLayers();
    const safeMarkers = normalizeMarkers(markers);
    
    console.log('Safe markers after normalization:', safeMarkers.length);
    
    safeMarkers.forEach((marker) => {
      if (!marker || !marker.latitude || !marker.longitude) {
        console.log('Skipping invalid marker:', marker);
        return;
      }
      
      console.log('Creating marker:', marker.title, 'at', marker.latitude, marker.longitude);
      
      const color = getMarkerColor(marker.category);
      const markerSize = getMarkerSize();
      
      const leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
        radius: markerSize,
        fillColor: color,
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'pulse-marker neon-marker'
      });

      const updateTime = new Date(marker.updatedAt || marker.createdAt).toLocaleString();
      const urgencyIcon = {
        low: '🟢',
        normal: '🟡', 
        high: '🟠',
        critical: '🔴'
      }[marker.urgency] || '🟡';
      
      const popupContent = `
        <div class="marker-popup">
          <div class="popup-header">
            <h3>${marker.title}</h3>
            <div class="urgency-badge ${marker.urgency}">
              ${urgencyIcon} ${marker.urgency?.toUpperCase() || 'NORMAL'}
            </div>
          </div>
          <div class="popup-category">
            <span class="category-badge ${marker.category}">${marker.category?.toUpperCase() || 'GENERAL'}</span>
          </div>
          <p class="popup-description">${marker.description || 'No description provided.'}</p>
          ${marker.images && marker.images.length > 0 ? `
            <div class="popup-images">
              ${marker.images.slice(0, 2).map(img => `<img src="${img}" alt="${marker.title}" class="popup-image" />`).join('')}
            </div>
          ` : ''}
          <div class="popup-footer">
            <p class="popup-location">📍 ${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}</p>
            <p class="popup-user">👤 ${marker.userEmail || 'Anonymous'}</p>
            <p class="popup-time">🕒 ${updateTime}</p>
            ${currentUser && currentUser.id === marker.userId ? `
              <button class="delete-btn" onclick="window.deleteMarker('${marker.id}')">🗑️ Delete</button>
            ` : ''}
          </div>
        </div>`;
      
      leafletMarker.bindPopup(popupContent);
      leafletMarker.on('click', () => onMarkerClick(marker));
      leafletMarker.addTo(markersLayerRef.current);
      
      console.log('Marker added to map:', marker.title);
    });

    // Set up global delete function
    window.deleteMarker = (markerId) => {
      if (window.confirm('Are you sure you want to delete this marker?')) {
        onDeleteMarker(markerId);
      }
    };
  }, [markers, currentUser, onMarkerClick, onDeleteMarker]);

  // Search functionality
  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = [];
    const searchTerm = query.toLowerCase();

    // Search parishes
    JAMAICA_PARISHES.forEach(parish => {
      if (parish.name.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'parish',
          name: parish.name,
          coords: parish.coords,
          zoom: 12
        });
      }
    });

    // Search towns
    JAMAICA_TOWNS.forEach(town => {
      if (town.name.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'town',
          name: town.name,
          coords: town.coords,
          zoom: town.minZoom
        });
      }
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (result) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(result.coords, result.zoom, {
        animate: true,
        duration: 2
      });
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationMarker(latitude, longitude);
        mapInstanceRef.current.setView([latitude, longitude], 14, {
          animate: true,
          duration: 1.5
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const addMarkerAtExactLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Use high precision coordinates
        onLocationMarker(latitude, longitude);
        mapInstanceRef.current.setView([latitude, longitude], 16, {
          animate: true,
          duration: 1.5
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location.');
        setGettingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0 
      }
    );
  };

  const addEventMarker = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Call the event marker handler with event type
        onEventMarker(latitude, longitude);
        mapInstanceRef.current.setView([latitude, longitude], 16, {
          animate: true,
          duration: 1.5
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location.');
        setGettingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0 
      }
    );
  };

  return (
    <div className="map-container" data-testid="map-view">
      <div ref={mapRef} className="leaflet-map"></div>
      
      {/* Map Interaction Notice */}
      <div className="location-requirement-notice">
        <div className="notice-content">
          <span className="notice-icon">📍</span>
          <div className="notice-text-container">
            <span className="notice-title">Add Markers</span>
            <span className="notice-subtitle">Click anywhere on the map or use GPS location</span>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="map-search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <Input
            type="text"
            placeholder="Search parishes, towns, or cities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="map-search-input"
            data-testid="map-search-input"
          />
        </div>
        
        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="search-result-item"
                onClick={() => handleSearchResultClick(result)}
              >
                <MapPin size={16} />
                <span className="result-name">{result.name}</span>
                <span className="result-type">{result.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Location and Event Marker Buttons */}
      <div className="marker-buttons-container">
        <button
          className="location-marker-button"
          onClick={addMarkerAtExactLocation}
          disabled={gettingLocation}
          data-testid="location-marker-button"
        >
          {gettingLocation ? (
            <>
              <span className="button-icon">⏳</span>
              <span className="button-text">Getting Location...</span>
            </>
          ) : (
            <>
              <span className="button-icon">🎯</span>
              <span className="button-text">Add Marker at My Location</span>
            </>
          )}
        </button>
        
        <button
          className="event-marker-button"
          onClick={addEventMarker}
          disabled={gettingLocation}
          data-testid="event-marker-button"
        >
          <span className="button-icon">🎉</span>
          <span className="button-text">Add Event Marker</span>
        </button>
      </div>
    </div>
  );
};

export default MapView;