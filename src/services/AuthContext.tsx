import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || 'admin@panchangam.com';

// Cookies helper methods for sandboxed web client previews
const getCookie = (name: string): string | null => {
  try {
    if (typeof document !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const rawVal = parts.pop()?.split(';').shift() || null;
        return rawVal ? decodeURIComponent(rawVal) : null;
      }
    }
  } catch (e) {}
  return null;
};

const setCookie = (name: string, value: string, days = 365) => {
  try {
    if (typeof document !== 'undefined') {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      const encodedValue = encodeURIComponent(value);
      document.cookie = `${name}=${encodedValue};${expires};path=/;SameSite=Strict`;
    }
  } catch (e) {}
};

const removeCookie = (name: string) => {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  } catch (e) {}
};

// Memory fallback for environments where storage is blocked or broken
const memoryStorage: Record<string, string> = {};

// Platform-agnostic safe storage wrapper to prevent AsyncStorage NativeModule crashes on Web
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // 1. Try localStorage first (fast, works on Web, safe fallback)
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {}

    // 2. Try Cookies (Web fallback for sandboxed/restricted browsers)
    try {
      const val = getCookie(key);
      if (val !== null) return val;
    } catch (e) {}

    // 3. Try SecureStore (Mobile native secure storage)
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      // 4. Try AsyncStorage (fallback for native mobile)
      try {
        return await AsyncStorage.getItem(key);
      } catch (nativeErr) {
        return null;
      }
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    let saved = false;
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        saved = true;
      }
    } catch (e) {}

    // 2. Try Cookies
    try {
      setCookie(key, value);
      saved = true;
    } catch (e) {}

    // 3. Try SecureStore (Mobile native secure storage)
    try {
      await SecureStore.setItemAsync(key, value);
      saved = true;
    } catch (e) {
      // 4. Try AsyncStorage (fallback for native mobile)
      try {
        await AsyncStorage.setItem(key, value);
        saved = true;
      } catch (nativeErr) {}
    }

    // 5. Fallback to memory storage
    if (!saved) {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    // 1. Try localStorage
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    // 2. Try Cookies
    try {
      removeCookie(key);
    } catch (e) {}
    // 3. Try SecureStore (Mobile native secure storage)
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // 4. Try AsyncStorage (fallback for native mobile)
      try {
        await AsyncStorage.removeItem(key);
      } catch (nativeErr) {}
    }
    delete memoryStorage[key];
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let nativeSessionLoaded = false;
    let authStateFired = false;

    const performAutoLogin = async () => {
      try {
        const savedCreds = await safeStorage.getItem('saved_user_credentials');
        if (savedCreds) {
          // If Firebase native/cookie persistence already logged us in, skip background re-auth
          if (auth.currentUser || nativeSessionLoaded) {
            console.log("[Auto-Login] Native session already loaded, skipping manual re-auth.");
            return;
          }
          const { email, password } = JSON.parse(savedCreds);
          console.log("[Auto-Login] Restoring session background sign-in for:", email);
          await signInWithEmailAndPassword(auth, email, password);
          return;
        }
      } catch (err) {
        console.warn("[Auto-Login] Background session restore failed:", err);
      }
      
      // If we got here and native session didn't load, set loading to false
      if (!auth.currentUser && !nativeSessionLoaded) {
        setLoading(false);
      }
    };

    // Trigger session check on startup
    performAutoLogin();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      authStateFired = true;
      
      if (currentUser) {
        nativeSessionLoaded = true;
        setLoading(true);
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Clean up previous profile listener if exists
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }

        // Setup real-time listener for user profile document
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // Document doesn't exist yet (e.g. user was created manually via console)
            // Initialize user document in firestore
            const isDefaultAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              role: isDefaultAdmin ? 'admin' : 'user',
              status: isDefaultAdmin ? 'approved' : 'pending',
              createdAt: new Date().toISOString()
            };

            try {
              await setDoc(userDocRef, initialProfile);
              setUserProfile(initialProfile);
            } catch (err) {
              console.error("Error creating user profile in Firestore:", err);
            }
            setLoading(false);
          }
        }, (error) => {
          console.error("User profile subscription error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        
        // Only set loading to false if we don't have saved credentials to prevent flickering
        const savedCreds = await safeStorage.getItem('saved_user_credentials');
        if (!savedCreds) {
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Save credentials for manual session persistence backup
      await safeStorage.setItem('saved_user_credentials', JSON.stringify({ email, password }));
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Create user document in firestore
      const isDefaultAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const initialProfile: UserProfile = {
        uid: newUser.uid,
        email: email,
        displayName: displayName,
        role: isDefaultAdmin ? 'admin' : 'user',
        status: isDefaultAdmin ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', newUser.uid), initialProfile);
      setUserProfile(initialProfile);
      
      // Save credentials for manual session persistence backup
      await safeStorage.setItem('saved_user_credentials', JSON.stringify({ email, password }));
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Clear manual session persistence backup
      await safeStorage.removeItem('saved_user_credentials');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
