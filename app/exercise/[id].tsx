import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../design/colors';
import { Typography } from '../../design/typography';
import { useWorkoutStore } from '../../store/workoutStore';
import { EXERCISE_LIBRARY, CATEGORIES } from '../../models/exercises';

function WeightChart({ weights, dates }: { weights: number[]; dates: string[] }) {
  if (weights.length < 2) return null;
  const W = 320, H = 100, PAD = 20;
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const pts = weights.map((w, i) => {
    const x = PAD + (i / (weights.length - 1)) * (W - PAD * 2);
    const y = PAD + ((max - w) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1].split(',');

  return (
    <View style={styles.chart}>
      <Text style={[Typography.label, { color: Colors.textMuted, marginBottom: 8 }]}>WEIGHT PROGRESSION</Text>
      <Svg width={W} height={H}>
        <Line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={Colors.border} strokeWidth={1} />
        <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={Colors.border} strokeWidth={1} />
        <Polyline
          points={pts.join(' ')}
          fill="none"
          stroke={Colors.accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {weights.map((w, i) => {
          const [x, y] = pts[i].split(',');
          return (
            <Circle key={i} cx={parseFloat(x)} cy={parseFloat(y)} r={3}
              fill={i === weights.length - 1 ? Colors.accent : Colors.surface}
              stroke={Colors.accent} strokeWidth={1.5} />
          );
        })}
        <SvgText x={parseFloat(last[0]) + 4} y={parseFloat(last[1])}
          fill={Colors.accent} fontSize={10} fontWeight="700">
          {weights[weights.length - 1]}kg
        </SvgText>
      </Svg>
    </View>
  );
}

function RecBadge({ action, confidence }: { action: string; confidence: string }) {
  const color = action === 'increase' ? Colors.success : action === 'decrease' ? Colors.danger : Colors.warning;
  const icon = action === 'increase' ? 'trending-up' : action === 'decrease' ? 'trending-down' : 'remove';
  const label = action === 'increase' ? 'INCREASE WEIGHT' : action === 'decrease' ? 'REDUCE WEIGHT' : 'MAINTAIN';
  return (
    <View style={[styles.recBadge, { backgroundColor: color + '15', borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.recBadgeText, { color }]}>{label}</Text>
      <View style={[styles.confPill, { backgroundColor: color + '25' }]}>
        <Text style={[Typography.tag, { color }]}>{confidence.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personalRecords = useWorkoutStore(s => s.personalRecords);
  const recommendations = useWorkoutStore(s => s.recommendations);
  const computeRecommendation = useWorkoutStore(s => s.computeRecommendation);
  const getExerciseHistory = useWorkoutStore(s => s.getExerciseHistory);
  const startSession = useWorkoutStore(s => s.startSession);
  const updateActiveSession = useWorkoutStore(s => s.updateActiveSession);
  const activeSession = useWorkoutStore(s => s.activeSession);

  const exercise = EXERCISE_LIBRARY.find(e => e.id === id);
  const pr = personalRecords[id ?? ''];
  const rec = recommendations[id ?? ''];
  const history = useMemo(() => getExerciseHistory(id ?? ''), [id]);
  const catColor = CATEGORIES.find(c => c.id === exercise?.category)?.color ?? Colors.accent;

  const weightHistory = useMemo(() => {
    const bySession: { weight: number; date: string }[] = [];
    const seen = new Set<string>();
    for (const s of history) {
      const day = s.timestamp.slice(0, 10);
      if (!seen.has(day)) {
        seen.add(day);
        bySession.push({ weight: s.weight, date: day });
      }
    }
    return bySession.slice(-12);
  }, [history]);

  const recentSets = history.slice(-15).reverse();

  if (!exercise) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[Typography.h3, { color: Colors.textMuted }]}>Exercise not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.accent }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleGetRec() {
    if (!exercise) return;
    const ex = exercise;
    const weight = pr?.maxWeight ?? ex.defaultWeight;
    const result = computeRecommendation(ex.id, ex.name, weight);
    Haptics.selectionAsync();
    if (result.action === 'increase') {
      Alert.alert(
        'Ready to Progress!',
        `Increase to ${result.recommendedWeight}kg next session.\n\n${result.reason}`,
      );
    } else if (result.action === 'decrease') {
      Alert.alert('Deload Recommended', result.reason);
    } else {
      Alert.alert('Stay the Course', result.reason);
    }
  }

  function handleStartWithExercise() {
    if (!exercise) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ex = exercise;
    if (!activeSession) {
      startSession('Workout');
    }
    const session = useWorkoutStore.getState().activeSession;
    if (session) {
      const already = session.exercises.find(e => e.exerciseId === ex.id);
      if (!already) {
        updateActiveSession({
          ...session,
          exercises: [...session.exercises, {
            exerciseId: ex.id,
            exerciseName: ex.name,
            category: ex.category,
            sets: [],
            targetSets: ex.defaultSets,
            targetReps: ex.defaultReps,
            targetWeight: pr?.maxWeight ?? ex.defaultWeight,
          }],
        });
      }
    }
    router.push('/session');
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.catTag, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
          <Text style={[Typography.tag, { color: catColor }]}>
            {exercise.category.toUpperCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={Typography.h1}>{exercise.name}</Text>
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 4 }]}>
            {exercise.muscles.join(' · ')}
          </Text>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: Colors.surfaceHigh }]}>
              <Ionicons name="barbell-outline" size={11} color={Colors.textMuted} />
              <Text style={[Typography.tag, { color: Colors.textMuted }]}>{exercise.equipment}</Text>
            </View>
            {exercise.isCompound && (
              <View style={[styles.tag, { backgroundColor: Colors.accentGlow }]}>
                <Text style={[Typography.tag, { color: Colors.accent }]}>COMPOUND</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: Colors.surfaceHigh }]}>
              <Text style={[Typography.tag, { color: Colors.textMuted }]}>
                {exercise.defaultSets}×{exercise.defaultReps}
              </Text>
            </View>
          </View>
        </View>

        {/* PR Card */}
        {pr ? (
          <View style={styles.prCard}>
            <View style={styles.prCardHeader}>
              <View style={styles.trophyWrap}>
                <Ionicons name="trophy" size={18} color={Colors.warning} />
              </View>
              <Text style={[Typography.h3, { marginLeft: 10 }]}>Personal Record</Text>
            </View>
            <View style={styles.prStats}>
              <View style={styles.prStat}>
                <Text style={[Typography.metric, { color: Colors.accent, fontSize: 32 }]}>{pr.maxWeight}</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>KG MAX</Text>
              </View>
              <View style={styles.prDivider} />
              <View style={styles.prStat}>
                <Text style={[Typography.metric, { color: Colors.purple, fontSize: 32 }]}>{pr.maxReps}</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>MAX REPS</Text>
              </View>
              <View style={styles.prDivider} />
              <View style={styles.prStat}>
                <Text style={[Typography.metric, { color: Colors.success, fontSize: 32 }]}>{pr.estimatedOneRepMax}</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>EST 1RM</Text>
              </View>
            </View>
            <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center', marginTop: 4 }]}>
              Set {new Date(pr.achievedAt).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <View style={styles.noPrCard}>
            <Ionicons name="trophy-outline" size={28} color={Colors.textMuted} />
            <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 8 }]}>No record yet</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: 4 }]}>
              Complete a set to set your first PR
            </Text>
          </View>
        )}

        {/* Weight Recommendation */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 12 }]}>WEIGHT RECOMMENDATION</Text>
          {rec ? (
            <View style={styles.recCard}>
              <RecBadge action={rec.action} confidence={rec.confidence} />
              <View style={styles.recWeights}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>CURRENT</Text>
                  <Text style={[Typography.h2, { color: Colors.textPrimary }]}>{rec.currentWeight}kg</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={rec.action === 'increase' ? Colors.success : rec.action === 'decrease' ? Colors.danger : Colors.textMuted} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>NEXT</Text>
                  <Text style={[Typography.h2, { color: rec.action === 'increase' ? Colors.success : rec.action === 'decrease' ? Colors.danger : Colors.textPrimary }]}>
                    {rec.recommendedWeight}kg
                  </Text>
                </View>
              </View>
              <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center' }]}>{rec.reason}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.calcRecBtn} onPress={handleGetRec}>
              <Ionicons name="analytics-outline" size={18} color={Colors.accent} />
              <Text style={[Typography.h4, { color: Colors.accent, marginLeft: 8 }]}>Analyze & Get Recommendation</Text>
            </TouchableOpacity>
          )}
          {rec && (
            <TouchableOpacity style={styles.refreshRecBtn} onPress={handleGetRec}>
              <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
              <Text style={[Typography.caption, { color: Colors.textMuted, marginLeft: 4 }]}>RECALCULATE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Chart */}
        {weightHistory.length >= 2 && (
          <View style={styles.section}>
            <WeightChart
              weights={weightHistory.map(w => w.weight)}
              dates={weightHistory.map(w => w.date)}
            />
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 10 }]}>HOW TO PERFORM</Text>
          <View style={styles.instructCard}>
            <Text style={[Typography.body, { color: Colors.textSecondary, lineHeight: 22 }]}>
              {exercise.instructions}
            </Text>
          </View>
        </View>

        {/* Recent Sets */}
        {recentSets.length > 0 && (
          <View style={styles.section}>
            <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 12 }]}>RECENT SETS</Text>
            <View style={styles.setsTable}>
              <View style={[styles.setRow, { backgroundColor: Colors.surfaceHigh }]}>
                {['DATE', 'KG', 'REPS', 'VOL', 'VEL'].map(h => (
                  <Text key={h} style={[styles.setCell, { color: Colors.textMuted }]}>{h}</Text>
                ))}
              </View>
              {recentSets.map(s => {
                const velColor = (s.velocity ?? 0.4) >= 0.5 ? Colors.velocityFast
                  : (s.velocity ?? 0.4) >= 0.3 ? Colors.velocityMedium : Colors.velocitySlow;
                return (
                  <View key={s.id} style={styles.setRow}>
                    <Text style={[styles.setCell, { color: Colors.textMuted }]}>
                      {new Date(s.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.setCell, { color: Colors.textPrimary, fontWeight: '700' }]}>{s.weight}</Text>
                    <Text style={[styles.setCell, {
                      color: s.completedReps >= s.targetReps ? Colors.success : Colors.warning, fontWeight: '700',
                    }]}>{s.completedReps}</Text>
                    <Text style={[styles.setCell, { color: Colors.textSecondary }]}>
                      {Math.round(s.weight * s.completedReps)}
                    </Text>
                    <View style={[styles.setCell, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: velColor }} />
                      {s.isPR && <Ionicons name="trophy" size={10} color={Colors.warning} />}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      <View style={styles.startRow}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStartWithExercise} activeOpacity={0.85}>
          <Ionicons name="play" size={18} color={Colors.background} />
          <Text style={styles.startBtnText}>START WITH THIS EXERCISE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4,
  },
  backBtn: { padding: 8 },
  catTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },

  titleSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },

  prCard: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.warningGlow,
    padding: 16,
  },
  prCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  trophyWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.warningGlow, alignItems: 'center', justifyContent: 'center',
  },
  prStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  prStat: { alignItems: 'center', gap: 2 },
  prDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  noPrCard: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 24, alignItems: 'center',
  },

  section: { paddingHorizontal: 20, marginTop: 20 },

  recCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 14,
  },
  recBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  recBadgeText: { flex: 1, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  confPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  recWeights: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  calcRecBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accentGlow, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent + '30',
    padding: 16,
  },
  refreshRecBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 8,
  },

  chart: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },

  instructCard: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },

  setsTable: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  setCell: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  startRow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
  },
  startBtnText: { fontSize: 14, fontWeight: '900', color: Colors.background, letterSpacing: 2 },
});
