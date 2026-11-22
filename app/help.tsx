import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuroraBackground } from '../components/AuroraBackground';
import { GhostButton, GlassCard, IconButton, SectionHeader } from '../components/ui';
import { palette, spacing, type, useResponsive } from '../lib/theme';

/** Help & about — how the journal works, privacy, and the wellness note. */
export default function HelpScreen() {
  const router = useRouter();
  const r = useResponsive();
  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Help & about</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SectionHeader kicker="Help" title="How MoodJournal works" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            1. On the Today tab, tap the mood that fits how today felt —
            from 1 (Low) to 5 (Bright). Tapping a mood saves it right
            away, so a mood-only day still counts toward your streak.
          </Text>
          <Text style={styles.body}>
            2. Write a few lines if you like — what happened, what it felt
            like. Writing is optional; a mood alone is a complete entry.
          </Text>
          <Text style={styles.body}>
            3. Tap “Reflect with me”. You get one short, kind reflection
            and one small prompt to carry into tomorrow. The Week tab
            shows your mood arc and streak; the Entries tab is the river
            of everything you have written.
          </Text>
          <Text style={styles.body}>
            4. Open any entry to read it again, edit it, get a fresh
            reflection, or delete it. Your history of reflections lives in
            Settings for one-tap re-use.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Privacy" title="Your words stay yours" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            Entries live on your device, and in your account when you sign
            in. Nothing is shared with anyone else. Guest mode lasts for
            this visit only — sign in to keep your journal across devices.
          </Text>
          <Text style={styles.body}>
            Reflections marked LIVE AI are written by the hosted service;
            reflections marked DEMO are written on your device by a simple
            rule-based reflector that only echoes back what you wrote.
          </Text>
        </GlassCard>

        <SectionHeader kicker="A gentle note" title="Not medical advice" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            MoodJournal is a wellness journal. It does not diagnose,
            treat, or label anything, and its reflections are not medical
            advice. If you are struggling, please reach out to a doctor,
            a counsellor, or a trusted person — asking for help is a
            strong thing to do.
          </Text>
        </GlassCard>

        <SectionHeader kicker="About" title="MoodJournal" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            A quiet daily mood journal by Aryanmouli Cherupalli — one small
            page a day, a gentle reflection, and a week you can see at a
            glance. Built with React Native + Expo + TypeScript, Gemini AI
            and Firebase.
          </Text>
        </GlassCard>

        <GhostButton label="Back to the journal" onPress={() => router.replace('/')} />
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
  body: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25 },
});
