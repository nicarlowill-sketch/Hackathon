import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration - Pulse Jamaica Project
const firebaseConfig = {
  apiKey: "AIzaSyCzORgZ1dGIIRqPTKmx1qU9A9OYY-Dl9UE",
  authDomain: "pulse-jamaica.firebaseapp.com",
  projectId: "pulse-jamaica",
  storageBucket: "pulse-jamaica.firebasestorage.app",
  messagingSenderId: "697310680153",
  appId: "1:697310680153:web:5072bd15d84d7147b10d48",
  measurementId: "G-8F4LYFXJ3W"
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let analytics = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
  
  // Initialize Firestore
  db = getFirestore(app);
  
  // Initialize Analytics only in browser environment and if supported
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      }
    });
  }
  
  console.log('Firebase initialized successfully');
  console.log('Firebase Auth ready');
  console.log('Firestore database ready');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export Firebase services
export { auth, db, analytics };
export default app;
