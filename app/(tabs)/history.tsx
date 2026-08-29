import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../design/colors';
import { Typography } from '../../design/typography';
import { useWorkoutStore } from '../../store/workoutStore';
import { WorkoutSession } from '../../models/types';

function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const vol = session.totalVolume;
  const volStr = vol >= 1000 ? `${(vol / 1000).toFixed(1)}k kg` : `${vol} kg`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={Typography.h3}>{session.title}</Text>
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>{session.date}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardStats}>
        <StatChip icon="layers" label="Sets" value={String(session.totalSets)} />
        <StatChip icon="repeat" label="Reps" value={String(session.totalReps)} />
        <StatChip icon="barbell" label="Volume" value={volStr} />
        {session.durationMinutes && <StatChip icon="time" label="Time" value={`${session.durationMinutes}m`} />}
        {session.caloriesBurned && <StatChip icon="flame" label="Cal" value={String(session.caloriesBurned)} />}
      </View>

      {session.exercises.length > 0 && (
        <View style={styles.exerciseList}>
          {session.exercises.slice(0, 4).map(ex => (
            <Text key={ex.exerciseId} style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
              • {ex.exerciseName} — {ex.sets.length} sets
            </Text>
          ))}
          {session.exercises.length > 4 && (
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>
              +{session.exercises.length - 4} more exercises
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon as any} size={12} color={Colors.textMuted} />
      <Text style={[Typography.caption, { color: Colors.textSecondary, marginLeft: 3 }]}>{value}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const sessions = useWorkoutStore(s => s.sessions);
  const deleteSession = useWorkoutStore(s => s.deleteSession);

  const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalSessions = sessions.length;

  function confirmDelete(id: string) {
    Alert.alert('Delete Session', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSession(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[Typography.label, { color: Colors.textMuted, marginBottom: 6 }]}>WORKOUT LOG</Text>
        <Text style={Typography.h1}>History</Text>
      </View>

      {sessions.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[Typography.metricSmall, { color: Colors.accent }]}>{totalSessions}</Text>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>SESSIONS</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[Typography.metricSmall, { color: Colors.purple }]}>
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(0)}k` : totalVolume}
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>KG LIFTED</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[Typography.metricSmall, { color: Colors.success }]}>
              {sessions.reduce((sum, s) => sum + s.totalSets, 0)}
            </Text>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>TOTAL SETS</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 50 }}>
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
            <Text style={[Typography.h3, { color: Colors.textMuted, marginTop: 16 }]}>No sessions yet</Text>
            <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
              Complete your first workout to see it here.
            </Text>
          </View>
        ) : (
          sessions.map(s => (
            <SessionCard key={s.id} session={s} onDelete={() => confirmDelete(s.id)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8,
  },
  summaryCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  deleteBtn: { padding: 4 },
  cardStats: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  statChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceHigh, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  exerciseList: { gap: 3, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});
