export type WeightUnit = 'kg' | 'lbs';

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  targetReps: number;
  completedReps: number;
  weight: number;
  unit: WeightUnit;
  restTime?: number; // seconds
  velocity?: number; // m/s estimated
  repTimes?: number[]; // ms per rep - from sensor
  timestamp: string;
  isPR?: boolean;
  notes?: string;
  isWarmup?: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  category: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  exercises: SessionExercise[];
  totalVolume: number; // kg x reps summed
  totalReps: number;
  totalSets: number;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  bestVolume: number; // weight × reps (best single set)
  estimatedOneRepMax: number;
  achievedAt: string;
  sessionId: string;
}

export type WeightAction = 'increase' | 'maintain' | 'decrease';
export type Confidence = 'high' | 'medium' | 'low';

export interface WeightRecommendation {
  exerciseId: string;
  currentWeight: number;
  recommendedWeight: number;
  action: WeightAction;
  confidence: Confidence;
  reason: string;
  readyToProgress: boolean;
}

export interface SensorDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
}

export interface UserProfile {
  name: string;
  bodyWeightKg?: number;
  unit: WeightUnit;
  watchConnected: boolean;
  sensorPaired: boolean;
  sensorDeviceId?: string;
}
