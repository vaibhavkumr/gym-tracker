import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WorkoutSession, WorkoutSet, PersonalRecord, UserProfile,
  WeightRecommendation, WeightAction, Confidence,
} from '../models/types';
import { estimateOneRepMax } from '../models/exercises';

const SESSION_KEY = '@gymtrack_sessions';
const PR_KEY = '@gymtrack_prs';
const PROFILE_KEY = '@gymtrack_profile';
const RECS_KEY = '@gymtrack_recs';

interface WorkoutState {
  sessions: WorkoutSession[];
  personalRecords: Record<string, PersonalRecord>;
  recommendations: Record<string, WeightRecommendation>;
  profile: UserProfile;
  activeSession: WorkoutSession | null;
  isLoading: boolean;

  load: () => Promise<void>;
  saveSession: (session: WorkoutSession) => void;
  startSession: (title: string) => void;
  updateActiveSession: (session: WorkoutSession) => void;
  finishSession: (session: WorkoutSession) => void;
  discardSession: () => void;
  updatePRs: (sets: WorkoutSet[]) => void;
  computeRecommendation: (exerciseId: string, exerciseName: string, currentWeight: number) => WeightRecommendation;
  updateProfile: (profile: Partial<UserProfile>) => void;
  getExerciseHistory: (exerciseId: string) => WorkoutSet[];
  deleteSession: (id: string) => void;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function computeWeightRec(
  sets: WorkoutSet[],
  currentWeight: number,
  exerciseId: string,
  exerciseName: string,
): WeightRecommendation {
  if (sets.length < 3) {
    return { exerciseId, currentWeight, recommendedWeight: currentWeight, action: 'maintain', confidence: 'low', reason: 'Not enough data yet. Keep logging workouts.', readyToProgress: false };
  }

  const recent = sets.slice(-9); // ~3 sessions × 3 sets
  const completed = recent.filter(s => s.completedReps >= s.targetReps);
  const successRate = completed.length / recent.length;
  const avgVelocity = recent.reduce((sum, s) => sum + (s.velocity ?? 0.35), 0) / recent.length;
  const lastSetVelocity = recent[recent.length - 1]?.velocity ?? 0.35;

  let action: WeightAction = 'maintain';
  let confidence: Confidence = 'medium';
  let reason = '';
  let delta = 0;
  let readyToProgress = false;

  if (successRate >= 0.85 && avgVelocity >= 0.3) {
    action = 'increase';
    confidence = successRate >= 0.95 ? 'high' : 'medium';
    delta = currentWeight >= 50 ? 2.5 : 2.5;
    reason = `Hitting ${Math.round(successRate * 100)}% of target reps consistently. Time to go heavier.`;
    readyToProgress = true;
  } else if (successRate < 0.6 || (lastSetVelocity < 0.2 && avgVelocity < 0.25)) {
    action = 'decrease';
    confidence = 'high';
    delta = -2.5;
    reason = successRate < 0.6 ? 'Missing too many reps. Reduce weight to build proper form.' : 'Velocity dropping significantly — deload to recover strength.';
    readyToProgress = false;
  } else {
    action = 'maintain';
    confidence = successRate >= 0.75 ? 'medium' : 'low';
    reason = successRate >= 0.75
      ? 'Solid progress. One more session at this weight before increasing.'
      : 'Inconsistent reps. Focus on form before adding weight.';
    readyToProgress = false;
  }

  return {
    exerciseId,
    currentWeight,
    recommendedWeight: Math.max(0, currentWeight + delta),
    action,
    confidence,
    reason,
    readyToProgress,
  };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessions: [],
  personalRecords: {},
  recommendations: {},
  activeSession: null,
  isLoading: true,
  profile: { name: 'Athlete', unit: 'kg', watchConnected: false, sensorPaired: false },

  load: async () => {
    try {
      const [sRaw, prRaw, profileRaw, recsRaw] = await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(PR_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(RECS_KEY),
      ]);
      set({
        sessions: sRaw ? JSON.parse(sRaw) : [],
        personalRecords: prRaw ? JSON.parse(prRaw) : {},
        recommendations: recsRaw ? JSON.parse(recsRaw) : {},
        profile: profileRaw ? JSON.parse(profileRaw) : { name: 'Athlete', unit: 'kg', watchConnected: false, sensorPaired: false },
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  startSession: (title) => {
    const session: WorkoutSession = {
      id: makeId(),
      title,
      date: new Date().toDateString(),
      startTime: new Date().toISOString(),
      exercises: [],
      totalVolume: 0,
      totalReps: 0,
      totalSets: 0,
    };
    set({ activeSession: session });
  },

  updateActiveSession: (session) => {
    set({ activeSession: session });
  },

  finishSession: (session) => {
    const endTime = new Date().toISOString();
    const start = new Date(session.startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    // Compute totals
    let totalVolume = 0, totalReps = 0, totalSets = 0;
    const allSets: WorkoutSet[] = [];
    for (const ex of session.exercises) {
      for (const s of ex.sets) {
        if (!s.isWarmup) {
          totalVolume += s.weight * s.completedReps;
          totalReps += s.completedReps;
          totalSets++;
          allSets.push(s);
        }
      }
    }

    const finished: WorkoutSession = { ...session, endTime, durationMinutes, totalVolume, totalReps, totalSets };
    const updated = [finished, ...get().sessions];
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    set({ sessions: updated, activeSession: null });
    get().updatePRs(allSets);
  },

  discardSession: () => {
    set({ activeSession: null });
  },

  saveSession: (session) => {
    const updated = [session, ...get().sessions];
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    set({ sessions: updated });
  },

  updatePRs: (sets) => {
    const prs = { ...get().personalRecords };
    let updated = false;
    for (const s of sets) {
      if (s.weight === 0 && s.completedReps === 0) continue;
      const existing = prs[s.exerciseId];
      const e1rm = estimateOneRepMax(s.weight, s.completedReps);
      const volume = s.weight * s.completedReps;
      const existingE1rm = existing ? estimateOneRepMax(existing.maxWeight, existing.maxReps) : 0;

      if (!existing || e1rm > existingE1rm || s.weight > existing.maxWeight || volume > existing.bestVolume) {
        prs[s.exerciseId] = {
          exerciseId: s.exerciseId,
          exerciseName: s.exerciseName,
          maxWeight: Math.max(existing?.maxWeight ?? 0, s.weight),
          maxReps: Math.max(existing?.maxReps ?? 0, s.completedReps),
          bestVolume: Math.max(existing?.bestVolume ?? 0, volume),
          estimatedOneRepMax: Math.max(existingE1rm, e1rm),
          achievedAt: new Date().toISOString(),
          sessionId: s.id,
        };
        updated = true;
      }
    }
    if (updated) {
      AsyncStorage.setItem(PR_KEY, JSON.stringify(prs));
      set({ personalRecords: prs });
    }
  },

  computeRecommendation: (exerciseId, exerciseName, currentWeight) => {
    const history = get().getExerciseHistory(exerciseId);
    const rec = computeWeightRec(history, currentWeight, exerciseId, exerciseName);
    const recs = { ...get().recommendations, [exerciseId]: rec };
    AsyncStorage.setItem(RECS_KEY, JSON.stringify(recs));
    set({ recommendations: recs });
    return rec;
  },

  updateProfile: (profile) => {
    const updated = { ...get().profile, ...profile };
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    set({ profile: updated });
  },

  getExerciseHistory: (exerciseId) => {
    const sets: WorkoutSet[] = [];
    for (const session of get().sessions) {
      for (const ex of session.exercises) {
        if (ex.exerciseId === exerciseId) {
          sets.push(...ex.sets);
        }
      }
    }
    return sets.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  deleteSession: (id) => {
    const updated = get().sessions.filter(s => s.id !== id);
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    set({ sessions: updated });
  },
}));
