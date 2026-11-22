import { API_BASE } from './config';
import { MOOD_LABELS, type JournalEntry, type Mood, type Reflection, type ReflectResponse } from './types';

/** 'YYYY-MM-DD' for a Date, in local time. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function prettyDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Consecutive days with an entry, counting back from today. */
export function currentStreak(entries: JournalEntry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const d = new Date();
  // If nothing was logged today yet, the streak still counts from
  // yesterday — a missed today does not erase the run.
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** The last 7 days (oldest first) with the entry for each day, if any. */
export function weekSeries(entries: JournalEntry[]): { date: string; entry: JournalEntry | null }[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const out: { date: string; entry: JournalEntry | null }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ date: key, entry: byDate.get(key) ?? null });
  }
  return out;
}

/** Average mood over the last 7 logged days, or null when none. */
export function weekAverage(entries: JournalEntry[]): number | null {
  const week = weekSeries(entries).filter((s) => s.entry !== null);
  if (week.length === 0) return null;
  const sum = week.reduce((n, s) => n + (s.entry?.mood ?? 0), 0);
  return sum / week.length;
}

/* ------------------------------------------------------------------ */
/* Demo reflector — honest on-device fallback. Rule-based, kind, and  */
/* never inventing facts: it only echoes back what the entry says,    */
/* in the entry's own words, plus one gentle prompt for tomorrow.     */
/* MoodJournal is a wellness journal, not medical advice — the        */
/* reflector never diagnoses, never labels a condition, and never     */
/* tells the user what is wrong with them.                            */
/* ------------------------------------------------------------------ */

const THEME_WORDS: { match: RegExp; note: string; prompt: string }[] = [
  {
    match: /tired|exhaust|sleep|rest/i,
    note: 'Rest kept coming up in your words today.',
    prompt: 'What is one small rest you could give yourself tomorrow?',
  },
  {
    match: /stress|anxious|worried|overwhelm/i,
    note: 'There is a lot weighing on you right now, and you still showed up to write it down.',
    prompt: 'What is one small thing you could set down, even for an hour, tomorrow?',
  },
  {
    match: /grateful|thankful|glad|lovely|beautiful/i,
    note: 'Gratitude is woven through what you wrote — you noticed the good in an ordinary day.',
    prompt: 'What is one small good thing you hope to notice tomorrow?',
  },
  {
    match: /work|deadline|meeting|boss|project/i,
    note: 'Work took up a lot of space today, and you still made room to check in with yourself.',
    prompt: 'What is one boundary you could hold at work tomorrow?',
  },
  {
    match: /friend|family|mom|dad|sister|brother|partner|child/i,
    note: 'The people close to you are part of how this day felt.',
    prompt: 'Who is one person you would like a quiet moment with tomorrow?',
  },
  {
    match: /walk|run|gym|exercise|yoga|outside|sun/i,
    note: 'Moving your body — or just getting outside — was part of today.',
    prompt: 'What is one small movement you could fit in tomorrow?',
  },
  {
    match: /lonely|alone|miss/i,
    note: 'Feeling alone is hard to sit with, and writing it down is a kind thing to do for yourself.',
    prompt: 'Who is one person you could reach out to, even briefly, tomorrow?',
  },
];

const MOOD_REFLECTIONS: Record<Mood, { reflection: string; prompt: string }> = {
  1: {
    reflection:
      'Today was a low one, and that is allowed. You do not have to fix the whole day — noticing it, and writing it down, is already enough for now.',
    prompt: 'What is one gentle thing you could do for yourself tomorrow, even a tiny one?',
  },
  2: {
    reflection:
      'Today felt heavy, and you carried it anyway. It is okay to put some of that weight down for the evening — tomorrow is a fresh page.',
    prompt: 'What is one small weight you could set aside tomorrow, just for a while?',
  },
  3: {
    reflection:
      'An okay day is still a day worth noting. Not every day has to be bright to count — steady days hold the week together.',
    prompt: 'What is one small thing that would make tomorrow feel a little lighter?',
  },
  4: {
    reflection:
      'Today was a good day, and you took the time to notice it. That noticing is a habit worth keeping — good days grow when they are seen.',
    prompt: 'What from today would you like to carry into tomorrow?',
  },
  5: {
    reflection:
      'What a bright day. You showed up for it fully, and this entry keeps a little of that light for the days that feel greyer.',
    prompt: 'What made today bright — and how could you invite a little of it into tomorrow?',
  },
};

