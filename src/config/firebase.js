// Core Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Authentication
import { getFirestore } from 'firebase/firestore'; // Database
import { getStorage } from 'firebase/storage'; // File Storage

/**
 * ------------------------------------------------------------------
 * FIREBASE CONFIGURATION
 * ------------------------------------------------------------------
 * These values are pulled from your .env file.
 * Ensure your .env file is correctly set up with the keys below.
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * ------------------------------------------------------------------
 * INITIALIZATION
 * ------------------------------------------------------------------
 */

// 1. Initialize the Firebase App instance
const app = initializeApp(firebaseConfig);

// 2. Initialize and Export Services
// Authentication Service (Login/Signup)
export const auth = getAuth(app);

// Firestore Database Service (User Profiles, Metadata)
export const db = getFirestore(app);

// Storage Service (File Uploads for Premium users - though we stick to client-side mostly)
export const storage = getStorage(app);

// Export the app instance by default for any edge cases
export default app;
