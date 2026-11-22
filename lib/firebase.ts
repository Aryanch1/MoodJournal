import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
/**
 * Firebase wiring for MoodJournal — web.
 * No Firebase project exists yet (2026-11-22) — TODO-MOODJOURNAL
 * placeholders below for the publish step: create the project in the
 * Firebase Console (sign in with Continue with Google as
 * aryanch99999@gmail.com), enable Email/Password + Google sign-in
 * (email-link OFF), create Firestore with the repo's owner-only
 * firestore.rules, register the web app, and paste the real web config
 * here (and in firebase.native.ts), then set firebaseConfigured=true
 * in lib/config.ts. Until then the app runs in full local/guest mode.
 * The config values are Firebase's public app identifiers — they are
 * designed to ship in client code. Access is controlled by Firebase
 * Authentication plus the Firestore security rules (each user can only
 * read and write their own /users/<uid> tree). No admin keys or secrets
 * live here; the Gemini key stays server-side in the /api/reflect
 * (Python) serverless function.
 * Platform note: this file serves web (and tooling). Native builds use
 * firebase.native.ts instead, which imports the scoped @firebase/*
 * packages — the umbrella 'firebase/auth' entry has no React Native
 * build, so on Android/iOS it silently resolves to the browser build
 * whose sessions live in memory only and are lost when the app closes.
 * Every module imports its Auth/Firestore helpers from './firebase' so
 * each platform always gets one consistent set of Firebase modules.
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
export const auth = firebaseAuth.getAuth(firebaseApp);
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
} from 'firebase/auth';
export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
