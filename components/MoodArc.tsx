import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { weekSeries } from '../lib/mood';
import { moodColors, palette, type } from '../lib/theme';
import type { JournalEntry } from '../lib/types';

const W = 340;
const H = 150;
const PAD = 28;

/**
 * The weekly mood arc — MoodJournal's designed data visual. A simple
 * SVG line/area chart: seven days across, mood 1–5 up, a soft peach
 * area under a plum line, and a dot on each logged day in that day's
 * mood color. Days with no entry show a hollow marker on the baseline.
 */
export function MoodArc({ entries }: { entries: JournalEntry[] }) {
  const series = weekSeries(entries);
  const points = series.map((s, i) => {
    const x = PAD + (i * (W - PAD * 2)) / 6;
    const y = s.entry ? H - PAD - ((s.entry.mood - 1) / 4) * (H - PAD * 2) : H - 14;
    return { x, y, day: s, label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${s.date}T12:00:00`).getDay()] };
  });
  const logged = points.filter((p) => p.day.entry !== null);
  const line =
    logged.length > 1
      ? `M ${logged.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
      : '';
  const area =
    logged.length > 1
      ? `${line} L ${logged[logged.length - 1].x.toFixed(1)},${H - 10} L ${logged[0].x.toFixed(1)},${H - 10} Z`
      : '';
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {area ? <Path d={area} fill="rgba(242, 160, 123, 0.22)" /> : null}
        {line ? <Path d={line} fill="none" stroke={palette.primary} strokeWidth={3} strokeLinecap="round" /> : null}
        {points.map((p) => (
          <Circle
            key={p.day.date}
            cx={p.x}
            cy={p.y}
            r={p.day.entry ? 7 : 5}
            fill={p.day.entry ? moodColors[p.day.entry.mood] : palette.ground}
            stroke={p.day.entry ? '#FFFFFF' : palette.muted}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.labels}>
        {points.map((p) => (
          <Text key={p.day.date} style={styles.dayLabel}>
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14 },
  dayLabel: { ...type.caption, color: palette.muted, textAlign: 'center', width: 40 },
});
