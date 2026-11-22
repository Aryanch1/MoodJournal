import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../../components/AuroraBackground';
import { DemoBadge, EmptyState, GhostButton, GlassCard, IconButton, LiveBadge, PrimaryButton, SectionHeader } from '../../components/ui';
import { demoReflect, prettyDate, reflectEntry } from '../../lib/mood';
import { useApp } from '../../lib/store';
import { moodColors, palette, radii, spacing, type, useResponsive } from '../../lib/theme';
import { MOOD_LABELS, MOODS, type Mood } from '../../lib/types';

/** Entry detail — read, edit, re-reflect, or delete one journal entry. */
export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entryById, updateEntry, deleteEntry } = useApp();
  const r = useResponsive();
  const entry = entryById(id ?? '');
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [text, setText] = useState(entry?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!entry) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <ScrollView contentContainerStyle={styles.scroll}>
          <EmptyState
            glyph="🌙"
            title="Entry not found"
            body="This entry may have been deleted. Your other entries are still on the Entries tab."
            actionLabel="Back to the journal"
            onAction={() => router.replace('/')}
          />
        </ScrollView>
      </View>
    );
  }

  const saveEdit = () => {
    if (!mood) return;
    updateEntry(entry.id, { mood, text: text.trim() });
    setEditing(false);
    setNotice('Entry updated.');
  };

  const reReflect = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await reflectEntry(entry.mood, entry.text, entry.date);
      updateEntry(entry.id, { reflection: result });
      setNotice(result.source === 'live' ? 'New reflection saved. (Live AI)' : 'New reflection saved. (Demo reflection.)');
    } finally {
      setBusy(false);
    }
  };

  const reReflectDemo = () => {
    const result = demoReflect(entry.mood, entry.text);
    updateEntry(entry.id, { reflection: result });
    setNotice('Demo reflection saved.');
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{prettyDate(entry.date)}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View entering={FadeInDown.springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.moodRow}>
              <View style={[styles.dot, { backgroundColor: moodColors[entry.mood] }]}>
                <Text style={styles.dotText}>{entry.mood}</Text>
              </View>
              <View style={styles.moodMain}>
                <Text style={styles.moodWord}>{MOOD_LABELS[entry.mood]}</Text>
                <Text style={styles.moodSub}>{entry.isDemo ? 'Demo entry' : 'Your entry'}</Text>
              </View>
            </View>
            {editing ? (
              <>
                <View style={styles.moodPicker}>
                  {MOODS.map((m) => (
                    <Text
                      key={m}
                      onPress={() => setMood(m)}
                      style={[styles.moodPick, mood === m && styles.moodPickSelected]}
                    >
                      {m} · {MOOD_LABELS[m]}
                    </Text>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="Write a few lines about this day…"
                  placeholderTextColor={palette.muted}
                  multiline
                  textAlignVertical="top"
                />
                <PrimaryButton label="Save changes" onPress={saveEdit} disabled={!mood} />
                <GhostButton label="Cancel" onPress={() => { setEditing(false); setMood(entry.mood); setText(entry.text); }} />
              </>
            ) : (
              <>
                {entry.text ? (
                  <Text style={styles.entryText}>{entry.text}</Text>
                ) : (
                  <Text style={styles.entryTextMuted}>Mood only — no words written that day.</Text>
                )}
                <GhostButton
                  label="Edit this entry"
                  onPress={() => { setEditing(true); setMood(entry.mood); setText(entry.text); }}
                />
              </>
            )}
          </GlassCard>
        </Animated.View>

        <SectionHeader kicker="Reflection" title="What the day said back" />
        {entry.reflection ? (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <GlassCard style={styles.card}>
              <View style={styles.reflectionHeader}>
                <Text style={styles.reflectionKicker}>REFLECTION</Text>
                {entry.reflection.source === 'live' ? <LiveBadge /> : <DemoBadge />}
              </View>
              <Text style={styles.reflectionText}>{entry.reflection.reflection}</Text>
              <Text style={styles.reflectionPrompt}>For tomorrow: {entry.reflection.prompt}</Text>
            </GlassCard>
          </Animated.View>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.noReflection}>No reflection yet for this day.</Text>
          </GlassCard>
        )}
        <PrimaryButton label="Get a new reflection" onPress={() => void reReflect()} loading={busy} />
        <View style={styles.demoLink}>
          <Text onPress={reReflectDemo} style={styles.demoLinkText}>
            Use the on-device demo reflection instead
          </Text>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <SectionHeader kicker="Careful" title="Delete this entry" />
        <GlassCard style={styles.card}>
          <Text style={styles.deleteBody}>This removes the entry and its reflection for good.</Text>
          <GhostButton
            label="Delete entry"
            onPress={() => {
              deleteEntry(entry.id);
              router.replace('/');
            }}
          />
        </GlassCard>
        <Text style={styles.disclaimer}>
          MoodJournal is a wellness journal, not medical advice.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  card: { gap: 12, marginBottom: spacing.xl, padding: spacing.lg },
  moodRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  dot: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  dotText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  moodMain: { flex: 1 },
  moodWord: { ...type.title, color: palette.ink },
  moodSub: { ...type.caption, color: palette.muted, marginTop: 2 },
  moodPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodPick: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.pill,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 44,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  moodPickSelected: { backgroundColor: palette.primary, color: '#FFFFFF' },
  input: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.card,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
    padding: spacing.md,
  },
  entryText: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 26 },
  entryTextMuted: { ...type.body, color: palette.muted, fontStyle: 'italic' },
  reflectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  reflectionKicker: { ...type.label, color: palette.primary },
  reflectionText: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 24 },
  reflectionPrompt: { ...type.bodyStrong, color: palette.primary },
  noReflection: { ...type.body, color: palette.body },
  demoLink: { alignItems: 'center', marginTop: spacing.sm },
  demoLinkText: { ...type.body, color: palette.primary, textDecorationLine: 'underline' },
  notice: { ...type.bodyStrong, color: palette.success, marginTop: spacing.md, textAlign: 'center' },
  deleteBody: { ...type.body, color: palette.body },
  disclaimer: { ...type.caption, color: palette.muted, marginTop: spacing.md, textAlign: 'center' },
});
