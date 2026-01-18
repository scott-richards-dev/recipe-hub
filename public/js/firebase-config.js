/**
 * Firebase Client SDK Configuration
 * Handles authentication and client-side Firebase interactions
 */

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyCUd8dzZwyfACZXU7sRtyj1EFojZpNyzTE",
  authDomain: "recipe-hub-b78ce.firebaseapp.com",
  projectId: "recipe-hub-b78ce",
  storageBucket: "recipe-hub-b78ce.firebasestorage.app",
  messagingSenderId: "618999243184",
  appId: "1:618999243184:web:6cc3e7b38391459a52f675",
  measurementId: "G-K0T4TY3RSZ"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');
