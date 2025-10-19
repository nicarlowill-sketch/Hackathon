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
    event: '#2d5016',      // Jamaican green for events
    traffic: '#1a365d',    // Jamaican blue for traffic
    hazard: '#dc2626',     // Red for hazards
    weather: '#059669',    // Green for weather
    crime: '#ea580c',      // Orange for crime
    food: '#d97706',       // Orange for food
    service: '#8b5cf6',    // Purple for services
    object: '#059669'      // Green for objects
  };
  return colors[category] || '#059669';
};

const getMarkerSize = (urgency) => {
  const sizes = {
    low: 6,
    normal: 8,
    high: 12,
    critical: 16
  };
  return sizes[urgency] || 8;
};

// Helper: safely normalize marker input
const normalizeMarkers = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
};

const MapView = ({
  markers,
  selectedMarker,
  onMarkerClick,
  onMapClick,
  onLocationMarker,
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
  const [selectedParish, setSelectedParish] = useState(null);

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

    // Add map click handler
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
          maxZoom: 16
        })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 16
        });

    tileLayer.addTo(map);
  }, [darkMode]);

  // Render parish and town labels
  useEffect(() => {
    if (!labelsLayerRef.current || !mapInstanceRef.current) return;
    
    labelsLayerRef.current.clearLayers();

    // Only show parish labels if not in a specific parish view
    if (!selectedParish && currentZoom <= 9) {
      JAMAICA_PARISHES.forEach((parish) => {
        const parishLabel = L.divIcon({
          html: `<div class="parish-label clickable-parish" data-parish="${parish.name}">${parish.name}</div>`,
          className: 'custom-label-icon',
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        });
        
        const marker = L.marker(parish.coords, { icon: parishLabel });
        
        // Add click event to zoom to parish
        marker.on('click', (e) => {
          console.log(`Clicked on ${parish.name} parish`);
          setSelectedParish(parish.name);
          
          // Add visual feedback
          e.target.getElement().style.transform = 'scale(0.95)';
          setTimeout(() => {
            if (e.target.getElement()) {
              e.target.getElement().style.transform = 'scale(1)';
            }
          }, 150);
          
          mapInstanceRef.current.setView(parish.coords, 12, {
            animate: true,
            duration: 1.5
          });
          
          if (onParishClick) {
            onParishClick(parish.name);
          }
        });
        
        marker.addTo(labelsLayerRef.current);
      });
    } else if (!selectedParish) {
      JAMAICA_TOWNS.forEach((town) => {
        if (currentZoom >= town.minZoom) {
          const townLabel = L.divIcon({
            html: `<div class="town-label">${town.name}</div>`,
            className: 'custom-label-icon',
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          });
          L.marker(town.coords, { icon: townLabel }).addTo(labelsLayerRef.current);
        }
      });
    }
  }, [currentZoom, selectedParish, onParishClick]);

  // Handle map zoom changes and parish exit detection
  useEffect(() => {
    if (mapInstanceRef.current) {
      const handleZoom = () => {
        const newZoom = mapInstanceRef.current.getZoom();
        setCurrentZoom(newZoom);
        
        // Exit parish view if zoomed out too far
        if (selectedParish && newZoom < 10) {
          setSelectedParish(null);
          if (onParishClick) {
            onParishClick(null);
          }
        }
      };
      
      const handleMove = () => {
        if (selectedParish) {
          const center = mapInstanceRef.current.getCenter();
          const parish = JAMAICA_PARISHES.find(p => p.name === selectedParish);
          if (parish) {
            const distance = center.distanceTo(L.latLng(parish.coords));
            // Exit parish if moved too far away (about 50km)
            if (distance > 50000) {
              setSelectedParish(null);
              if (onParishClick) {
                onParishClick(null);
              }
            }
          }
        }
      };
      
      mapInstanceRef.current.on('zoomend', handleZoom);
      mapInstanceRef.current.on('moveend', handleMove);
      
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off('zoomend', handleZoom);
          mapInstanceRef.current.off('moveend', handleMove);
        }
      };
    }
  }, [selectedParish, onParishClick]);

  // Render markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const safeMarkers = normalizeMarkers(markers);
    
    safeMarkers.forEach((marker) => {
      if (!marker || !marker.latitude || !marker.longitude) return;
      
      const color = getMarkerColor(marker.category);
      const markerSize = getMarkerSize(marker.urgency);
      
      const leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
        radius: markerSize,
        fillColor: color,
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'pulse-marker'
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
    });

    // Set up global delete function
    window.deleteMarker = (markerId) => {
      if (window.confirm('Are you sure you want to delete this marker?')) {
        onDeleteMarker(markerId);
      }
    };
  }, [markers, currentUser, onMarkerClick, onDeleteMarker]);

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
        mapInstanceRef.current.setView([latitude, longitude], 14);
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

  return (
    <div className="map-container" data-testid="map-view">
      <div ref={mapRef} className="leaflet-map"></div>
      <Button
        className="locate-me-button"
        onClick={getUserLocation}
        disabled={gettingLocation}
        data-testid="locate-me-button"
      >
        {gettingLocation ? 'Locating...' : 'Use My Location'}
      </Button>
    </div>
  );
};

export default MapView;