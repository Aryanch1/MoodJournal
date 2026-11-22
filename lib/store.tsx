import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from './firebase';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { firebaseConfigured } from './config';
import { signInWithGoogle } from './google';
import { currentStreak, dayKey, seedEntries, weekAverage } from './mood';
import {
  type HistoryEntry,
  type JournalEntry,
  type Mood,
  type Reflection,
} from './types';

const ENTRIES_KEY = 'moodjournal:entries:v1';
const HISTORY_KEY = 'moodjournal:history:v1';
const SEEDED_KEY = 'moodjournal:seeded:v1';
const HISTORY_LIMIT = 20;

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  /** 'google.com' or 'password' — how this account signs in. */
  provider: string | null;
}

export interface AppState {
  entries: JournalEntry[];
  history: HistoryEntry[];
  /** Entries newest first. */
  sortedEntries: JournalEntry[];
  todayEntry: JournalEntry | undefined;
  streak: number;
  weekAvg: number | null;
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setAvatarData: (dataUrl: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  saveEntry: (input: { date: string; mood: Mood; text: string; reflection: Reflection | null }) => JournalEntry;
  updateEntry: (id: string, patch: Partial<Pick<JournalEntry, 'mood' | 'text' | 'reflection'>>) => void;
  deleteEntry: (id: string) => void;
  applyHistory: (entry: HistoryEntry) => JournalEntry | null;
  clearHistory: () => void;
  clearDemoData: () => void;
  entryById: (id: string) => JournalEntry | undefined;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function upsertProfile(u: User): Promise<void> {
  if (!firebaseConfigured) return;
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base = {
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      photoURL: u.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }
  } catch {
    // Sync is best-effort; the app keeps working offline.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const entriesRef = useRef<JournalEntry[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // Local data loads once at startup; first launch seeds demo entries.
  useEffect(() => {
    void (async () => {
      const [eRaw, hRaw, seeded] = await Promise.all([
        AsyncStorage.getItem(ENTRIES_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SEEDED_KEY),
      ]);
      const e = loadJson<JournalEntry[]>(eRaw);
      const h = loadJson<HistoryEntry[]>(hRaw);
      if (e && e.length > 0) {
        setEntries(e);
        setHistory(h ?? []);
      } else if (!seeded) {
        setEntries(seedEntries());
        setHistory([]);
        await AsyncStorage.setItem(SEEDED_KEY, '1');
      }
      historyLoadedRef.current = true;
    })();
  }, []);

  // Local mirrors.
  useEffect(() => {
    entriesRef.current = entries;
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)).catch(() => undefined);
  }, [entries]);
  useEffect(() => {
    historyRef.current = history;
    if (!historyLoadedRef.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => undefined);
  }, [history]);

