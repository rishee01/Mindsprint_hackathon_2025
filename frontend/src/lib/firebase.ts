/**
 * Firebase Configuration
 * Initialize Firebase app with environment variables
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:demo'
};

const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

// Initialize Firebase only when configuration is present; otherwise provide no-op auth helpers.
const app = isFirebaseConfigured && getApps().length === 0 ? initializeApp(firebaseConfig) : undefined;
const auth = app ? getAuth(app) : null;
const googleProvider = app ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

/**
 * Sign in with Google popup
 */
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    return { user: null, error: 'Firebase is not configured in this environment.' };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      user: result.user,
      error: null
    };
  } catch (error: any) {
    return {
      user: null,
      error: error.message
    };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    return { user: null, error: 'Firebase is not configured in this environment.' };
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return {
      user: result.user,
      error: null
    };
  } catch (error: any) {
    let message = 'Login failed';
    if (error.code === 'auth/user-not-found') message = 'No account found with this email';
    if (error.code === 'auth/wrong-password') message = 'Incorrect password';
    if (error.code === 'auth/invalid-email') message = 'Invalid email address';
    if (error.code === 'auth/too-many-requests') message = 'Too many attempts. Please try again later';
    
    return {
      user: null,
      error: message
    };
  }
};

/**
 * Create account with email and password
 */
export const createAccountWithEmail = async (email: string, password: string) => {
  if (!auth) {
    return { user: null, error: 'Firebase is not configured in this environment.' };
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return {
      user: result.user,
      error: null
    };
  } catch (error: any) {
    let message = 'Registration failed';
    if (error.code === 'auth/email-already-in-use') message = 'Email already registered';
    if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters';
    if (error.code === 'auth/invalid-email') message = 'Invalid email address';
    
    return {
      user: null,
      error: message
    };
  }
};

/**
 * Sign out current user
 */
export const logOut = async () => {
  if (!auth) {
    return { error: 'Firebase is not configured in this environment.' };
  }

  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth?.currentUser ?? null;
};

/**
 * Listen for auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

/**
 * Get Firebase ID token for API authentication
 */
export const getIdToken = async (): Promise<string | null> => {
  const user = auth?.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    return null;
  }
};

export { auth };
