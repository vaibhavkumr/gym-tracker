import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../design/colors';
import { Typography } from '../../design/typography';
import { useWorkoutStore } from '../../store/workoutStore';
import { useSensorStore } from '../../store/sensorStore';
import * as Haptics from 'expo-haptics';

function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <View style={[styles.statDot, { backgroundColor: color + '18' }]}>
        <View style={[styles.statDotInner, { backgroundColor: color }]} />
      </View>
      <Text style={[Typography.metric, { color, fontSize: 28, letterSpacing: -0.5 }]}>{value}</Text>
      {unit && <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>{unit}</Text>}
      <Text style={[Typography.label, { color: Colors.textMuted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function SessionRow({ session }: { session: any }) {
  const vol = session.totalVolume > 1000
    ? `${(session.totalVolume / 1000).toFixed(1)}k kg`
    : `${session.totalVolume} kg`;
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <View style={styles.sessionIconWrap}>
          <Ionicons name="barbell" size={16} color={Colors.accent} />
        </View>
        <View>
          <Text style={Typography.h4}>{session.title}</Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>{session.date}</Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>{session.totalSets} sets</Text>
        <View style={[styles.volPill, { backgroundColor: Colors.accentGlow }]}>
          <Text style={[Typography.tag, { color: Colors.accent }]}>{vol}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const sessions = useWorkoutStore(s => s.sessions);
  const personalRecords = useWorkoutStore(s => s.personalRecords);
  const profile = useWorkoutStore(s => s.profile);
  const sensorMode = useSensorStore(s => s.mode);
  const startSession = useWorkoutStore(s => s.startSession);

  const recentSessions = sessions.slice(0, 3);
  const thisWeek = sessions.filter(s => {
    const diff = (Date.now() - new Date(s.startTime).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const weeklyVolume = thisWeek.reduce((sum, s) => sum + s.totalVolume, 0);
  const prCount = Object.keys(personalRecords).length;
  const recentPRs = Object.values(personalRecords)
    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, 3);

  function handleStartWorkout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession('Workout');
    router.push('/session');
  }

  const sensorColor = sensorMode === 'connected' ? Colors.success
    : sensorMode === 'phone_only' ? Colors.accent : Colors.textMuted;
  const sensorLabel = sensorMode === 'connected' ? 'CLIP ON'
    : sensorMode === 'phone_only' ? 'PHONE' : 'NO SENSOR';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient
        colors={['#4353FF', '#7C3AED']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>WELCOME BACK</Text>
            <Text style={styles.heroName}>{profile.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.sensorBadge}
            onPress={() => router.push('/connect')}
            activeOpacity={0.8}
          >
            <View style={[styles.sensorDot, { backgroundColor: sensorColor }]} />
            <Text style={[styles.sensorLabel, { color: sensorColor }]}>{sensorLabel}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout} activeOpacity={0.9}>
          <View style={styles.startBtnInner}>
            <View style={styles.startBtnIcon}>
              <Ionicons name="play" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.startBtnText}>START WORKOUT</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Weekly Stats */}
      <View style={styles.section}>
        <Text style={[Typography.label, { color: Colors.textMuted, marginBottom: 12 }]}>THIS WEEK</Text>
        <View style={styles.statsRow}>
          <StatCard label="WORKOUTS" value={String(thisWeek.length)} color={Colors.accent} />
          <StatCard
            label="VOLUME"
            value={weeklyVolume > 1000 ? (weeklyVolume / 1000).toFixed(1) : String(weeklyVolume)}
            unit={weeklyVolume > 1000 ? 'k kg' : 'kg'}
            color={Colors.purple}
          />
          <StatCard label="PRs SET" value={String(prCount)} color={Colors.success} />
        </View>
      </View>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[Typography.label, { color: Colors.textMuted }]}>RECENT RECORDS</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/records')}>
              <Text style={[Typography.caption, { color: Colors.accent, fontWeight: '700' }]}>SEE ALL →</Text>
            </TouchableOpacity>
          </View>
          {recentPRs.map(pr => (
            <View key={pr.exerciseId} style={styles.prRow}>
              <View style={styles.prTrophy}>
                <Ionicons name="trophy" size={14} color={Colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{pr.exerciseName}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                  {pr.maxWeight > 0 ? `${pr.maxWeight} kg × ${pr.maxReps} reps` : `${pr.maxReps} reps`}
                </Text>
              </View>
              <View style={[styles.e1rmPill, { backgroundColor: Colors.accentGlow }]}>
                <Text style={[Typography.tag, { color: Colors.accent }]}>~{pr.estimatedOneRepMax} 1RM</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[Typography.label, { color: Colors.textMuted }]}>RECENT SESSIONS</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={[Typography.caption, { color: Colors.accent, fontWeight: '700' }]}>SEE ALL →</Text>
          </TouchableOpacity>
        </View>
        {recentSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="barbell-outline" size={36} color={Colors.textMuted} />
            <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 10, textAlign: 'center' }]}>
              No workouts yet — tap Start Workout above
            </Text>
          </View>
        ) : (
          recentSessions.map(s => <SessionRow key={s.id} session={s} />)
        )}
      </View>

      {/* Watch Banner */}
      {!profile.watchConnected && (
        <TouchableOpacity style={styles.watchBanner} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
          <LinearGradient colors={['#EEF2FF', '#E8EFFF']} style={styles.watchBannerInner}>
            <View style={styles.watchIcon}>
              <Ionicons name="watch-outline" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={Typography.h4}>Connect Apple Watch</Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                Real-time heart rate and calories burned
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero: {
    paddingTop: 64, paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  heroGreeting: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  heroName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 },

  sensorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sensorDot: { width: 6, height: 6, borderRadius: 3 },
  sensorLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  startBtn: { borderRadius: 18, overflow: 'hidden' },
  startBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 18,
  },
  startBtnIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  startBtnText: { fontSize: 15, fontWeight: '900', color: Colors.accent, letterSpacing: 2 },

  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, padding: 14, alignItems: 'center', gap: 3,
    shadowColor: '#4353FF', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
  },
  statDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statDotInner: { width: 10, height: 10, borderRadius: 5 },

  prRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  prTrophy: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.warningGlow, alignItems: 'center', justifyContent: 'center',
  },
  e1rmPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  volPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },

  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 32, alignItems: 'center',
  },

  watchBanner: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  watchBannerInner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16,
  },
  watchIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
});