export function demoReflect(mood: Mood, entryText: string): Reflection {
  const text = entryText.trim();
  const theme = THEME_WORDS.find((t) => t.match.test(text));
  const base = MOOD_REFLECTIONS[mood];
  if (theme) {
    return {
      reflection: `${theme.note} ${base.reflection}`,
      prompt: theme.prompt,
      source: 'demo',
    };
  }
  if (text.length > 0) {
    return {
      reflection: `You wrote about ${MOOD_LABELS[mood].toLowerCase()} feelings today, in your own words. ${base.reflection}`,
      prompt: base.prompt,
      source: 'demo',
    };
  }
  return { ...base, source: 'demo' };
}

/* ------------------------------------------------------------------ */
/* Live reflection — POST /api/reflect (Python serverless function).   */
/* Any failure (no endpoint, no key, network error) falls back to     */
/* the demo reflector and says so, so the app never shows a dead      */
/* screen.                                                             */
/* ------------------------------------------------------------------ */

export async function reflectEntry(mood: Mood, entryText: string, date: string): Promise<Reflection> {
  const url = API_BASE ? `${API_BASE}/api/reflect` : '/api/reflect';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, entry: entryText, date }),
    });
    if (!res.ok) return demoReflect(mood, entryText);
    const data = (await res.json()) as ReflectResponse;
    if (!data.reflection || !data.prompt) return demoReflect(mood, entryText);
    return { reflection: data.reflection, prompt: data.prompt, source: 'live' };
  } catch {
    return demoReflect(mood, entryText);
  }
}

/* ------------------------------------------------------------------ */
/* Seeded demo entries — the last 6 days, so the week view and the    */
/* river show real-looking data on first open. Clearly labelled demo, */
/* clearable from Settings.                                            */
/* ------------------------------------------------------------------ */

export const SAMPLE_ENTRIES: { daysAgo: number; mood: Mood; text: string }[] = [
  {
    daysAgo: 6,
    mood: 3,
    text: 'A slow Sunday. Cooked a proper lunch, called home, and did nothing much after that. It felt fine, honestly.',
  },
  {
    daysAgo: 5,
    mood: 4,
    text: 'Good day at work — the feature I had been stuck on finally clicked. Walked home in the evening sun.',
  },
  {
    daysAgo: 4,
    mood: 2,
    text: 'Long day, back to back calls and not much sleep last night. I feel wrung out. Early night tonight.',
  },
  {
    daysAgo: 3,
    mood: 4,
    text: 'Coffee with an old friend I had not seen in months. We talked for two hours and it flew by. Grateful for that.',
  },
  {
    daysAgo: 2,
    mood: 3,
    text: 'An ordinary Tuesday. Gym in the morning, errands after lunch, cooked something new for dinner. Steady.',
  },
  {
    daysAgo: 1,
    mood: 5,
    text: 'Bright day. Finished a big task early, went for a long walk, and the evening felt unhurried. I want more days like this.',
  },
];

export function seedEntries(): JournalEntry[] {
  const now = Date.now();
  return SAMPLE_ENTRIES.map((sample, i) => {
    const d = new Date();
    d.setDate(d.getDate() - sample.daysAgo);
    const reflection = demoReflect(sample.mood, sample.text);
    return {
      id: `demo-entry-${i}`,
      date: dayKey(d),
      mood: sample.mood,
      text: sample.text,
      reflection,
      createdAt: now - sample.daysAgo * 86400000,
      isDemo: true,
    };
  });
}
