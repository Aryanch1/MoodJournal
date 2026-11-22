import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { prettyDate } from '../lib/mood';
import { moodColors, palette, radii, spacing, type } from '../lib/theme';
import { MOOD_LABELS, type JournalEntry } from '../lib/types';
import { GlassCard } from './ui';

/**
 * One entry in the river — a soft card with a mood dot, the date, the
 * mood word, and a one-line excerpt of the journal text. Tapping
 * opens the entry detail.
 */
export function EntryCard({
  entry,
  index,
  selected,
}: {
  entry: JournalEntry;
  index: number;
  selected?: boolean;
}) {
  const excerpt = entry.text.trim();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).springify()}>
      <GlassCard style={[styles.card, selected && styles.cardSelected]}>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: moodColors[entry.mood] }]}>
            <Text style={styles.dotText}>{entry.mood}</Text>
          </View>
          <View style={styles.main}>
            <Text style={styles.date}>{prettyDate(entry.date)}</Text>
            <Text style={styles.moodWord}>{MOOD_LABELS[entry.mood]}</Text>
          </View>
          {entry.isDemo ? (
            <View style={styles.demoChip}>
              <Text style={styles.demoChipText}>DEMO</Text>
            </View>
          ) : null}
        </View>
        {excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>
            {excerpt}
          </Text>
        ) : (
          <Text style={styles.excerptMuted}>Mood only — no words written today.</Text>
        )}
        {entry.reflection ? (
          <Text style={styles.reflectionNote} numberOfLines={1}>
            Reflection saved · {entry.reflection.source === 'live' ? 'LIVE AI' : 'DEMO'}
          </Text>
        ) : (
          <Text style={styles.reflectionNote}>No reflection yet — open the entry to get one.</Text>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardSelected: { borderColor: palette.primary, borderWidth: 2 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  dot: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  dotText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  main: { flex: 1 },
  date: { ...type.caption, color: palette.muted },
  moodWord: { ...type.title, color: palette.ink, fontSize: 22, lineHeight: 26 },
  demoChip: {
    backgroundColor: palette.warningSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demoChipText: { color: palette.warning, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  excerpt: { ...type.body, color: palette.body, marginTop: spacing.sm },
  excerptMuted: { ...type.body, color: palette.muted, fontStyle: 'italic', marginTop: spacing.sm },
  reflectionNote: { ...type.caption, color: palette.primary, marginTop: spacing.sm },
});
