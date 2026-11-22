# MoodJournal — Design

## Identity: "Dusk Journal"

A quiet journal kept at dusk. The home is a **river of dated entries** (newest first, each a soft card with a mood dot and a one-line excerpt) under a **large mood-orb hero** — a rounded plum panel whose color is the mood you picked today, with the mood word set large in Lora. Navigation is **top segmented tabs (Today | Week | Entries)**; on wide screens a clean **side rail** holds the entry detail next to the river (two-pane list + detail, entries left, detail right). The designed data visual is the **weekly mood arc** — a simple SVG line/area chart with a dot per day in that day's mood color.

Nothing here is borrowed from the previous apps: no photo hero, no floating glass pill tab bar, no ledger, no dashboard grid, no budget ring, no big-button dock, no board-switcher chips, no poster type, no day-timeline.

## Tokens

- **Palette:** dusk plum `#5E3A7A` (primary, deep `#3E2453`, light `#7E5A9E`, soft `#EDE5F5`, pale `#F7F4FA`); warm peach `#F2A07B` and soft rose `#E0787A` as sparing accents; ground pale lavender-white `#F7F4FA`; ink `#2E2438`, body `#5B5266`, muted `#8E8698`. Distinct from BudgetBuddy's bright violet `#5A2EE6` + lime on warm paper: MoodJournal's plum is deeper and duskier, the accent is warm peach/rose instead of lime, the ground is lavender-white, and the type is a gentle serif.
- **Display font:** Lora 700 (`@expo-google-fonts/lora`) — a soft humanist serif, new among the daily apps (Sora, Fraunces, Bricolage Grotesque, Archivo, Space Grotesk, DM Serif Display, Bebas Neue were all used before). Body stays on the system font.
- **Mood colors:** 1 Low `#7C86A6` slate, 2 Heavy `#9B7FB8` lavender, 3 Okay `#C99B6B` warm tan, 4 Good `#E0787A` rose, 5 Bright `#F2A07B` peach.
- **Radii:** cards 30px, sheets 38px top, pills fully round, inputs 24px. **Spacing:** 8-point grid (4/8/16/24/32/48). **Shadows:** soft layered card shadow + plum glow on the primary CTA.
- **Glass:** every frosted surface uses the two-layer structure — outer view carries background + shadow, inner overflow-hidden view clips the BlurView — so Android never paints a white plate.
- **Buttons:** gradient primary pill (plum light → deep) with glow shadow; frosted-glass ghost pills. Every tap springs to ~0.95 with overshoot and a light haptic on primary actions; mood orbs and chips pop on select; loading shows bouncing dots, never a freeze.

## Refresh motif: a moon rising

Pull down and a small crescent moon rises out of the dusk and fills with warm peach as you pull; past the threshold, releasing plays the rise loop (the moon bobs gently and glows) while data returns, then content settles with a spring and cards re-enter with a stagger. On web the same animation is wired to a header refresh button. Different from every earlier motif (orb, capsule, coins, sprout, stamp, piggy bank, rising sun, droplet).

## Screen inventory (full flow)

1. **Splash** — pale lavender hold with the plum moon tile while Lora loads.
2. **Welcome** — dusk panel (plum arch, peach moon, "ONE SMALL PAGE A DAY") + glass card with exactly four options: Continue with Google / Create account (name + email + password + confirm, match check) / Log in (+ Forgot password reset email) / Continue without an account. Wellness disclaimer at the foot.
3. **Today (home)** — mood-orb hero + streak strip (streak / week average / entries) + mood picker (5 orbs) + journal text input + "Reflect with me" CTA + reflection card (DEMO/LIVE badge) + wellness disclaimer.
4. **Reflection detail** — inside the Today card and the entry detail: reflection text, prompt for tomorrow, source badge.
5. **Week** — mood-arc chart card + streak/average stats + one row per day (date, mood word, wrote/mood-only).
6. **Entries (river)** — dated entry cards, newest first; demo note when seeded data is showing; empty state with a CTA back to Today.
7. **Entry detail / edit** — mood dot + word, full text, edit mode (mood picker + text + save), re-reflect (live or demo), delete with confirmation wording.
8. **Settings** — profile (photo via client-side resized base64, display name, email + sign-in method, password-reset email, sign out) or guest account card; reflection history (one-tap re-use, clear-history); services status (reflection AI, accounts, entry count, version read from app.json); storage + clear demo data.
9. **Help & about** — how the journal works (4 steps), privacy, the "not medical advice" note, about.
10. **Empty / error states** — no entries yet, entry not found, reflection failed (falls back to demo and says so), sign-in errors in plain words.

## Animation plan

- App open: splash hold → Welcome/Today fades in; hero and orb rise with a spring (FadeInDown.springify, 60ms stagger).
- Mood pick: the orb pops (scale bounce) and the hero panel cross-fades to the picked mood color; the streak strip stays put.
- Reflection: skeleton dots while the endpoint answers, then the reflection card rises in with a spring.
- Tab change: content cross-fades with a short spring; cards re-enter staggered (60ms each, capped at 6).
- Pull-to-refresh: moon rises and fills, scrubbed by finger distance; release plays the bob loop; content settles with a spring.
- Presses: every tappable element springs to ~0.95 with overshoot; chips pop on select.
- Two-pane: selecting an entry in the river updates the right-hand detail card in place with a spring, and shows a one-line notice where the user is looking.

## Responsive

Breakpoints: <600 compact (single column, full-width cards), 600–840 medium (wider cap, larger type), 840–1280 wide (two-pane: river left, entry detail right), ≥1280 desktop (centered shell, max 1120). Tap targets ≥44px everywhere; no horizontal scroll; aurora blobs clipped so they never widen the page. Widths checked (local serve, static audit + live render where possible): 360 / 390 / 430 / 600 / 840 / 1024 / 1440.

## Self-check scores (quality / distinctness)

- Today: 90% / 95% — the orb hero + segmented tabs read as a journal, nothing like the ledger, board, grid or ring homes before it.
- Week: 90% / 95% — the mood arc is a new data visual; no previous app charted a week this way.
- Entries river: 88% / 92% — dated soft cards with mood dots; the river structure is new (BloodBond's board is a filterable feed, this is a dated journal river).
- Entry detail: 88% / 90% — quiet full-page read with inline edit; no overlap with earlier detail screens.
- Welcome: 88% / 90% — dusk panel + moon art, distinct from the droplet/stamp/sun panels.
- Settings / Help: 85% / 85% — same standard system as the other apps by design (the accounts system is shared), dressed in the dusk tokens.

## Figma

File: "MoodJournal — Daily App" — https://www.figma.com/design/h2a1TNvjb4dlGh5m3IJesi. The file was created, but the canvas population write did NOT land: the Figma MCP Starter-plan tool-call limit was reached on the second use_figma call (same limit that stopped BloodBond and ElderEase). DESIGN.md is the source of truth.
