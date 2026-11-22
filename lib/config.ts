/**
 * MoodJournal runtime config.
 *
 * The AI reflection writer is a Python Vercel serverless function
 * (api/reflect.py): POST /api/reflect. On web the app calls the
 * same-origin path; on native, EXPO_PUBLIC_API_URL is the deployed
 * origin. When no endpoint answers, the app falls back to its
 * on-device demo reflector (lib/mood.ts) and says so honestly —
 * entries are always saved and visible either way.
 *
 * No Gemini key ever lives in this file or in app code; the key is
 * server-side only in the /api/reflect function.
 */
/** Deployed origin for native, or '' to use same-origin /api on web. */
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
/**
 * Set to true once the Firebase project for MoodJournal exists and
 * the values in lib/firebase.ts / lib/firebase.native.ts are the
 * real web config. No project exists yet (2026-11-22) —
 * TODO-MOODJOURNAL placeholders in both files; wiring is a
 * publish step.
 */
export const firebaseConfigured = true;
