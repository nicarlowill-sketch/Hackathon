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
  const [highlightedMarker, setHighlightedMarker] = useState(null);
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
  }, []);

  // Filter markers based on category
  const filteredMarkers = categoryFilter 
    ? markers.filter(marker => marker.category === categoryFilter)
    : markers;
  
  console.log('Total markers in state:', markers.length);
  console.log('Filtered markers:', filteredMarkers.length);
  console.log('Category filter:', categoryFilter);

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
      },
      {
        id: 'sample-8',
        title: 'Street Art Mural - Trench Town',
        category: 'culture',
        description: 'Beautiful new mural celebrating Bob Marley\'s legacy in Trench Town. Perfect for photos!',
        latitude: 17.9911,
        longitude: -76.7833,
        urgency: 'low',
        userEmail: 'art@jamaica.com',
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-9',
        title: 'WiFi Hotspot - New Kingston',
        category: 'service',
        description: 'Free public WiFi available at Emancipation Park. Great for remote work!',
        latitude: 18.0167,
        longitude: -76.7833,
        urgency: 'normal',
        userEmail: 'tech@jamaica.com',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 'sample-10',
        title: 'Lost Dog Found - Spanish Town',
        category: 'service',
        description: 'Found a friendly golden retriever near Spanish Town Square. Contact if this is your dog.',
        latitude: 17.9911,
        longitude: -76.9567,
        urgency: 'normal',
        userEmail: 'help@jamaica.com',
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000)
      },
      {
        id: 'sample-11',
        title: 'Yoga Class - Montego Bay',
        category: 'health',
        description: 'Free yoga session on the beach every morning at 6 AM. All levels welcome!',
        latitude: 18.4667,
        longitude: -77.9167,
        urgency: 'low',
        userEmail: 'wellness@jamaica.com',
        createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-12',
        title: 'ATM Out of Service - Half Way Tree',
        category: 'service',
        description: 'ATM at Half Way Tree Square is not working. Nearest working ATM is at New Kingston.',
        latitude: 18.0167,
        longitude: -76.7833,
        urgency: 'high',
        userEmail: 'banking@jamaica.com',
        createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 60 * 1000)
      },
      {
        id: 'sample-13',
        title: 'Garage Sale - Mandeville',
        category: 'shopping',
        description: 'Huge garage sale with furniture, electronics, and books. Great deals available!',
        latitude: 18.0333,
        longitude: -77.5000,
        urgency: 'normal',
        userEmail: 'sale@jamaica.com',
        createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 32 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-14',
        title: 'Car Wash Service - Portmore',
        category: 'service',
        description: 'Professional car wash and detailing service. Same day service available.',
        latitude: 17.9500,
        longitude: -76.8833,
        urgency: 'low',
        userEmail: 'auto@jamaica.com',
        createdAt: new Date(Date.now() - 34 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 34 * 60 * 60 * 1000)
      },
      {
        id: 'sample-15',
        title: 'Basketball Tournament - Kingston',
        category: 'sports',
        description: 'Street basketball tournament this weekend. Registration open to all teams.',
        latitude: 18.0179,
        longitude: -76.8099,
        urgency: 'normal',
        userEmail: 'sports@jamaica.com',
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-16',
        title: 'Power Outage - May Pen',
        category: 'utility',
        description: 'Scheduled power outage in May Pen area from 2 PM to 6 PM for maintenance.',
        latitude: 18.0167,
        longitude: -76.9500,
        urgency: 'high',
        userEmail: 'jps@jamaica.com',
        createdAt: new Date(Date.now() - 38 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 38 * 60 * 60 * 1000)
      },
      {
        id: 'sample-17',
        title: 'Farmers Market - St. Ann',
        category: 'shopping',
        description: 'Fresh local produce and organic vegetables. Best prices in the area!',
        latitude: 18.4333,
        longitude: -77.2000,
        urgency: 'low',
        userEmail: 'farmers@jamaica.com',
        createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-18',
        title: 'Book Exchange - Spanish Town',
        category: 'education',
        description: 'Free book exchange program. Bring a book, take a book. Great for students!',
        latitude: 17.9911,
        longitude: -76.9567,
        urgency: 'low',
        userEmail: 'books@jamaica.com',
        createdAt: new Date(Date.now() - 42 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 42 * 60 * 60 * 1000)
      },
      {
        id: 'sample-19',
        title: 'Pet Grooming Service - Montego Bay',
        category: 'service',
        description: 'Professional pet grooming and boarding services. Experienced with all breeds.',
        latitude: 18.4667,
        longitude: -77.9167,
        urgency: 'normal',
        userEmail: 'pets@jamaica.com',
        createdAt: new Date(Date.now() - 44 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 44 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-20',
        title: 'Dance Class - Kingston',
        category: 'entertainment',
        description: 'Free dance classes every Tuesday and Thursday. Learn reggae and dancehall moves!',
        latitude: 18.0179,
        longitude: -76.8099,
        urgency: 'normal',
        userEmail: 'dance@jamaica.com',
        createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&h=300&fit=crop']
      },
      {
        id: 'sample-21',
        title: 'Water Shortage - Portmore',
        category: 'utility',
        description: 'Water supply interruption in Portmore area. Water trucks will be available.',
        latitude: 17.9500,
        longitude: -76.8833,
        urgency: 'critical',
        userEmail: 'water@jamaica.com',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },
             {
               id: 'sample-22',
               title: 'Tech Meetup - New Kingston',
               category: 'technology',
               description: 'Monthly tech meetup for developers and entrepreneurs. Networking and presentations.',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'normal',
               userEmail: 'tech@jamaica.com',
               createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop']
             },
             // Additional demo markers for better coverage
             {
               id: 'demo-1',
               title: 'Reggae Concert - Bob Marley Museum',
               category: 'entertainment',
               description: 'Live reggae performance at the Bob Marley Museum. Free admission!',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'normal',
               userEmail: 'music@jamaica.com',
               createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-2',
               title: 'Dunn\'s River Falls - Tourist Alert',
               category: 'tourism',
               description: 'Crowded today! Best time to visit is early morning or late afternoon.',
               latitude: 18.4333,
               longitude: -77.2000,
               urgency: 'normal',
               userEmail: 'tourism@jamaica.com',
               createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-3',
               title: 'Blue Mountain Coffee Tour',
               category: 'tourism',
               description: 'Guided tour of coffee plantations. Learn about Jamaica\'s famous coffee!',
               latitude: 18.1000,
               longitude: -76.6500,
               urgency: 'low',
               userEmail: 'coffee@jamaica.com',
               createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-4',
               title: 'Road Closure - Constant Spring Road',
               category: 'traffic',
               description: 'Road closed for water main repairs. Use alternative routes.',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'high',
               userEmail: 'traffic@jamaica.com',
               createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
             },
             {
               id: 'demo-5',
               title: 'Beach Cleanup - Hellshire Beach',
               category: 'service',
               description: 'Community beach cleanup this Saturday. Volunteers needed!',
               latitude: 17.9500,
               longitude: -76.8833,
               urgency: 'normal',
               userEmail: 'community@jamaica.com',
               createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1505994300880-f11198b0d90e?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-6',
               title: 'Cricket Match - Sabina Park',
               category: 'sports',
               description: 'West Indies vs England test match. Tickets available at gate.',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'normal',
               userEmail: 'sports@jamaica.com',
               createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-7',
               title: 'Art Gallery Opening - National Gallery',
               category: 'culture',
               description: 'New exhibition featuring local Jamaican artists. Free admission.',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'low',
               userEmail: 'art@jamaica.com',
               createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-8',
               title: 'Medical Emergency - Spanish Town Hospital',
               category: 'health',
               description: 'Emergency services available 24/7. Ambulance on standby.',
               latitude: 17.9911,
               longitude: -76.9567,
               urgency: 'critical',
               userEmail: 'health@jamaica.com',
               createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 15 * 60 * 60 * 1000)
             },
             {
               id: 'demo-9',
               title: 'Fishing Tournament - Port Royal',
               category: 'sports',
               description: 'Annual fishing tournament. Prizes for biggest catch!',
               latitude: 17.9333,
               longitude: -76.8333,
               urgency: 'normal',
               userEmail: 'fishing@jamaica.com',
               createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1544551763-46a013bb2dcc?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-10',
               title: 'Market Day - Coronation Market',
               category: 'shopping',
               description: 'Fresh produce, spices, and local crafts. Best prices in town!',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'low',
               userEmail: 'market@jamaica.com',
               createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 19 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-11',
               title: 'Power Outage - May Pen Area',
               category: 'utility',
               description: 'Scheduled maintenance causing power outage. Expected restoration by 6 PM.',
               latitude: 18.0167,
               longitude: -76.9500,
               urgency: 'high',
               userEmail: 'jps@jamaica.com',
               createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 21 * 60 * 60 * 1000)
             },
             {
               id: 'demo-12',
               title: 'Dance Workshop - Trench Town',
               category: 'entertainment',
               description: 'Learn traditional Jamaican dance moves. All skill levels welcome!',
               latitude: 17.9911,
               longitude: -76.7833,
               urgency: 'normal',
               userEmail: 'dance@jamaica.com',
               createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&h=300&fit=crop']
             },
             {
               id: 'demo-13',
               title: 'Book Fair - University of the West Indies',
               category: 'education',
               description: 'Academic books, novels, and educational materials. Student discounts available.',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'low',
               userEmail: 'books@jamaica.com',
               createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
             },
             {
               id: 'demo-14',
               title: 'Car Accident - Half Way Tree',
               category: 'traffic',
               description: 'Minor accident causing traffic delays. Police on scene.',
               latitude: 18.0167,
               longitude: -76.7833,
               urgency: 'high',
               userEmail: 'traffic@jamaica.com',
               createdAt: new Date(Date.now() - 27 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 27 * 60 * 60 * 1000)
             },
             {
               id: 'demo-15',
               title: 'Beach Party - Negril',
               category: 'entertainment',
               description: 'Sunset beach party with live DJ. Bring your own drinks!',
               latitude: 18.2667,
               longitude: -78.3500,
               urgency: 'normal',
               userEmail: 'party@jamaica.com',
               createdAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
               updatedAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
               images: ['https://images.unsplash.com/photo-1544551763-46a013bb2dcc?w=400&h=300&fit=crop']
             }
           ];
           return sampleMarkers;
  };

  const fetchMarkers = async () => {
    try {
      let q = collection(db, 'markers');
      
      // Order by creation date
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const markersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Add sample markers for demonstration
      const sampleMarkers = generateSampleMarkers();
      const allMarkers = [...markersData, ...sampleMarkers];
      setMarkers(allMarkers);
      console.log('Markers fetched from Firebase:', markersData.length);
      console.log('Demo markers generated:', sampleMarkers.length);
      console.log('Total markers loaded:', allMarkers.length);
      console.log('Demo markers include:', sampleMarkers.map(m => m.title).slice(0, 5));
    } catch (error) {
      console.error('Error fetching markers from Firebase:', error);
      // Fallback to sample markers if Firebase fails
      const sampleMarkers = generateSampleMarkers();
      setMarkers(sampleMarkers);
      console.log('Using sample markers due to Firebase error:', sampleMarkers.length);
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
    // Allow users to click on the map to add markers
    if (!user) {
      toast.error('Please login to add markers');
      setShowAuthModal(true);
      return;
    }

    // Determine parish based on location
    const parish = getParishFromLocation(lat, lng);
    if (parish) {
      setSelectedParish(parish);
      toast.success(`Adding marker in ${parish} Parish`);
    } else {
      toast.info('Adding marker at clicked location');
    }

    setNewMarkerPosition({ lat, lng });
    setShowAddMarkerModal(true);
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
      toast.success(`Adding marker at your location in ${parish} Parish`);
    } else {
      toast.success('Adding marker at your current location');
    }

    setNewMarkerPosition({ lat, lng });
    setShowAddMarkerModal(true);
  };

  const handleEventMarker = (lat, lng) => {
    // This is called from the "Add Event Marker" button
    if (!user) {
      toast.error('Please login to add event markers');
      setShowAuthModal(true);
      return;
    }

    // Determine parish based on location
    const parish = getParishFromLocation(lat, lng);
    if (parish) {
      setSelectedParish(parish);
      toast.success(`Adding event marker at your location in ${parish} Parish`);
    } else {
      toast.success('Adding event marker at your current location');
    }

    setNewMarkerPosition({ lat, lng });
    setShowAddMarkerModal(true);
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
              markers={filteredMarkers}
              selectedMarker={selectedMarker}
              highlightedMarker={highlightedMarker}
              onMarkerClick={setSelectedMarker}
              onMapClick={handleMapClick}
              onLocationMarker={handleLocationMarker}
              onEventMarker={handleEventMarker}
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
              markers={filteredMarkers}
              onMarkerClick={(marker) => {
                setSelectedMarker(marker);
                setHighlightedMarker(marker);
                setViewMode('map');
              }}
              onDeleteMarker={handleDeleteMarker}
              currentUser={user}
            />
          ) : viewMode === 'parish' ? (
            <ParishDomain
              parishName={selectedParish}
              markers={filteredMarkers}
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
