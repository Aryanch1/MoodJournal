import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from '@firebase/app';
import * as firebaseAuth from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
/**
 * Firebase wiring for MoodJournal — native (Android/iOS). Metro picks this
 * file over firebase.ts on native.
 *
 * Native imports the scoped @firebase/* packages on purpose: they ship
 * a real React Native build (the umbrella 'firebase/auth' entry does
 * not — it resolves to the browser build, whose sessions are kept in
 * memory only, so users were signed out every time the app closed).
 *
 * No Firebase project exists yet (2026-11-22) — TODO-MOODJOURNAL
 * placeholders for the publish step (see lib/firebase.ts). Until the
 * real config lands, the app runs in full local/guest mode.
 *
 * The config values below are Firebase's public app identifiers — they
 * are designed to ship in client code. Access is controlled by Firebase
 * Authentication plus the Firestore security rules (each user can only
 * read and write their own /users/<uid> tree). No admin keys or secrets
 * live here; the Gemini key stays server-side in the /api/reflect
 * (Python) serverless function.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyCaxOHmqUKLLad3zFTdgWFVbbQ2zWjvnEA',
  authDomain: 'moodjournal-a15bf.firebaseapp.com',
  projectId: 'moodjournal-a15bf',
  storageBucket: 'moodjournal-a15bf.firebasestorage.app',
  messagingSenderId: '755888311130',
  appId: '1:755888311130:web:a4c0344b0ad4f907670163',
};
/** OAuth web client ID for the native Google Sign-In flow (not a secret). */
export const GOOGLE_WEB_CLIENT_ID = '755888311130-723o522nogmkgq64kale6si4t0a48jl9.apps.googleusercontent.com';
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
function createAuth(): firebaseAuth.Auth {
  // Persist the session in AsyncStorage so the user stays signed in
  // between app launches, like every other app.
  const getPersistence = (
    firebaseAuth as unknown as {
      getReactNativePersistence?: (storage: unknown) => firebaseAuth.Persistence;
    }
  ).getReactNativePersistence;
  if (getPersistence) {
    try {
      return firebaseAuth.initializeAuth(firebaseApp, {
        persistence: getPersistence(AsyncStorage),
      });
    } catch {
      // Already initialized (fast refresh) — fall through to getAuth.
    }
  }
  return firebaseAuth.getAuth(firebaseApp);
}
export const auth = createAuth();
export const db = getFirestore(firebaseApp);
export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  type User,
} from '@firebase/auth';
export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from '@firebase/firestore';
