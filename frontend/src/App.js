import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import MapView from './components/MapView';
import AuthModal from './components/AuthModal';
import AddMarkerModal from './components/AddMarkerModal';
import FeedView from './components/FeedView';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddMarkerModal, setShowAddMarkerModal] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'feed'
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.user_id, email: decoded.email });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Fetch markers
  useEffect(() => {
    fetchMarkers();
  }, [categoryFilter]);

  const fetchMarkers = async () => {
    try {
      const url = categoryFilter
        ? `${API}/markers?category=${categoryFilter}`
        : `${API}/markers`;
      const response = await axios.get(url);
      setMarkers(response.data);
    } catch (error) {
      console.error('Error fetching markers:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser({ id: userData.id, email: userData.email });
      setShowAuthModal(false);
      toast.success('Welcome back to One Island Pulse!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  const handleRegister = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser({ id: userData.id, email: userData.email });
      setShowAuthModal(false);
      toast.success('Welcome to One Island Pulse!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleAddMarker = async (markerData) => {
    try {
      const response = await axios.post(`${API}/markers`, markerData);
      setMarkers([...markers, response.data]);
      setShowAddMarkerModal(false);
      setNewMarkerPosition(null);
      toast.success('Marker added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add marker');
      throw error;
    }
  };

  const handleDeleteMarker = async (markerId) => {
    try {
      await axios.delete(`${API}/markers/${markerId}`);
      setMarkers(markers.filter(m => m.id !== markerId));
      setSelectedMarker(null);
      toast.success('Marker deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete marker');
    }
  };

  const handleMapClick = (lat, lng) => {
    if (!user) {
      toast.error('Please login to add markers');
      setShowAuthModal(true);
      return;
    }
    setNewMarkerPosition({ lat, lng });
    setShowAddMarkerModal(true);
  };

  return (
    <BrowserRouter>
      <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
        <Toaster position="top-center" richColors />
        
        {/* Header */}
        <header className="app-header" data-testid="app-header">
          <div className="header-content">
            <div className="logo-section" data-testid="logo-section">
              <div className="pulse-icon">🇯🇲</div>
              <h1 className="app-title">One Island Pulse</h1>
            </div>
            
            <div className="header-actions">
              {/* View Toggle */}
              <div className="view-toggle" data-testid="view-toggle">
                <button
                  className={viewMode === 'map' ? 'active' : ''}
                  onClick={() => setViewMode('map')}
                  data-testid="map-view-btn"
                >
                  🗺️ Map
                </button>
                <button
                  className={viewMode === 'feed' ? 'active' : ''}
                  onClick={() => setViewMode('feed')}
                  data-testid="feed-view-btn"
                >
                  📋 Feed
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                className="dark-mode-toggle"
                onClick={() => setDarkMode(!darkMode)}
                data-testid="dark-mode-toggle"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Auth Button */}
              {user ? (
                <div className="user-menu" data-testid="user-menu">
                  <span className="user-email">{user.email}</span>
                  <button
                    className="btn-logout"
                    onClick={handleLogout}
                    data-testid="logout-btn"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  className="btn-login"
                  onClick={() => setShowAuthModal(true)}
                  data-testid="login-btn"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Category Filter */}
        <div className="category-filter" data-testid="category-filter">
          <button
            className={!categoryFilter ? 'active' : ''}
            onClick={() => setCategoryFilter(null)}
            data-testid="filter-all"
          >
            All
          </button>
          <button
            className={categoryFilter === 'event' ? 'active event' : 'event'}
            onClick={() => setCategoryFilter(categoryFilter === 'event' ? null : 'event')}
            data-testid="filter-event"
          >
            🎉 Events
          </button>
          <button
            className={categoryFilter === 'obstacle' ? 'active obstacle' : 'obstacle'}
            onClick={() => setCategoryFilter(categoryFilter === 'obstacle' ? null : 'obstacle')}
            data-testid="filter-obstacle"
          >
            ⚠️ Obstacles
          </button>
          <button
            className={categoryFilter === 'object' ? 'active object' : 'object'}
            onClick={() => setCategoryFilter(categoryFilter === 'object' ? null : 'object')}
            data-testid="filter-object"
          >
            📍 Objects
          </button>
          <button
            className={categoryFilter === 'alert' ? 'active alert' : 'alert'}
            onClick={() => setCategoryFilter(categoryFilter === 'alert' ? null : 'alert')}
            data-testid="filter-alert"
          >
            🚨 Alerts
          </button>
        </div>

        {/* Main Content */}
        <main className="main-content">
          {viewMode === 'map' ? (
            <MapView
              markers={markers}
              selectedMarker={selectedMarker}
              onMarkerClick={setSelectedMarker}
              onMapClick={handleMapClick}
              onDeleteMarker={handleDeleteMarker}
              currentUser={user}
              darkMode={darkMode}
            />
          ) : (
            <FeedView
              markers={markers}
              onMarkerClick={setSelectedMarker}
              onDeleteMarker={handleDeleteMarker}
              currentUser={user}
            />
          )}
        </main>

        {/* Modals */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />

        <AddMarkerModal
          isOpen={showAddMarkerModal}
          onClose={() => {
            setShowAddMarkerModal(false);
            setNewMarkerPosition(null);
          }}
          onSubmit={handleAddMarker}
          position={newMarkerPosition}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;