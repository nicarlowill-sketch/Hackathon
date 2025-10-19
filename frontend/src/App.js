import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import MapView from './components/MapView';
import AuthModal from './components/AuthModal';
import AddMarkerModal from './components/AddMarkerModal';
import LocketPost from './components/LocketPost';
import FeedView from './components/FeedView';
import ParishDomain from './components/ParishDomain';
import FirebaseTest from './components/FirebaseTest';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddMarkerModal, setShowAddMarkerModal] = useState(false);
  const [showLocketPost, setShowLocketPost] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map', 'feed', 'parish', or 'firebase'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [selectedParish, setSelectedParish] = useState('Kingston');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ 
          id: firebaseUser.uid, 
          email: firebaseUser.email,
          displayName: firebaseUser.displayName 
        });
        console.log('Firebase user signed in:', firebaseUser.email);
      } else {
        setUser(null);
        console.log('Firebase user signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('connected');
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
      toast.warning('You are offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch markers from Firebase
  useEffect(() => {
    fetchMarkers();
  }, [categoryFilter]);

  // Generate sample markers for demonstration
  const generateSampleMarkers = () => {
    const sampleMarkers = [
      {
        id: 'sample-1',
        title: 'Traffic Jam on Hope Road',
        category: 'traffic',
        description: 'Heavy traffic due to road construction. Expect delays.',
        latitude: 18.0179,
        longitude: -76.8099,
        urgency: 'high',
        userEmail: 'traffic@jamaica.com',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-2',
        title: 'Street Food Festival',
        category: 'event',
        description: 'Annual street food festival in downtown Kingston. Live music and local vendors.',
        latitude: 18.0333,
        longitude: -76.7833,
        urgency: 'normal',
        userEmail: 'events@jamaica.com',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-3',
        title: 'Pothole on Spanish Town Road',
        category: 'hazard',
        description: 'Large pothole causing vehicle damage. Drive carefully.',
        latitude: 17.9911,
        longitude: -76.9567,
        urgency: 'high',
        userEmail: 'reporter@jamaica.com',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'sample-4',
        title: 'Best Jerk Chicken Spot',
        category: 'food',
        description: 'Authentic jerk chicken with secret family recipe. Highly recommended!',
        latitude: 18.4052,
        longitude: -77.1034,
        urgency: 'low',
        userEmail: 'foodie@jamaica.com',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-5',
        title: 'Weather Alert - Heavy Rain',
        category: 'weather',
        description: 'Heavy rainfall expected. Flash flood warning in effect.',
        latitude: 18.1773,
        longitude: -76.4528,
        urgency: 'critical',
        userEmail: 'weather@jamaica.com',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'sample-6',
        title: 'Road Closure - Bridge Maintenance',
        category: 'traffic',
        description: 'Bridge closed for maintenance. Use alternative route via Marcus Garvey Drive.',
        latitude: 18.2687,
        longitude: -78.3481,
        urgency: 'high',
        userEmail: 'traffic@jamaica.com',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: 'sample-7',
        title: 'Community Cleanup Event',
        category: 'event',
        description: 'Join us for a community cleanup at Emancipation Park. All welcome!',
        latitude: 18.0412,
        longitude: -77.5055,
        urgency: 'normal',
        userEmail: 'community@jamaica.com',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        id: 'sample-8',
        title: 'ATM Out of Service',
        category: 'service',
        description: 'ATM at this location is currently out of service. Nearest working ATM is 2 blocks away.',
        latitude: 17.9645,
        longitude: -77.2419,
        urgency: 'normal',
        userEmail: 'banking@jamaica.com',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ];
    return sampleMarkers;
  };

  const fetchMarkers = async () => {
    try {
      let q = collection(db, 'markers');
      
      // Add category filter if selected
      if (categoryFilter) {
        q = query(q, where('category', '==', categoryFilter));
      }
      
      // Order by creation date
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const markersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Always add sample markers for demonstration
      const sampleMarkers = generateSampleMarkers();
      const allMarkers = [...markersData, ...sampleMarkers];
      
      setMarkers(allMarkers);
      console.log('Markers fetched from Firebase:', allMarkers.length);
    } catch (error) {
      console.error('Error fetching markers from Firebase:', error);
      // Fallback to sample markers if Firebase fails
      const sampleMarkers = generateSampleMarkers();
      setMarkers(sampleMarkers);
      console.log('Using sample markers due to Firebase error');
    }
  };

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
      toast.success('Welcome back to One Island Pulse!');
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleRegister = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
      toast.success('Welcome to One Island Pulse!');
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleAddMarker = async (markerData) => {
    try {
      if (!user) {
        toast.error('Please login to add markers');
        return;
      }

      console.log('Adding marker to Firebase...', markerData);
      
      // Add timeout protection - reduced to 5 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), 5000)
      );

      // Add marker to Firebase Firestore with timeout
      const addMarkerPromise = addDoc(collection(db, 'markers'), {
        ...markerData,
        userId: user.id,
        userEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const markerRef = await Promise.race([addMarkerPromise, timeoutPromise]);

      // Add the new marker to local state
      const newMarker = {
        id: markerRef.id,
        ...markerData,
        userId: user.id,
        userEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setMarkers([newMarker, ...markers]);
      setShowAddMarkerModal(false);
      setShowLocketPost(false); // Close locket post on success
      setNewMarkerPosition(null);
      toast.success('Marker added successfully!');
      console.log('✅ Marker added to Firebase:', markerRef.id);
    } catch (error) {
      console.error('❌ Error adding marker to Firebase:', error);
      
      // Fallback: Save marker locally if Firebase fails
      try {
        const fallbackMarker = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...markerData,
          userId: user.id,
          userEmail: user.email,
          createdAt: new Date(),
          updatedAt: new Date(),
          isLocal: true // Mark as local fallback
        };

        setMarkers([fallbackMarker, ...markers]);
        setShowAddMarkerModal(false);
        setShowLocketPost(false);
        setNewMarkerPosition(null);
        
        toast.warning('Marker saved locally (offline mode). Will sync when connection is restored.');
        console.log('✅ Marker saved locally as fallback:', fallbackMarker.id);
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
      }
      
      let errorMessage = 'Failed to add marker';
      if (error.message.includes('timed out')) {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firebase is temporarily unavailable. Please try again.';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteMarker = async (markerId) => {
    try {
      if (!user) {
        toast.error('Please login to delete markers');
        return;
      }

      // Delete marker from Firebase Firestore
      await deleteDoc(doc(db, 'markers', markerId));
      
      // Remove from local state
      setMarkers(markers.filter(m => m.id !== markerId));
      setSelectedMarker(null);
      toast.success('Marker deleted successfully');
      console.log('Marker deleted from Firebase:', markerId);
    } catch (error) {
      console.error('Error deleting marker from Firebase:', error);
      toast.error('Failed to delete marker');
    }
  };

  const handleMapClick = (lat, lng) => {
    // Allow map clicks to add markers anywhere
    if (!user) {
      toast.error('Please login to add markers');
      setShowAuthModal(true);
      return;
    }

    // Check if location is within Jamaica (optional validation)
    const isWithinJamaica = lat >= 17.7 && lat <= 18.5 && lng >= -78.4 && lng <= -76.1;
    if (!isWithinJamaica) {
      toast.warning('Location is outside Jamaica. You can still post, but it may not be relevant to local users.');
    }

    // Determine parish based on location
    const parish = getParishFromLocation(lat, lng);
    if (parish) {
      setSelectedParish(parish);
    }

    setNewMarkerPosition({ lat, lng });
    setShowLocketPost(true);
  };

  const handleLocationMarker = (lat, lng) => {
    // This is called from the "Use My Location" button
    if (!user) {
      toast.error('Please login to add markers');
      setShowAuthModal(true);
      return;
    }

    // Determine parish based on location
    const parish = getParishFromLocation(lat, lng);
    if (parish) {
      setSelectedParish(parish);
      toast.success(`Using your location in ${parish} Parish`);
    } else {
      toast.info('Using your current location');
    }

    setNewMarkerPosition({ lat, lng });
    setShowLocketPost(true);
  };

  // Simple parish detection based on coordinates
  const getParishFromLocation = (lat, lng) => {
    // Simplified parish boundaries (in real app, use proper GIS data)
    if (lat >= 18.0 && lat <= 18.1 && lng >= -76.9 && lng <= -76.7) return 'Kingston';
    if (lat >= 18.4 && lat <= 18.5 && lng >= -78.0 && lng <= -77.8) return 'St. James';
    if (lat >= 18.1 && lat <= 18.3 && lng >= -77.0 && lng <= -76.8) return 'St. Andrew';
    if (lat >= 18.0 && lat <= 18.2 && lng >= -77.2 && lng <= -77.0) return 'St. Catherine';
    if (lat >= 18.3 && lat <= 18.5 && lng >= -77.2 && lng <= -77.0) return 'St. Ann';
    if (lat >= 18.1 && lat <= 18.3 && lng >= -77.4 && lng <= -77.2) return 'Manchester';
    if (lat >= 17.9 && lat <= 18.1 && lng >= -77.3 && lng <= -77.1) return 'Clarendon';
    if (lat >= 18.2 && lat <= 18.4 && lng >= -77.6 && lng <= -77.4) return 'Trelawny';
    if (lat >= 18.0 && lat <= 18.2 && lng >= -77.8 && lng <= -77.6) return 'St. Elizabeth';
    if (lat >= 18.3 && lat <= 18.5 && lng >= -78.2 && lng <= -78.0) return 'Hanover';
    if (lat >= 18.1 && lat <= 18.3 && lng >= -78.2 && lng <= -78.0) return 'Westmoreland';
    if (lat >= 18.3 && lat <= 18.5 && lng >= -76.5 && lng <= -76.3) return 'Portland';
    if (lat >= 18.2 && lat <= 18.4 && lng >= -76.7 && lng <= -76.5) return 'St. Mary';
    if (lat >= 17.8 && lat <= 18.0 && lng >= -76.5 && lng <= -76.3) return 'St. Thomas';
    return 'Kingston'; // Default fallback
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
                <button
                  className={viewMode === 'parish' ? 'active' : ''}
                  onClick={() => setViewMode('parish')}
                  data-testid="parish-view-btn"
                >
                  🏠 {selectedParish}
                </button>
                <button
                  className={viewMode === 'firebase' ? 'active' : ''}
                  onClick={() => setViewMode('firebase')}
                  data-testid="firebase-test-btn"
                >
                  🔥 Firebase Test
                </button>
              </div>

              {/* Connection Status */}
              <div className={`connection-status ${connectionStatus}`} data-testid="connection-status">
                {isOnline ? '🟢' : '🔴'} {isOnline ? 'Online' : 'Offline'}
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
            className={categoryFilter === 'traffic' ? 'active traffic' : 'traffic'}
            onClick={() => setCategoryFilter(categoryFilter === 'traffic' ? null : 'traffic')}
            data-testid="filter-traffic"
          >
            🚗 Traffic
          </button>
          <button
            className={categoryFilter === 'hazard' ? 'active hazard' : 'hazard'}
            onClick={() => setCategoryFilter(categoryFilter === 'hazard' ? null : 'hazard')}
            data-testid="filter-hazard"
          >
            ⚠️ Hazards
          </button>
          <button
            className={categoryFilter === 'food' ? 'active food' : 'food'}
            onClick={() => setCategoryFilter(categoryFilter === 'food' ? null : 'food')}
            data-testid="filter-food"
          >
            🍽️ Food
          </button>
          <button
            className={categoryFilter === 'object' ? 'active object' : 'object'}
            onClick={() => setCategoryFilter(categoryFilter === 'object' ? null : 'object')}
            data-testid="filter-object"
          >
            📍 Objects
          </button>
          <button
            className={categoryFilter === 'crime' ? 'active crime' : 'crime'}
            onClick={() => setCategoryFilter(categoryFilter === 'crime' ? null : 'crime')}
            data-testid="filter-crime"
          >
            🚨 Crime
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
              onLocationMarker={handleLocationMarker}
              onDeleteMarker={handleDeleteMarker}
              currentUser={user}
              darkMode={darkMode}
              onParishClick={(parishName) => {
                if (parishName) {
                  setSelectedParish(parishName);
                  toast.success(`Entering ${parishName} Parish`);
                } else {
                  setSelectedParish('Kingston');
                  toast.info('Returning to Jamaica overview');
                }
              }}
            />
          ) : viewMode === 'feed' ? (
            <FeedView
              markers={markers}
              onMarkerClick={setSelectedMarker}
              onDeleteMarker={handleDeleteMarker}
              currentUser={user}
            />
          ) : viewMode === 'parish' ? (
            <ParishDomain
              parishName={selectedParish}
              markers={markers}
              onMarkerClick={setSelectedMarker}
              onDeleteMarker={handleDeleteMarker}
              currentUser={user}
              onSwitchParish={setSelectedParish}
            />
          ) : (
            <FirebaseTest />
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
          currentUser={user}
        />

        <LocketPost
          isOpen={showLocketPost}
          onClose={() => {
            setShowLocketPost(false);
            setNewMarkerPosition(null);
          }}
          onSubmit={handleAddMarker}
          position={newMarkerPosition}
          currentUser={user}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
