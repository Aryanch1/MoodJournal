# MoodJournal

**One small page a day.** A quiet daily mood journal — pick a mood, write a few honest lines, and get one gentle reflection back, plus a small prompt to carry into tomorrow.

Some days are bright and some are heavy, and both are worth writing down. MoodJournal gives you one calm minute a day: tap the mood that fits, write what happened in your own words, and see your week as a gentle arc instead of a blur. No streaks to lose sleep over, no advice you did not ask for — just a small page, every day.

## Features

- **Today** — a large mood-orb hero and a 5-point mood picker (Low / Heavy / Okay / Good / Bright); tapping a mood saves it right away, so a mood-only day still counts.
- **Gentle AI reflections** — one short, kind reflection and one small prompt for tomorrow (live Gemini when the backend is connected, honest on-device demo reflector otherwise — the app always says which). Wellness only: never a diagnosis, never medical advice.
- **Week view** — your mood arc as a designed line chart, plus your day streak and week average.
- **Entries river** — every entry as a dated card, newest first; open any entry to read it again, edit it, get a fresh reflection, or delete it.
- **Accounts** — sign in with Google or email, or continue as a guest. Signed-in users stay signed in; entries and reflections sync per account.
- **Premium design** — dusk plum and warm peach on pale lavender-white, Lora serif headlines, spring-physics animations, a moon-rising pull-to-refresh, frosted glass cards. Works on phones, tablets, foldables and desktop.

## Live web

Live link coming soon — the app is built locally and ready to publish.

## Design

Figma: https://www.figma.com/design/h2a1TNvjb4dlGh5m3IJesi — "MoodJournal — Daily App"

## Tech stack

- React Native + Expo SDK 58 + TypeScript (one codebase: Android, iOS, web)
- Gemini AI (`gemini-3.5-flash-lite`) for reflections, via a Python Vercel serverless function (`api/reflect.py`, key server-side only) — honest demo reflector mode when the endpoint is not configured
- Firebase Authentication + Firestore for accounts and sync
- react-native-reanimated, expo-blur, expo-haptics, expo-linear-gradient

## Run it

```sh
npm install
npm run web        # web
npm run android    # Android (Expo Go / emulator)
npm run ios        # iOS (Expo Go)
```

The reflection endpoint is `api/reflect.py` (Python, Vercel serverless). Set `GEMINI_API_KEY` server-side only, never in the app or repo. Without it the app runs its on-device demo reflector and says so.

## Firebase

Firebase wiring is a publish step: create the project, enable Email/Password + Google sign-in (email-link OFF), publish `firestore.rules`, and fill in the TODO-MOODJOURNAL placeholders in `lib/firebase.ts` and `lib/firebase.native.ts`, then set `firebaseConfigured=true` in `lib/config.ts`.

## License

MIT License — Copyright (c) 2026 Aryanmouli Cherupalli
