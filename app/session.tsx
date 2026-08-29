import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../design/colors';
import { Typography } from '../design/typography';
import { useWorkoutStore } from '../store/workoutStore';
import { useSensorStore } from '../store/sensorStore';
import { EXERCISE_LIBRARY, CATEGORIES, Exercise } from '../models/exercises';
import { SessionExercise, WorkoutSet } from '../models/types';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function RepRing({ current, target, velocity }: { current: number; target: number; velocity: number }) {
  const R = 52;
  const circ = 2 * Math.PI * R;
  const progress = Math.min(current / Math.max(target, 1), 1);
  const offset = circ * (1 - progress);
  const color = current >= target ? Colors.success : velocity < 0.25 ? Colors.warning : Colors.accent;
  return (
    <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={130} height={130} style={{ position: 'absolute' }}>
        <Circle cx={65} cy={65} r={R} stroke={Colors.surfaceHigh} strokeWidth={10} fill="none" />
        <Circle
          cx={65} cy={65} r={R} stroke={color} strokeWidth={10} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
        />
      </Svg>
      <Text style={{ fontSize: 42, fontWeight: '900', color: Colors.textPrimary }}>{current}</Text>
      <Text style={[Typography.caption, { color: Colors.textMuted }]}>/ {target} reps</Text>
    </View>
  );
}

function VelocityRow({ velocity, trend }: { velocity: number; trend: string }) {
  const color = velocity >= 0.5 ? Colors.velocityFast : velocity >= 0.3 ? Colors.velocityMedium : Colors.velocitySlow;
  const label = velocity >= 0.5 ? 'EXPLOSIVE' : velocity >= 0.3 ? 'CONTROLLED' : 'FATIGUED';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: 200 }}>
      <View style={{ flex: 1, height: 3, backgroundColor: Colors.surfaceHigh, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(velocity * 100, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: 10, color, fontWeight: '700', letterSpacing: 0.5, width: 72 }}>{label}</Text>
      {trend === 'declining' && <Ionicons name="trending-down" size={12} color={Colors.warning} />}
      {trend === 'increasing' && <Ionicons name="trending-up" size={12} color={Colors.success} />}
    </View>
  );
}

