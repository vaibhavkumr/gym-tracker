import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../design/colors';
import { Typography } from '../../design/typography';
import { useWorkoutStore } from '../../store/workoutStore';
import { CATEGORIES } from '../../models/exercises';
import { PersonalRecord } from '../../models/types';

function PRCard({ pr }: { pr: PersonalRecord }) {
  const catColor = Colors.accent;
  const date = new Date(pr.achievedAt).toLocaleDateString();

  return (
    <TouchableOpacity
      style={styles.prCard}
      onPress={() => router.push(`/exercise/${pr.exerciseId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.prLeft}>
        <View style={styles.trophyWrap}>
          <Ionicons name="trophy" size={18} color={Colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={Typography.h4}>{pr.exerciseName}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>{date}</Text>
        </View>
      </View>

      <View style={styles.prMetrics}>
        <View style={styles.metricPill}>
          <Text style={[Typography.metricSmall, { color: Colors.textPrimary, fontSize: 20 }]}>
            {pr.maxWeight > 0 ? `${pr.maxWeight}` : '—'}
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>
            {pr.maxWeight > 0 ? 'KG MAX' : ''}
          </Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={[Typography.metricSmall, { color: Colors.accent, fontSize: 20 }]}>
            {pr.estimatedOneRepMax > 0 ? `${pr.estimatedOneRepMax}` : `${pr.maxReps}`}
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>
            {pr.estimatedOneRepMax > 0 ? 'EST 1RM' : 'MAX REPS'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecordsScreen() {
  const personalRecords = useWorkoutStore(s => s.personalRecords);
  const recommendations = useWorkoutStore(s => s.recommendations);
  const prs = Object.values(personalRecords).sort((a, b) =>
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );
  const readyToProgress = Object.values(recommendations).filter(r => r.readyToProgress);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[Typography.label, { color: Colors.textMuted, marginBottom: 6 }]}>ACHIEVEMENTS</Text>
        <Text style={Typography.h1}>Personal Records</Text>
      </View>

      {/* Ready to increase banner */}
      {readyToProgress.length > 0 && (
        <View style={styles.progressBanner}>
          <View style={styles.progressBannerLeft}>
            <Ionicons name="trending-up" size={20} color={Colors.success} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[Typography.h4, { color: Colors.success }]}>
                {readyToProgress.length} exercise{readyToProgress.length > 1 ? 's' : ''} ready to progress!
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                Tap exercises below to see weight recommendations
              </Text>
            </View>
          </View>
        </View>
      )}

      {prs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={56} color={Colors.textMuted} />
          <Text style={[Typography.h3, { color: Colors.textMuted, marginTop: 16 }]}>No records yet</Text>
          <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
            Complete workouts to set personal records. They'll appear here automatically.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 12 }]}>
            {prs.length} RECORDS SET
          </Text>
          {prs.map(pr => (
            <PRCard key={pr.exerciseId} pr={pr} />
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  progressBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.successGlow, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.success + '40',
    marginHorizontal: 20, marginBottom: 16, padding: 16,
  },
  progressBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  list: { paddingHorizontal: 20 },
  prCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  prLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  trophyWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.warningGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  prMetrics: { flexDirection: 'row', gap: 12 },
  metricPill: { alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
});
