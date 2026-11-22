/** MoodJournal shared types. Dates are 'YYYY-MM-DD' strings. */

export type Mood = 1 | 2 | 3 | 4 | 5;

export const MOODS: Mood[] = [1, 2, 3, 4, 5];

export const MOOD_LABELS: Record<Mood, string> = {
  1: 'Low',
  2: 'Heavy',
  3: 'Okay',
  4: 'Good',
  5: 'Bright',
};

export const MOOD_WORDS: Record<Mood, string> = {
  1: 'a low day',
  2: 'a heavy day',
  3: 'an okay day',
  4: 'a good day',
  5: 'a bright day',
};

export type ReflectionSource = 'live' | 'demo';

export interface Reflection {
  /** One short, kind, supportive reflection (1–3 sentences). */
  reflection: string;
  /** One small question or prompt to carry into tomorrow. */
  prompt: string;
  source: ReflectionSource;
}

export interface JournalEntry {
  id: string;
  /** 'YYYY-MM-DD' — the day the entry is about. */
  date: string;
  mood: Mood;
  /** The journal text (may be empty when only a mood was logged). */
  text: string;
  /** The reflection for this entry, or null until one is requested. */
  reflection: Reflection | null;
  /** Epoch milliseconds the entry was saved. */
  createdAt: number;
  /** Seeded demo content — clearable from Settings. */
  isDemo?: boolean;
}

export interface HistoryEntry {
  id: string;
  entryId: string;
  /** Short label, e.g. "Good · Tue 17 Nov". */
  title: string;
  mood: Mood;
  /** Epoch milliseconds the reflection was written. */
  at: number;
}

export interface ReflectRequestInput {
  mood: Mood;
  entry: string;
  date: string;
}

export interface ReflectResponse {
  reflection?: string;
  prompt?: string;
  error?: { message?: string };
}
