import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import { EntryCard } from '../components/EntryCard';
import { MoodArc } from '../components/MoodArc';
import { MoonRefreshButton, PullToRefresh } from '../components/MoonRefresh';
import {
  Chip,
  DemoBadge,
  EmptyState,
  GlassCard,
  IconButton,
  LiveBadge,
  PrimaryButton,
  SpringPress,
} from '../components/ui';
import { demoReflect, prettyDate, reflectEntry, todayKey, weekSeries } from '../lib/mood';
import { useApp } from '../lib/store';
import { moodColors, palette, radii, spacing, type, useResponsive } from '../lib/theme';
import { MOOD_LABELS, MOODS, MOOD_WORDS, type Mood, type Reflection } from '../lib/types';

type Tab = 'today' | 'week' | 'entries';

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'entries', label: 'Entries' },
];

/**
 * Home — the dusk journal. Top segmented tabs (Today | Week |
 * Entries). Today leads with a large mood-orb hero: tap a mood to
 * log it, write a few lines, and get one gentle reflection back.
 * Week shows the mood arc and the streak. Entries is a river of
 * dated cards, newest first. On ≥840dp the screen splits: river
 * left, selected entry on the right. No photo hero — this is a
 * quiet journal.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { sortedEntries, todayEntry, streak, weekAvg, user, guest, saveEntry } = useApp();
  const r = useResponsive();
  const [tab, setTab] = useState<Tab>('today');
  const [mood, setMood] = useState<Mood | null>(todayEntry?.mood ?? null);
  const [text, setText] = useState(todayEntry?.text ?? '');
  const [reflection, setReflection] = useState<Reflection | null>(todayEntry?.reflection ?? null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const hasDemo = sortedEntries.some((e) => e.isDemo);
  const selected = sortedEntries.find((e) => e.id === selectedId) ?? sortedEntries[0] ?? null;
  const orbColor = mood ? moodColors[mood] : palette.primarySoft;
  const orbWord = mood ? MOOD_LABELS[mood] : 'How are you?';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The journal is local; refresh re-reads state and replays the moon.
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const pickMood = (m: Mood) => {
    setMood(m);
    setNotice(null);
    // Tapping a mood saves it right away, so a mood-only day still counts.
    const saved = saveEntry({
      date: todayKey(),
      mood: m,
      text,
      reflection: null,
    });
    setReflection(saved.reflection);
    setNotice(`Logged ${MOOD_LABELS[m]} for today.`);
  };

  const reflect = async () => {
    if (!mood) {
      setNotice('Pick a mood first — then I can reflect with you.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await reflectEntry(mood, text, todayKey());
      const saved = saveEntry({ date: todayKey(), mood, text, reflection: result });
      setReflection(saved.reflection);
      setNotice(
        result.source === 'live'
          ? 'Reflection saved. (Live AI)'
          : 'Reflection saved. (Demo reflection — live AI is not connected yet.)',
      );
    } finally {
      setBusy(false);
    }
  };

  const reflectDemo = () => {
    if (!mood) {
      setNotice('Pick a mood first — then I can reflect with you.');
      return;
    }
    const result = demoReflect(mood, text);
    const saved = saveEntry({ date: todayKey(), mood, text, reflection: result });
    setReflection(saved.reflection);
    setNotice('Demo reflection saved.');
  };

  const hero = (
    <>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.kicker}>MOODJOURNAL</Text>
        <Text style={[styles.hero, r.display]}>One small page a day.</Text>
        <Text style={styles.heroBody}>
          A quiet minute to check in with yourself — pick a mood, write a
          few honest lines, and carry one gentle thought into tomorrow.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <View style={styles.orbWrap}>
          <View style={[styles.orb, { backgroundColor: orbColor }]}>
            <Text style={styles.orbWord}>{orbWord}</Text>
            {mood ? <Text style={styles.orbSub}>{MOOD_WORDS[mood]}</Text> : null}
          </View>
          <View style={styles.streakRow}>
            <View style={styles.streakStat}>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakNum}>
                {weekAvg === null ? '—' : weekAvg.toFixed(1)}
              </Text>
              <Text style={styles.streakLabel}>week average</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakNum}>{sortedEntries.length}</Text>
              <Text style={styles.streakLabel}>entries</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );

  const moodPicker = (
    <View style={styles.moodRow}>
      {MOODS.map((m) => (
        <SpringPress key={m} haptic onPress={() => pickMood(m)} style={styles.moodOrbWrap}>
          <View
            style={[
              styles.moodOrb,
              { backgroundColor: moodColors[m] },
              mood === m && styles.moodOrbSelected,
            ]}
          >
            <Text style={styles.moodOrbNum}>{m}</Text>
          </View>
          <Text style={[styles.moodOrbLabel, mood === m && styles.moodOrbLabelSelected]}>
            {MOOD_LABELS[m]}
          </Text>
        </SpringPress>
      ))}
    </View>
  );

  const todayView = (
    <View>
      <Text style={styles.stripTitle}>How are you feeling today?</Text>
      {moodPicker}
      <TextInput
        style={styles.journalInput}
        value={text}
        onChangeText={setText}
        placeholder="Write a few lines about today — what happened, what it felt like. (Optional.)"
        placeholderTextColor={palette.muted}
        multiline
        textAlignVertical="top"
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <PrimaryButton label="Reflect with me" onPress={() => void reflect()} loading={busy} disabled={!mood} />
      <View style={styles.demoLink}>
        <Pressable onPress={reflectDemo} disabled={!mood}>
          <Text style={styles.demoLinkText}>Use the on-device demo reflection instead</Text>
        </Pressable>
      </View>
      {reflection ? (
        <Animated.View entering={FadeInDown.springify()}>
          <GlassCard style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <Text style={styles.reflectionKicker}>YOUR REFLECTION</Text>
              {reflection.source === 'live' ? <LiveBadge /> : <DemoBadge />}
            </View>
            <Text style={styles.reflectionText}>{reflection.reflection}</Text>
            <Text style={styles.reflectionPrompt}>For tomorrow: {reflection.prompt}</Text>
          </GlassCard>
        </Animated.View>
      ) : null}
      <Text style={styles.disclaimer}>
        MoodJournal is a wellness journal, not medical advice. If you are
        struggling, please reach out to a doctor or a trusted person.
      </Text>
    </View>
  );

  const weekView = (
    <View>
      <Text style={styles.stripTitle}>Your week, in one arc</Text>
      <GlassCard style={styles.arcCard}>
        <MoodArc entries={sortedEntries} />
        <View style={styles.weekStats}>
          <View style={styles.weekStat}>
            <Text style={styles.weekStatNum}>{streak}</Text>
            <Text style={styles.weekStatLabel}>day streak</Text>
          </View>
          <View style={styles.weekStat}>
            <Text style={styles.weekStatNum}>
              {weekAvg === null ? '—' : weekAvg.toFixed(1)}
            </Text>
            <Text style={styles.weekStatLabel}>week average mood</Text>
          </View>
        </View>
      </GlassCard>
      {weekSeries(sortedEntries).map((s) => (
        <View key={s.date} style={styles.weekRow}>
          <Text style={styles.weekRowDate}>{prettyDate(s.date)}</Text>
          <Text style={styles.weekRowMood}>
            {s.entry ? `${MOOD_LABELS[s.entry.mood]} · ${s.entry.text ? 'wrote a few lines' : 'mood only'}` : 'No entry yet'}
          </Text>
        </View>
      ))}
    </View>
  );

  const entriesView = (
    <View>
      <Text style={styles.stripTitle}>The river — newest first</Text>
      {hasDemo ? (
        <Text style={styles.demoNote}>
          Showing demo entries from the last 6 days so you can see the
          journal at work — clear them in Settings.
        </Text>
      ) : null}
      {sortedEntries.length === 0 ? (
        <EmptyState
          glyph="🌙"
          title="No entries yet"
          body="Pick a mood on the Today tab and write your first page — even one line counts."
          actionLabel="Go to Today"
          onAction={() => setTab('today')}
        />
      ) : (
        sortedEntries.map((entry, i) => (
          <View key={entry.id}>
            {r.twoPane ? (
              <Pressable
                onPress={() => {
                  setSelectedId(entry.id);
                  setNotice(`Showing ${prettyDate(entry.date)} on the right.`);
                }}
              >
                <EntryCard entry={entry} index={i} selected={selected?.id === entry.id} />
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push(`/entry/${entry.id}` as never)}>
                <EntryCard entry={entry} index={i} />
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );

  const tabs = (
    <View style={styles.tabs}>
      {TABS.map((t) => (
        <Chip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
      ))}
    </View>
  );

  const body = (
    <>
      {tabs}
      {tab === 'today' ? todayView : null}
      {tab === 'week' ? weekView : null}
      {tab === 'entries' ? entriesView : null}
    </>
  );

  if (r.twoPane) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <View style={styles.twoPane}>
          <View style={styles.paneList}>
            <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
              <View style={styles.paneScrollContent}>
                <View style={styles.topRow}>
                  <Text style={styles.greetingText}>
                    {user?.name ? `Hello, ${user.name.split(' ')[0]}` : guest ? 'Hello, guest' : 'Hello'}
                  </Text>
                  <IconButton label="⚙" onPress={() => router.push('/settings')} />
                </View>
                {hero}
                {body}
              </View>
            </PullToRefresh>
          </View>
          <View style={styles.paneDetail}>
            {selected ? (
              <GlassCard style={styles.detailCard}>
                <Text style={styles.detailKicker}>
                  {prettyDate(selected.date)} · {MOOD_LABELS[selected.mood].toUpperCase()}
                </Text>
                <Text style={styles.detailTitle}>
                  {selected.text ? selected.text.slice(0, 80) : 'Mood only — no words written.'}
                </Text>
                {selected.reflection ? (
                  <>
                    <Text style={styles.detailSummary}>{selected.reflection.reflection}</Text>
                    <Text style={styles.detailPrompt}>For tomorrow: {selected.reflection.prompt}</Text>
                  </>
                ) : (
                  <Text style={styles.detailSummary}>No reflection yet for this entry.</Text>
                )}
                <PrimaryButton
                  label="Open the full entry"
                  onPress={() => router.push(`/entry/${selected.id}` as never)}
                />
              </GlassCard>
            ) : (
              <EmptyState glyph="🌙" title="Nothing selected" body="Pick an entry on the left to see it here." />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View style={styles.scroll}>
          <View style={styles.topRow}>
            <Text style={styles.greetingText}>
              {user?.name ? `Hello, ${user.name.split(' ')[0]}` : guest ? 'Hello, guest' : 'Hello'}
            </Text>
            <View style={styles.topActions}>
              {Platform.OS === 'web' ? (
                <Pressable onPress={onRefresh} hitSlop={8}>
                  <MoonRefreshButton refreshing={refreshing} />
                </Pressable>
              ) : null}
              <IconButton label="⚙" onPress={() => router.push('/settings')} />
            </View>
          </View>
          {hero}
          {body}
        </View>
      </PullToRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 120, paddingTop: 56 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  topActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  greetingText: { ...type.subtitle, color: palette.ink },
  kicker: { ...type.label, color: palette.primary, marginBottom: 8 },
  hero: { color: palette.ink, marginBottom: 10 },
  heroBody: { ...type.body, color: palette.body, marginBottom: spacing.lg, maxWidth: 560 },
  orbWrap: { marginBottom: spacing.lg },
  orb: {
    alignItems: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    minHeight: 168,
    padding: spacing.lg,
    ...{ shadowColor: palette.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 6 },
  },
  orbWord: { color: '#FFFFFF', fontFamily: 'Lora_700Bold', fontSize: 34, lineHeight: 38, textAlign: 'center' },
  orbSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  streakRow: {
    alignItems: 'center',
    backgroundColor: palette.ink,
    borderRadius: radii.card,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingVertical: 16,
    width: '100%',
  },
  streakStat: { alignItems: 'center', flex: 1 },
  streakNum: { color: '#FFFFFF', fontFamily: 'Lora_700Bold', fontSize: 28, lineHeight: 30 },
  streakLabel: { color: 'rgba(247,244,250,0.65)', fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  statDivider: { backgroundColor: 'rgba(255,255,255,0.18)', height: 36, width: 1 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  stripTitle: { ...type.subtitle, color: palette.ink, marginBottom: spacing.sm },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: spacing.md },
  moodOrbWrap: { alignItems: 'center', gap: 6, minWidth: 56 },
  moodOrb: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  moodOrbSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  moodOrbNum: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  moodOrbLabel: { color: palette.body, fontSize: 12, fontWeight: '700' },
  moodOrbLabelSelected: { color: palette.primary },
  journalInput: {
    backgroundColor: palette.primaryPale,
    borderColor: palette.line,
    borderRadius: radii.card,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
    minHeight: 140,
    padding: spacing.md,
  },
  notice: { ...type.bodyStrong, color: palette.success, marginBottom: spacing.md, textAlign: 'center' },
  demoLink: { alignItems: 'center', marginTop: spacing.sm },
  demoLinkText: { ...type.body, color: palette.primary, textDecorationLine: 'underline' },
  reflectionCard: { gap: 10, marginTop: spacing.lg, padding: spacing.lg },
  reflectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  reflectionKicker: { ...type.label, color: palette.primary },
  reflectionText: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 24 },
  reflectionPrompt: { ...type.bodyStrong, color: palette.primary },
  disclaimer: { ...type.caption, color: palette.muted, marginTop: spacing.lg, textAlign: 'center' },
  demoNote: { ...type.body, color: palette.muted, marginBottom: spacing.md },
  arcCard: { marginBottom: spacing.md, padding: spacing.md },
  weekStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  weekStat: { alignItems: 'center' },
  weekStatNum: { color: palette.ink, fontFamily: 'Lora_700Bold', fontSize: 28, lineHeight: 30 },
  weekStatLabel: { color: palette.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  weekRow: {
    alignItems: 'center',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  weekRowDate: { ...type.bodyStrong, color: palette.ink },
  weekRowMood: { ...type.body, color: palette.body },
  twoPane: { flex: 1, flexDirection: 'row', gap: 24, padding: 28 },
  paneList: { flex: 1.1 },
  paneScrollContent: { paddingBottom: 32, paddingTop: 8 },
  paneDetail: { flex: 1, paddingTop: 120 },
  detailCard: { gap: 12, padding: spacing.lg },
  detailKicker: { ...type.label, color: palette.primary },
  detailTitle: { ...type.title, color: palette.ink },
  detailSummary: { ...type.body, color: palette.body },
  detailPrompt: { ...type.bodyStrong, color: palette.primary },
});
