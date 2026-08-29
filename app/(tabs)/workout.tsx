import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../design/colors';
import { Typography } from '../../design/typography';
import { EXERCISE_LIBRARY, CATEGORIES, Exercise, ExerciseCategory } from '../../models/exercises';
import { useWorkoutStore } from '../../store/workoutStore';

function ExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const prs = useWorkoutStore(s => s.personalRecords);
  const pr = prs[exercise.id];
  const catColor = CATEGORIES.find(c => c.id === exercise.category)?.color ?? Colors.accent;

  return (
    <TouchableOpacity style={styles.exerciseCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.exerciseCardLeft}>
        <View style={[styles.catDot, { backgroundColor: catColor + '30', borderColor: catColor + '60' }]}>
          <View style={[styles.catDotInner, { backgroundColor: catColor }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={Typography.h4}>{exercise.name}</Text>
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
            {exercise.muscles.slice(0, 2).join(' · ')}
          </Text>
          <View style={styles.exerciseTags}>
            <View style={[styles.tag, { backgroundColor: catColor + '20' }]}>
              <Text style={[Typography.tag, { color: catColor }]}>{exercise.category.toUpperCase().replace('_', ' ')}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={[Typography.tag, { color: Colors.textMuted }]}>{exercise.equipment}</Text>
            </View>
            {exercise.isCompound && (
              <View style={[styles.tag, { backgroundColor: Colors.accentGlow }]}>
                <Text style={[Typography.tag, { color: Colors.accent }]}>COMPOUND</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {pr && (
        <View style={styles.prChip}>
          <Ionicons name="trophy" size={10} color={Colors.warning} />
          <Text style={[Typography.caption, { color: Colors.warning, marginLeft: 3 }]}>
            {pr.maxWeight > 0 ? `${pr.maxWeight}kg` : `${pr.maxReps}r`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function WorkoutScreen() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<ExerciseCategory | 'all'>('all');
  const startSession = useWorkoutStore(s => s.startSession);

  const filtered = EXERCISE_LIBRARY.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.muscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCat === 'all' || e.category === selectedCat;
    return matchSearch && matchCat;
  });

  function openExercise(exercise: Exercise) {
    Haptics.selectionAsync();
    router.push(`/exercise/${exercise.id}`);
  }

  function quickStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession('Workout');
    router.push('/session');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[Typography.label, { color: Colors.textMuted, marginBottom: 6 }]}>EXERCISE LIBRARY</Text>
        <View style={styles.headerRow}>
          <Text style={Typography.h1}>Exercises</Text>
          <TouchableOpacity style={styles.startBtn} onPress={quickStart}>
            <Ionicons name="play" size={14} color={Colors.background} />
            <Text style={styles.startBtnText}>START</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises or muscles..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        <TouchableOpacity
          style={[styles.catChip, selectedCat === 'all' && styles.catChipActive]}
          onPress={() => setSelectedCat('all')}
        >
          <Text style={[styles.catChipText, selectedCat === 'all' && { color: Colors.background }]}>ALL</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCat === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => setSelectedCat(cat.id)}
          >
            <Text style={[styles.catChipText, selectedCat === cat.id && { color: Colors.background }]}>
              {cat.icon} {cat.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 50 }}>
        <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 12 }]}>
          {filtered.length} EXERCISES
        </Text>
        {filtered.map(ex => (
          <ExerciseCard key={ex.id} exercise={ex} onPress={() => openExercise(ex)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  startBtnText: { fontSize: 12, fontWeight: '800', color: Colors.background, letterSpacing: 1.5 },
  searchRow: { paddingHorizontal: 20, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  catRow: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catChipText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8,
  },
  exerciseCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  catDotInner: { width: 4, height: 4, borderRadius: 2 },
  exerciseTags: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.surfaceHigh, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  prChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.warningGlow, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
});