  // Auth state: profile write, cloud subscriptions.
  // Readiness waits for Firebase to finish restoring any persisted
  // session from storage — the gate must not decide "signed out" (and
  // show Welcome) before the saved session has had its chance to load.
  useEffect(() => {
    let alive = true;
    void auth.authStateReady().then(() => {
      if (alive) setAuthReady(true);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      for (const fn of unsubsRef.current) fn();
      unsubsRef.current = [];
      if (!u) {
        setUser(null);
        return;
      }
      setUser({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        photo: u.photoURL,
        provider: u.providerData[0]?.providerId ?? null,
      });
      void upsertProfile(u);
      if (!firebaseConfigured) return;

      const subscribe = <T,>(
        colName: string,
        apply: (items: T[]) => void,
        local: () => T[],
        idOf: (item: T) => string,
      ) => {
        const col = collection(db, 'users', u.uid, colName);
        unsubsRef.current.push(
          onSnapshot(
            col,
            (snap) => {
              apply(snap.docs.map((d) => d.data() as T));
            },
            () => undefined,
          ),
        );
        // One-time merge: anything saved locally before sign-in joins the account.
        void (async () => {
          try {
            const cloud = await getDocs(col);
            const cloudIds = new Set(cloud.docs.map((d) => d.id));
            for (const item of local()) {
              const id = idOf(item);
              if (!cloudIds.has(id)) {
                await setDoc(
                  doc(db, 'users', u.uid, colName, id),
                  item as unknown as Record<string, unknown>,
                );
              }
            }
          } catch {
            // Best-effort merge only.
          }
        })();
      };
      subscribe<JournalEntry>('entries', setEntries, () => entriesRef.current, (e) => e.id);
      subscribe<HistoryEntry>('history', setHistory, () => historyRef.current, (h) => h.id);

      // Profile doc: a custom avatar / edited name stored there overrides
      // the auth copy.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) =>
              prev && prev.uid === u.uid
                ? {
                    ...prev,
                    name: (data.displayName as string) || prev.name,
                    photo: (data.photoData as string) || prev.photo,
                  }
                : prev,
            );
          }
        } catch {
          // Keep the auth profile.
        }
      })();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [entries],
  );
  const todayEntry = useMemo(
    () => entries.find((e) => e.date === dayKey(new Date())),
    [entries],
  );
  const streak = useMemo(() => currentStreak(entries), [entries]);
  const weekAvg = useMemo(() => weekAverage(entries), [entries]);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
        setUser({
          uid: cred.user.uid,
          name: cleanName,
          email: cred.user.email,
          photo: null,
          provider: 'password',
        });
        void upsertProfile({ ...cred.user, displayName: cleanName } as User);
      }
    },
    [],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const clean = name.trim();
    await updateProfile(currentUser, { displayName: clean });
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { displayName: clean }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, name: clean } : prev));
  }, []);

  const setAvatarData = useCallback(async (dataUrl: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { photoData: dataUrl }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, photo: dataUrl } : prev));
  }, []);

  const sendPasswordReset = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    await sendPasswordResetEmail(auth, currentUser.email);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen — the gate routes there as soon as the
    // user is signed out and not a guest.
    setGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    // Deliberately NOT persisted: guest lasts for this visit only, so the
    // next open asks for sign-in again. A signed-in user, by contrast,
    // stays signed in (Firebase Auth persistence).
    setGuest(true);
  }, []);

  const syncDoc = useCallback(
    (colName: string, id: string, data: unknown) => {
      if (!user || !firebaseConfigured) return;
      void setDoc(doc(db, 'users', user.uid, colName, id), data).catch(() => undefined);
    },
    [user],
  );

  const deleteDocCloud = useCallback(
    (colName: string, id: string) => {
      if (!user || !firebaseConfigured) return;
      void deleteDoc(doc(db, 'users', user.uid, colName, id)).catch(() => undefined);
    },
    [user],
  );

  const saveEntry = useCallback(
    (input: { date: string; mood: Mood; text: string; reflection: Reflection | null }): JournalEntry => {
      const existing = entriesRef.current.find((e) => e.date === input.date);
      if (existing) {
        const updated: JournalEntry = {
          ...existing,
          mood: input.mood,
          text: input.text.trim(),
          reflection: input.reflection ?? existing.reflection,
        };
        setEntries((prev) => prev.map((e) => (e.id === existing.id ? updated : e)));
        syncDoc('entries', updated.id, updated);
        if (updated.reflection) {
          const entry: HistoryEntry = {
            id: uid('h'),
            entryId: updated.id,
            title: `${updated.mood} · ${updated.date}`,
            mood: updated.mood,
            at: Date.now(),
          };
          setHistory((prev) =>
            prev.some((h) => h.entryId === updated.id)
              ? prev
              : [entry, ...prev].slice(0, HISTORY_LIMIT),
          );
          syncDoc('history', entry.id, entry);
        }
        return updated;
      }
      const entry: JournalEntry = {
        id: uid('entry'),
        date: input.date,
        mood: input.mood,
        text: input.text.trim(),
        reflection: input.reflection,
        createdAt: Date.now(),
      };
      setEntries((prev) => [entry, ...prev]);
      syncDoc('entries', entry.id, entry);
      if (entry.reflection) {
        const hEntry: HistoryEntry = {
          id: uid('h'),
          entryId: entry.id,
          title: `${entry.mood} · ${entry.date}`,
          mood: entry.mood,
          at: Date.now(),
        };
        setHistory((prev) => [hEntry, ...prev].slice(0, HISTORY_LIMIT));
        syncDoc('history', hEntry.id, hEntry);
      }
      return entry;
    },
    [syncDoc],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Pick<JournalEntry, 'mood' | 'text' | 'reflection'>>) => {
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        const updated = next.find((e) => e.id === id);
        if (updated) syncDoc('entries', id, updated);
        return next;
      });
    },
    [syncDoc],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setHistory((prev) => prev.filter((h) => h.entryId !== id));
      deleteDocCloud('entries', id);
    },
    [deleteDocCloud],
  );

  const applyHistory = useCallback(
    (entry: HistoryEntry): JournalEntry | null => {
      return entriesRef.current.find((e) => e.id === entry.entryId) ?? null;
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user && firebaseConfigured) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'history'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
    }
  }, [user]);

  const clearDemoData = useCallback(() => {
    setEntries((prev) => prev.filter((e) => !e.isDemo));
    setHistory((prev) =>
      prev.filter((h) => {
        const entry = entriesRef.current.find((e) => e.id === h.entryId);
        return entry ? !entry.isDemo : true;
      }),
    );
    if (user && firebaseConfigured) {
      for (const entry of entriesRef.current.filter((e) => e.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'entries', entry.id)).catch(() => undefined);
      }
    }
  }, [user]);

  const entryById = useCallback((id: string) => entries.find((e) => e.id === id), [entries]);

  const value = useMemo<AppState>(
    () => ({
      entries,
      history,
      sortedEntries,
      todayEntry,
      streak,
      weekAvg,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      saveEntry,
      updateEntry,
      deleteEntry,
      applyHistory,
      clearHistory,
      clearDemoData,
      entryById,
    }),
    [
      entries,
      history,
      sortedEntries,
      todayEntry,
      streak,
      weekAvg,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      saveEntry,
      updateEntry,
      deleteEntry,
      applyHistory,
      clearHistory,
      clearDemoData,
      entryById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