export default function SessionScreen() {
  const activeSession = useWorkoutStore(s => s.activeSession);
  const updateActiveSession = useWorkoutStore(s => s.updateActiveSession);
  const finishSession = useWorkoutStore(s => s.finishSession);
  const discardSession = useWorkoutStore(s => s.discardSession);
  const computeRecommendation = useWorkoutStore(s => s.computeRecommendation);
  const personalRecords = useWorkoutStore(s => s.personalRecords);
  const profile = useWorkoutStore(s => s.profile);

  const sensorMode = useSensorStore(s => s.mode);
  const repCount = useSensorStore(s => s.repCount);
  const resetReps = useSensorStore(s => s.resetReps);
  const addRep = useSensorStore(s => s.addRep);
  const currentVelocity = useSensorStore(s => s.currentVelocity);
  const velocityTrend = useSensorStore(s => s.velocityTrend);
  const isFatigued = useSensorStore(s => s.isFatigued);
  const restTimerActive = useSensorStore(s => s.restTimerActive);
  const restTimeRemaining = useSensorStore(s => s.restTimeRemaining);
  const restTimerTarget = useSensorStore(s => s.restTimerTarget);
  const startRestTimer = useSensorStore(s => s.startRestTimer);
  const stopRestTimer = useSensorStore(s => s.stopRestTimer);

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [localReps, setLocalReps] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [newPRName, setNewPRName] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(activeSession?.startTime ?? new Date().toISOString());

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startRef.current).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Sync sensor rep count → local
  useEffect(() => {
    if (sensorMode !== 'disconnected') setLocalReps(repCount);
  }, [repCount, sensorMode]);

  // Reset reps when switching exercise
  useEffect(() => {
    if (!activeSession) return;
    const ex = activeSession.exercises[currentExIdx];
    if (!ex) return;
    const last = ex.sets[ex.sets.length - 1];
    setCurrentWeight(last?.weight ?? ex.targetWeight);
    setLocalReps(0);
    resetReps();
  }, [currentExIdx, activeSession?.exercises.length]);

  if (!activeSession) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[Typography.h3, { color: Colors.textMuted }]}>No active session</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={{ color: Colors.accent, fontWeight: '700' }}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentEx = activeSession.exercises[currentExIdx] ?? null;
  const completedSets = currentEx?.sets.length ?? 0;
  const targetSets = currentEx?.targetSets ?? 3;
  const targetReps = currentEx?.targetReps ?? 8;
  const elapsedStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  function addExercise(ex: Exercise) {
    const entry: SessionExercise = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      category: ex.category,
      sets: [],
      targetSets: ex.defaultSets,
      targetReps: ex.defaultReps,
      targetWeight: ex.defaultWeight,
    };
    const session = activeSession!;
    const updated = { ...session, exercises: [...session.exercises, entry] };
    updateActiveSession(updated);
    setCurrentExIdx(updated.exercises.length - 1);
    setShowPicker(false);
    setPickerSearch('');
    Haptics.selectionAsync();
  }

  function completeSet() {
    if (!currentEx) return;
    if (localReps === 0) {
      Alert.alert('No reps logged', 'Add at least 1 rep before completing the set.');
      return;
    }
    const existing = personalRecords[currentEx.exerciseId];
    const e1rm = currentWeight * (1 + localReps / 30);
    const existingE1rm = existing ? existing.maxWeight * (1 + existing.maxReps / 30) : 0;
    const isPR = !existing || currentWeight > existing.maxWeight || e1rm > existingE1rm;

    const newSet: WorkoutSet = {
      id: makeId(),
      exerciseId: currentEx.exerciseId,
      exerciseName: currentEx.exerciseName,
      setNumber: completedSets + 1,
      targetReps,
      completedReps: localReps,
      weight: currentWeight,
      unit: profile.unit,
      velocity: currentVelocity,
      timestamp: new Date().toISOString(),
      isPR,
    };

    const sess = activeSession!;
    const updatedExercises = sess.exercises.map((ex, i) =>
      i === currentExIdx ? { ...ex, sets: [...ex.sets, newSet] } : ex
    );
    updateActiveSession({ ...sess, exercises: updatedExercises });

    if (isPR) {
      setNewPRName(currentEx.exerciseName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setNewPRName(null), 3000);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    resetReps();
    setLocalReps(0);
    startRestTimer(90);
    computeRecommendation(currentEx.exerciseId, currentEx.exerciseName, currentWeight);
  }

  function handleFinish() {
    const totalSets = activeSession!.exercises.reduce((s, ex) => s + ex.sets.length, 0);
    if (totalSets === 0) {
      Alert.alert('Empty Session', 'Log at least one set before finishing.', [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { discardSession(); router.back(); } },
      ]);
      return;
    }
    Alert.alert(
      'Finish Workout?',
      `${totalSets} sets in ${elapsedStr}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', onPress: () => { stopRestTimer(); finishSession(activeSession!); router.back(); } },
      ]
    );
  }

  function handleDiscard() {
    Alert.alert('Discard Workout', 'All progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { discardSession(); router.back(); } },
    ]);
  }

  const pickerItems = EXERCISE_LIBRARY.filter(e =>
    !pickerSearch ||
    e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    e.muscles.some(m => m.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={[styles.headerSideBtn, { backgroundColor: Colors.surfaceHigh }]}>
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[Typography.label, { color: Colors.textMuted }]}>{activeSession.title.toUpperCase()}</Text>
          <Text style={[Typography.h4, { color: Colors.accent }]}>{elapsedStr}</Text>
        </View>
        <TouchableOpacity onPress={handleFinish} style={[styles.headerSideBtn, styles.finishBtn]}>
          <Text style={styles.finishBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabsRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
      >
        {activeSession.exercises.map((ex, i) => (
          <TouchableOpacity
            key={`${ex.exerciseId}-${i}`}
            style={[styles.tab, currentExIdx === i && styles.tabActive]}
            onPress={() => setCurrentExIdx(i)}
          >
            <Text style={[styles.tabText, currentExIdx === i && { color: Colors.background }]} numberOfLines={1}>
              {ex.exerciseName.split(' ').slice(0, 2).join(' ')}
            </Text>
            {ex.sets.length > 0 && (
              <View style={[styles.tabBadge, currentExIdx === i && { backgroundColor: Colors.background + '40' }]}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: currentExIdx === i ? Colors.background : Colors.accent }}>
                  {ex.sets.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.tabAdd} onPress={() => setShowPicker(true)}>
          <Ionicons name="add" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Body */}
      {!currentEx ? (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={56} color={Colors.textMuted} />
          <Text style={[Typography.h3, { color: Colors.textMuted, marginTop: 16 }]}>Add your first exercise</Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="add" size={18} color={Colors.background} />
            <Text style={styles.addFirstBtnText}>ADD EXERCISE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Exercise header */}
          <View style={styles.exHeader}>
            <Text style={Typography.h2}>{currentEx.exerciseName}</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
              {targetSets} sets × {targetReps} reps @ {currentEx.targetWeight}kg
            </Text>
            {isFatigued && (
              <View style={styles.fatigueBanner}>
                <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                <Text style={[Typography.caption, { color: Colors.warning, marginLeft: 4 }]}>
                  FATIGUE DETECTED — Consider reducing weight
                </Text>
              </View>
            )}
          </View>

          {/* Sets table */}
          {currentEx.sets.length > 0 && (
            <View style={styles.setsTable}>
              <View style={[styles.setRow, styles.setRowHeader]}>
                {['SET', 'KG', 'REPS', 'VOL', ''].map(h => (
                  <Text key={h} style={styles.setCell}>{h}</Text>
                ))}
              </View>
              {currentEx.sets.map(s => {
                const velColor = (s.velocity ?? 0.4) >= 0.5 ? Colors.velocityFast
                  : (s.velocity ?? 0.4) >= 0.3 ? Colors.velocityMedium : Colors.velocitySlow;
                return (
                  <View key={s.id} style={styles.setRow}>
                    <Text style={[styles.setCell, { color: Colors.textMuted }]}>{s.setNumber}</Text>
                    <Text style={[styles.setCell, { color: Colors.textPrimary, fontWeight: '700' }]}>{s.weight}</Text>
                    <Text style={[styles.setCell, { color: s.completedReps >= s.targetReps ? Colors.success : Colors.warning, fontWeight: '700' }]}>
                      {s.completedReps}
                    </Text>
                    <Text style={[styles.setCell, { color: Colors.textSecondary }]}>
                      {Math.round(s.weight * s.completedReps)}
                    </Text>
                    <View style={[styles.setCell, { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }]}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: velColor }} />
                      {s.isPR && <Ionicons name="trophy" size={11} color={Colors.warning} />}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Rest timer */}
          {restTimerActive && (
            <View style={styles.restCard}>
              <Text style={[Typography.label, { color: Colors.textMuted }]}>REST</Text>
              <Text style={[Typography.metric, { color: Colors.accent, fontSize: 36, marginVertical: 4 }]}>
                {Math.floor(restTimeRemaining / 60)}:{String(restTimeRemaining % 60).padStart(2, '0')}
              </Text>
              <View style={styles.restBar}>
                <View style={[styles.restBarFill, {
                  width: `${((restTimerTarget - restTimeRemaining) / restTimerTarget) * 100}%` as any,
                }]} />
              </View>
              <TouchableOpacity onPress={stopRestTimer} style={{ marginTop: 10 }}>
                <Text style={[Typography.caption, { color: Colors.accent }]}>SKIP REST →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active set logger */}
          {completedSets < targetSets && !restTimerActive && (
            <View style={styles.setLogger}>
              <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 14 }]}>
                SET {completedSets + 1} OF {targetSets}
              </Text>

              <View style={{ alignItems: 'center', gap: 12 }}>
                <RepRing current={localReps} target={targetReps} velocity={currentVelocity} />

                {sensorMode !== 'disconnected' && (
                  <VelocityRow velocity={currentVelocity} trend={velocityTrend} />
                )}

                <View style={styles.repBtns}>
                  <TouchableOpacity style={styles.repAdjBtn} onPress={() => setLocalReps(r => Math.max(0, r - 1))}>
                    <Ionicons name="remove" size={22} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.repAdjBtn, { backgroundColor: Colors.accentGlow, borderColor: Colors.accent + '40' }]}
                    onPress={() => sensorMode !== 'disconnected' ? addRep(0.4) : setLocalReps(r => r + 1)}
                  >
                    <Ionicons name="add" size={22} color={Colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weight adjuster */}
              <View style={styles.weightRow}>
                <TouchableOpacity style={styles.weightAdj} onPress={() => setCurrentWeight(w => Math.max(0, parseFloat((w - 2.5).toFixed(1))))}>
                  <Text style={styles.weightAdjText}>−2.5</Text>
                </TouchableOpacity>
                <View style={styles.weightDisplay}>
                  <TextInput
                    style={styles.weightInputText}
                    value={String(currentWeight)}
                    onChangeText={v => { const n = parseFloat(v); if (!isNaN(n) && n >= 0) setCurrentWeight(n); }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <Text style={[Typography.caption, { color: Colors.textMuted }]}>KG</Text>
                </View>
                <TouchableOpacity style={styles.weightAdj} onPress={() => setCurrentWeight(w => parseFloat((w + 2.5).toFixed(1)))}>
                  <Text style={styles.weightAdjText}>+2.5</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.completeBtn} onPress={completeSet} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.background} />
                <Text style={styles.completeBtnText}>COMPLETE SET</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* All sets done for this exercise */}
          {completedSets >= targetSets && !restTimerActive && (
            <View style={styles.exDoneCard}>
              <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
              <Text style={[Typography.h4, { color: Colors.success, marginLeft: 10 }]}>All sets done!</Text>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* PR Toast */}
      {newPRName && (
        <View style={styles.prToast}>
          <Ionicons name="trophy" size={18} color={Colors.warning} />
          <Text style={[Typography.h4, { color: Colors.warning, marginLeft: 8 }]}>NEW PR — {newPRName}</Text>
        </View>
      )}

      {/* Exercise Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.picker}>
          <View style={styles.pickerHeader}>
            <Text style={Typography.h3}>Add Exercise</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setPickerSearch(''); }}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.pickerSearch}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Search exercises or muscles..."
              placeholderTextColor={Colors.textMuted}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={pickerItems}
            keyExtractor={e => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => {
              const catColor = CATEGORIES.find(c => c.id === item.category)?.color ?? Colors.accent;
              return (
                <TouchableOpacity style={styles.pickerItem} onPress={() => addExercise(item)} activeOpacity={0.7}>
                  <View style={[styles.pickerDot, { backgroundColor: catColor + '25', borderColor: catColor + '60' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={Typography.h4}>{item.name}</Text>
                    <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                      {item.muscles.slice(0, 2).join(' · ')} · {item.equipment}
                    </Text>
                  </View>
                  {item.isCompound && (
                    <View style={[styles.compoundTag, { backgroundColor: Colors.accentGlow }]}>
                      <Text style={[Typography.tag, { color: Colors.accent }]}>COMPOUND</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  goBackBtn: { marginTop: 20, padding: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerSideBtn: { padding: 8, borderRadius: 8 },
  finishBtn: { backgroundColor: Colors.accent, paddingHorizontal: 14 },
  finishBtnText: { fontSize: 12, fontWeight: '800', color: Colors.background, letterSpacing: 1.5 },

  tabsRow: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
    maxWidth: 140,
  },
  tabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  tabBadge: {
    backgroundColor: Colors.accent + '25', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tabAdd: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  addFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 20,
  },
  addFirstBtnText: { fontSize: 13, fontWeight: '800', color: Colors.background, letterSpacing: 1.5 },

  exHeader: { padding: 20, paddingBottom: 12 },
  fatigueBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.warningGlow, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warning + '30',
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 8,
  },

  setsTable: {
    marginHorizontal: 20, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface, overflow: 'hidden', marginBottom: 12,
  },
  setRowHeader: { backgroundColor: Colors.surfaceHigh },
  setRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  setCell: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  restCard: {
    alignItems: 'center', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent + '30', padding: 20,
  },
  restBar: {
    width: '100%', height: 4, backgroundColor: Colors.surfaceHigh, borderRadius: 2, overflow: 'hidden',
  },
  restBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },

  setLogger: {
    marginHorizontal: 20, backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 20, alignItems: 'center',
  },
  repBtns: { flexDirection: 'row', gap: 16 },
  repAdjBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  weightAdj: {
    backgroundColor: Colors.surfaceHigh, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  weightAdjText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  weightDisplay: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.surfaceHigh, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.borderBright, paddingVertical: 12,
  },
  weightInputText: {
    fontSize: 28, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', minWidth: 70,
  },

  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32, width: '100%',
  },
  completeBtnText: { fontSize: 14, fontWeight: '900', color: Colors.background, letterSpacing: 2 },

  exDoneCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, backgroundColor: Colors.successGlow,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.success + '40', padding: 16,
  },

  prToast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.warningGlow,
    borderWidth: 1, borderColor: Colors.warning,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12,
  },

  picker: { flex: 1, backgroundColor: Colors.background },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 24, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  pickerSearchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  pickerDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  compoundTag: {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
});
