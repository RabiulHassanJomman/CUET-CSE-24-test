// Firebase configuration
// IMPORTANT: Replace these values with your actual Firebase project configuration
// Get these from: https://console.firebase.google.com/ → Your Project → Project Settings → General → Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyBVSYLCz3P0viGSKcIO-KZ5pqDN1xls0Ss",
  authDomain: "cuet-cse24.firebaseapp.com",
  projectId: "cuet-cse24",
  storageBucket: "cuet-cse24.firebasestorage.app",
  messagingSenderId: "184214039043",
  appId: "1:184214039043:web:99b41a0dc6671c4d74bc36",
  measurementId: "G-1E3MJTBMTR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
