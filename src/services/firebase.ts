import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, initializeAuth, browserLocalPersistence, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase safely for Metro hot reloading
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: any;

if ((app as any)._authInitialized) {
  auth = getAuth(app);
} else {
  if (Platform.OS === 'web') {
    try {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
      (app as any)._authInitialized = true;
      console.log("Firebase Auth initialized with browserLocalPersistence (Web).");
    } catch (error: any) {
      console.warn("Firebase Auth browserLocalPersistence init failed, falling back:", error);
      auth = getAuth(app);
      if (error?.code === 'auth/already-initialized' || String(error).includes('already-initialized')) {
        (app as any)._authInitialized = true;
      }
    }
  } else {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      (app as any)._authInitialized = true;
      console.log("Firebase Auth initialized with getReactNativePersistence (Mobile).");
    } catch (error: any) {
      console.warn("Firebase Auth AsyncStorage persistence init failed, falling back:", error);
      auth = getAuth(app);
      if (error?.code === 'auth/already-initialized' || String(error).includes('already-initialized')) {
        (app as any)._authInitialized = true;
      }
    }
  }
}

const db = getFirestore(app);

// Initialize Analytics conditionally (as it's only supported on Web in the JS SDK)
let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized successfully.");
  } else {
    console.log("Firebase Analytics is not supported in this environment.");
  }
}).catch((err) => {
  console.warn("Failed to initialize Firebase Analytics:", err);
});

export { app, auth, db, analytics };

