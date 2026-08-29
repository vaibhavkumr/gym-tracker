export type ExerciseCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: string[];
  equipment: string;
  isCompound: boolean;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number; // kg suggestion for new user
  sensorAxis: 'vertical' | 'horizontal' | 'rotation'; // rep detection axis hint
  instructions: string;
}

export const EXERCISE_LIBRARY: Exercise[] = [
  // ── CHEST ──────────────────────────────────────────
  { id: 'bench_press', name: 'Barbell Bench Press', category: 'chest', muscles: ['Pectorals', 'Triceps', 'Front Delts'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 8, defaultWeight: 60, sensorAxis: 'vertical', instructions: 'Lie flat, lower bar to chest, press explosively.' },
  { id: 'incline_bench', name: 'Incline Bench Press', category: 'chest', muscles: ['Upper Pectorals', 'Triceps'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 10, defaultWeight: 50, sensorAxis: 'vertical', instructions: 'Set bench to 30-45°. Lower to upper chest, press up.' },
  { id: 'dumbbell_press', name: 'Dumbbell Bench Press', category: 'chest', muscles: ['Pectorals', 'Triceps'], equipment: 'Dumbbells', isCompound: true, defaultSets: 3, defaultReps: 10, defaultWeight: 22, sensorAxis: 'vertical', instructions: 'Full range of motion, controlled descent.' },
  { id: 'cable_fly', name: 'Cable Chest Fly', category: 'chest', muscles: ['Pectorals'], equipment: 'Cable Machine', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 15, sensorAxis: 'horizontal', instructions: 'Slight bend in elbows. Squeeze at the center.' },
  { id: 'chest_dips', name: 'Chest Dips', category: 'chest', muscles: ['Pectorals', 'Triceps'], equipment: 'Dip Station', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Lean forward slightly to emphasize chest.' },
  { id: 'push_up', name: 'Push-ups', category: 'chest', muscles: ['Pectorals', 'Triceps', 'Core'], equipment: 'Bodyweight', isCompound: true, defaultSets: 3, defaultReps: 20, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Keep core tight, full range of motion.' },

  // ── BACK ───────────────────────────────────────────
  { id: 'deadlift', name: 'Barbell Deadlift', category: 'back', muscles: ['Erectors', 'Lats', 'Traps', 'Hamstrings', 'Glutes'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 5, defaultWeight: 80, sensorAxis: 'vertical', instructions: 'Hip hinge, neutral spine, drive through floor.' },
  { id: 'barbell_row', name: 'Barbell Bent-Over Row', category: 'back', muscles: ['Lats', 'Rhomboids', 'Biceps'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 8, defaultWeight: 60, sensorAxis: 'vertical', instructions: 'Hinge at 45°. Pull to lower chest, lead with elbows.' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'back', muscles: ['Latissimus Dorsi', 'Biceps'], equipment: 'Cable Machine', isCompound: true, defaultSets: 4, defaultReps: 10, defaultWeight: 55, sensorAxis: 'vertical', instructions: 'Pull to upper chest, lean back slightly.' },
  { id: 'seated_row', name: 'Cable Seated Row', category: 'back', muscles: ['Rhomboids', 'Lats', 'Biceps'], equipment: 'Cable Machine', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 50, sensorAxis: 'horizontal', instructions: 'Pull elbows back, squeeze shoulder blades together.' },
  { id: 'pull_up', name: 'Pull-ups', category: 'back', muscles: ['Latissimus Dorsi', 'Biceps'], equipment: 'Pull-up Bar', isCompound: true, defaultSets: 3, defaultReps: 8, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Full hang, pull chin above bar, lower with control.' },
  { id: 'dumbbell_row', name: 'Single-Arm Dumbbell Row', category: 'back', muscles: ['Lats', 'Rhomboids'], equipment: 'Dumbbells', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 24, sensorAxis: 'vertical', instructions: 'Brace on bench. Pull elbow back and up.' },
  { id: 'face_pull', name: 'Face Pull', category: 'back', muscles: ['Rear Delts', 'Rotator Cuff', 'Traps'], equipment: 'Cable Machine', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 20, sensorAxis: 'horizontal', instructions: 'Pull to face, elbows high, rotate hands at end.' },

  // ── LEGS ───────────────────────────────────────────
  { id: 'squat', name: 'Barbell Back Squat', category: 'legs', muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 6, defaultWeight: 70, sensorAxis: 'vertical', instructions: 'Bar on traps. Break at hip and knee simultaneously.' },
  { id: 'front_squat', name: 'Front Squat', category: 'legs', muscles: ['Quads', 'Core'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 6, defaultWeight: 55, sensorAxis: 'vertical', instructions: 'High elbow position. Deep squat with upright torso.' },
  { id: 'leg_press', name: 'Leg Press', category: 'legs', muscles: ['Quads', 'Glutes', 'Hamstrings'], equipment: 'Leg Press Machine', isCompound: true, defaultSets: 4, defaultReps: 12, defaultWeight: 100, sensorAxis: 'horizontal', instructions: 'Feet shoulder-width. Lower until 90 degrees but do not let lower back lift.' },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', category: 'legs', muscles: ['Hamstrings', 'Glutes', 'Erectors'], equipment: 'Barbell', isCompound: true, defaultSets: 3, defaultReps: 10, defaultWeight: 60, sensorAxis: 'vertical', instructions: 'Slight knee bend. Hinge at hip, keep bar close to body.' },
  { id: 'lunges', name: 'Barbell Lunges', category: 'legs', muscles: ['Quads', 'Glutes', 'Hamstrings'], equipment: 'Barbell', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 40, sensorAxis: 'vertical', instructions: 'Long step, both knees at 90° at bottom.' },
  { id: 'leg_extension', name: 'Leg Extension', category: 'legs', muscles: ['Quadriceps'], equipment: 'Machine', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 40, sensorAxis: 'rotation', instructions: 'Full extension, hold briefly, controlled descent.' },
  { id: 'leg_curl', name: 'Lying Leg Curl', category: 'legs', muscles: ['Hamstrings'], equipment: 'Machine', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 35, sensorAxis: 'rotation', instructions: 'Curl heel to glutes, squeeze hamstring at top.' },
  { id: 'calf_raise', name: 'Standing Calf Raise', category: 'legs', muscles: ['Gastrocnemius', 'Soleus'], equipment: 'Machine', isCompound: false, defaultSets: 4, defaultReps: 20, defaultWeight: 60, sensorAxis: 'vertical', instructions: 'Full range. Pause at top, slow negative.' },
  { id: 'bulgarian_split', name: 'Bulgarian Split Squat', category: 'legs', muscles: ['Quads', 'Glutes'], equipment: 'Dumbbells', isCompound: true, defaultSets: 3, defaultReps: 10, defaultWeight: 16, sensorAxis: 'vertical', instructions: 'Rear foot elevated. Lower back knee toward ground.' },
  { id: 'hip_thrust', name: 'Barbell Hip Thrust', category: 'legs', muscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', isCompound: false, defaultSets: 4, defaultReps: 12, defaultWeight: 80, sensorAxis: 'vertical', instructions: 'Shoulder blades on bench. Full hip extension at top.' },

  // ── SHOULDERS ──────────────────────────────────────
  { id: 'ohp', name: 'Overhead Press (OHP)', category: 'shoulders', muscles: ['Front Delts', 'Side Delts', 'Triceps'], equipment: 'Barbell', isCompound: true, defaultSets: 4, defaultReps: 8, defaultWeight: 40, sensorAxis: 'vertical', instructions: 'Press straight up. Bar travels just past nose.' },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', category: 'shoulders', muscles: ['Front Delts', 'Side Delts', 'Triceps'], equipment: 'Dumbbells', isCompound: true, defaultSets: 3, defaultReps: 10, defaultWeight: 16, sensorAxis: 'vertical', instructions: 'Start at ear level, press overhead.' },
  { id: 'lateral_raise', name: 'Lateral Raise', category: 'shoulders', muscles: ['Lateral Deltoids'], equipment: 'Dumbbells', isCompound: false, defaultSets: 4, defaultReps: 15, defaultWeight: 8, sensorAxis: 'vertical', instructions: 'Slight bend in elbow. Raise to shoulder height only.' },
  { id: 'front_raise', name: 'Front Raise', category: 'shoulders', muscles: ['Front Deltoids'], equipment: 'Dumbbells', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 8, sensorAxis: 'vertical', instructions: 'Alternate arms or together. Raise to eye level.' },
  { id: 'arnold_press', name: 'Arnold Press', category: 'shoulders', muscles: ['All Deltoid Heads'], equipment: 'Dumbbells', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 14, sensorAxis: 'vertical', instructions: 'Start palms facing you. Rotate and press overhead.' },
  { id: 'upright_row', name: 'Upright Row', category: 'shoulders', muscles: ['Side Delts', 'Traps'], equipment: 'Barbell', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 30, sensorAxis: 'vertical', instructions: 'Elbows flare out and up. Bar to chin height.' },

  // ── ARMS ───────────────────────────────────────────
  { id: 'barbell_curl', name: 'Barbell Curl', category: 'arms', muscles: ['Biceps', 'Brachialis'], equipment: 'Barbell', isCompound: false, defaultSets: 4, defaultReps: 10, defaultWeight: 30, sensorAxis: 'rotation', instructions: 'Elbows stay at sides. Full range of motion.' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', category: 'arms', muscles: ['Biceps'], equipment: 'Dumbbells', isCompound: false, defaultSets: 3, defaultReps: 12, defaultWeight: 12, sensorAxis: 'rotation', instructions: 'Supinate wrist at top. Slow negative.' },
  { id: 'hammer_curl', name: 'Hammer Curl', category: 'arms', muscles: ['Brachialis', 'Biceps'], equipment: 'Dumbbells', isCompound: false, defaultSets: 3, defaultReps: 12, defaultWeight: 14, sensorAxis: 'rotation', instructions: 'Neutral grip. Targets brachialis and outer bicep.' },
  { id: 'cable_curl', name: 'Cable Curl', category: 'arms', muscles: ['Biceps'], equipment: 'Cable Machine', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 25, sensorAxis: 'rotation', instructions: 'Continuous tension. Keep elbows at sides.' },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', category: 'arms', muscles: ['Triceps'], equipment: 'Cable Machine', isCompound: false, defaultSets: 4, defaultReps: 15, defaultWeight: 30, sensorAxis: 'vertical', instructions: 'Elbows at sides. Full extension, squeeze tricep.' },
  { id: 'skull_crusher', name: 'Skull Crushers (EZ Bar)', category: 'arms', muscles: ['Triceps'], equipment: 'EZ Bar', isCompound: false, defaultSets: 3, defaultReps: 12, defaultWeight: 25, sensorAxis: 'rotation', instructions: 'Lower bar to forehead. Keep upper arms vertical.' },
  { id: 'close_grip_bench', name: 'Close Grip Bench Press', category: 'arms', muscles: ['Triceps', 'Chest'], equipment: 'Barbell', isCompound: true, defaultSets: 3, defaultReps: 10, defaultWeight: 50, sensorAxis: 'vertical', instructions: 'Grip shoulder-width. Keep elbows close to body.' },
  { id: 'overhead_tricep', name: 'Overhead Tricep Extension', category: 'arms', muscles: ['Triceps (Long Head)'], equipment: 'Dumbbells', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 20, sensorAxis: 'vertical', instructions: 'Elbows point up. Lower behind head, extend fully.' },
  { id: 'preacher_curl', name: 'Preacher Curl', category: 'arms', muscles: ['Biceps'], equipment: 'Machine/EZ Bar', isCompound: false, defaultSets: 3, defaultReps: 12, defaultWeight: 20, sensorAxis: 'rotation', instructions: 'Arm on pad isolates bicep. Full range of motion.' },

  // ── CORE ───────────────────────────────────────────
  { id: 'crunch', name: 'Crunch', category: 'core', muscles: ['Rectus Abdominis'], equipment: 'Bodyweight', isCompound: false, defaultSets: 3, defaultReps: 20, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Short range. Don\'t pull neck.' },
  { id: 'plank', name: 'Plank', category: 'core', muscles: ['Core', 'Shoulders'], equipment: 'Bodyweight', isCompound: false, defaultSets: 3, defaultReps: 60, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Hold position. Neutral spine, brace abs.' },
  { id: 'cable_crunch', name: 'Cable Crunch', category: 'core', muscles: ['Rectus Abdominis'], equipment: 'Cable Machine', isCompound: false, defaultSets: 3, defaultReps: 20, defaultWeight: 30, sensorAxis: 'vertical', instructions: 'Kneel, hands at ears. Crunch down with abs.' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', category: 'core', muscles: ['Lower Abs', 'Hip Flexors'], equipment: 'Pull-up Bar', isCompound: false, defaultSets: 3, defaultReps: 15, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Hang from bar. Raise legs to 90° with control.' },
  { id: 'russian_twist', name: 'Russian Twist', category: 'core', muscles: ['Obliques'], equipment: 'Bodyweight/Plate', isCompound: false, defaultSets: 3, defaultReps: 30, defaultWeight: 10, sensorAxis: 'rotation', instructions: 'Lean back 45°. Rotate side to side.' },
  { id: 'ab_wheel', name: 'Ab Wheel Rollout', category: 'core', muscles: ['Core', 'Lats'], equipment: 'Ab Wheel', isCompound: true, defaultSets: 3, defaultReps: 12, defaultWeight: 0, sensorAxis: 'horizontal', instructions: 'From knees. Roll out fully, pull back with core.' },

  // ── CARDIO ─────────────────────────────────────────
  { id: 'treadmill_run', name: 'Treadmill Run', category: 'cardio', muscles: ['Full Body'], equipment: 'Treadmill', isCompound: true, defaultSets: 1, defaultReps: 20, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Moderate pace. Track time, not reps.' },
  { id: 'rowing_machine', name: 'Rowing Machine', category: 'cardio', muscles: ['Back', 'Legs', 'Arms'], equipment: 'Rower', isCompound: true, defaultSets: 1, defaultReps: 15, defaultWeight: 0, sensorAxis: 'horizontal', instructions: 'Legs, hips, arms on drive. Reverse on recovery.' },
  { id: 'jump_rope', name: 'Jump Rope', category: 'cardio', muscles: ['Calves', 'Cardio'], equipment: 'Jump Rope', isCompound: true, defaultSets: 3, defaultReps: 60, defaultWeight: 0, sensorAxis: 'vertical', instructions: 'Light on feet. Wrists do the work.' },
  { id: 'cycling', name: 'Stationary Bike', category: 'cardio', muscles: ['Quads', 'Cardio'], equipment: 'Bike', isCompound: true, defaultSets: 1, defaultReps: 20, defaultWeight: 0, sensorAxis: 'rotation', instructions: 'Track minutes or calories.' },
];

export const CATEGORIES: { id: ExerciseCategory; label: string; color: string; icon: string }[] = [
  { id: 'chest', label: 'Chest', color: '#EF4444', icon: '💪' },
  { id: 'back', label: 'Back', color: '#0891B2', icon: '🔙' },
  { id: 'legs', label: 'Legs', color: '#2563EB', icon: '🦵' },
  { id: 'shoulders', label: 'Shoulders', color: '#059669', icon: '🏋️' },
  { id: 'arms', label: 'Arms', color: '#D97706', icon: '💪' },
  { id: 'core', label: 'Core', color: '#7C3AED', icon: '🎯' },
  { id: 'cardio', label: 'Cardio', color: '#EA580C', icon: '❤️' },
  { id: 'full_body', label: 'Full Body', color: '#4353FF', icon: '⚡' },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find(e => e.id === id);
}

export function getExercisesByCategory(cat: ExerciseCategory): Exercise[] {
  return EXERCISE_LIBRARY.filter(e => e.category === cat);
}

// Epley formula: 1RM = weight × (1 + reps/30)
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
