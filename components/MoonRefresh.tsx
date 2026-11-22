import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { palette } from '../lib/theme';

/**
 * MoodJournal's custom pull-to-refresh: a small moon rising.
 *
 * The pull is scrubbed by finger distance — a crescent moon rises out
 * of the dusk and fills with warm peach as the user pulls; past the
 * threshold, releasing plays the rise loop (the moon bobs gently and
 * glows) while data returns, then the content settles with a spring
 * and cards re-enter with a stagger. Never the stock spinner. On web,
 * where native pull-to-refresh doesn't exist, the same animation is
 * wired to the header refresh button (see `MoonRefreshButton`).
 */

const THRESHOLD = 90;

function MoonVisual({
  fill,
  refreshing,
}: {
  /** 0–1 fill level while pulling; ignored while `refreshing` loops. */
  fill: SharedValue<number>;
  refreshing: boolean;
}) {
  const bob = useSharedValue(0);
  useEffect(() => {
    if (refreshing) {
      bob.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      );
    } else {
      bob.value = withTiming(0, { duration: 200 });
    }
  }, [refreshing, bob]);
  const moonStyle = useAnimatedStyle(() => ({
    opacity: refreshing ? 1 : Math.max(0, fill.value),
    transform: [
      { translateY: refreshing ? bob.value : (1 - fill.value) * 34 },
      { scale: refreshing ? 1 : 0.82 + fill.value * 0.18 },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    height: `${Math.round((refreshing ? 1 : fill.value) * 100)}%`,
    opacity: refreshing ? 0.9 : fill.value * 0.85,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: refreshing
      ? withRepeat(
          withSequence(withTiming(1, { duration: 400 }), withTiming(0.35, { duration: 400 })),
          -1,
          true,
        )
      : fill.value > 0.85
        ? 1
        : 0,
  }));
  return (
    <View style={styles.moonWrap}>
      <Animated.View style={[styles.moon, moonStyle]}>
        <Animated.View style={[styles.moonFill, glowStyle]} />
        <Text style={styles.moonGlyph}>🌙</Text>
      </Animated.View>
      <Animated.Text style={[styles.moonMark, labelStyle]}>RISING</Animated.Text>
    </View>
  );
}

/** The header refresh visual on web — same moon, same loop. Wrap it
 *  in the parent's own pressable; this component is visual only. */
export function MoonRefreshButton({ refreshing }: { refreshing: boolean }) {
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withSpring(refreshing ? 1 : 0, { damping: 14, stiffness: 200 });
  }, [refreshing, fill]);
  return <MoonVisual fill={fill} refreshing={refreshing} />;
}

export function PullToRefresh({
  refreshing,
  onRefresh,
  children,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  // 0–1 pull progress; the moon reads it directly.
  const pull = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      pull.value = Math.min(1, Math.max(0, -event.contentOffset.y / THRESHOLD));
    },
    onEndDrag: (event) => {
      if (event.contentOffset.y < -THRESHOLD) {
        runOnJS(onRefresh)();
      }
    },
  });

  const indicatorStyle = useAnimatedStyle(() => ({
    height: refreshing ? 96 : pull.value * 96,
    opacity: refreshing || pull.value > 0.08 ? 1 : 0,
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.indicator, indicatorStyle]}>
        <MoonVisual fill={pull} refreshing={refreshing} />
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: { paddingBottom: 140 },
  moonWrap: { alignItems: 'center', justifyContent: 'center' },
  moon: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
    borderRadius: 28,
    borderWidth: 3,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  moonFill: {
    backgroundColor: palette.peach,
    bottom: 0,
    left: 0,
    opacity: 0.55,
    position: 'absolute',
    right: 0,
  },
  moonGlyph: { fontSize: 26 },
  moonMark: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginTop: 6,
  },
});
