import { create } from 'zustand';
import { Accelerometer } from 'expo-sensors';

export type SensorMode = 'disconnected' | 'scanning' | 'connected' | 'phone_only';
export type RepQuality = 'good' | 'partial' | 'fast';

interface RepEvent {
  timestamp: number;
  velocity: number; // estimated m/s
  quality: RepQuality;
}

interface SensorState {
  mode: SensorMode;
  repCount: number;
  repEvents: RepEvent[];
  currentVelocity: number; // 0-1 scale
  avgVelocity: number;
  velocityTrend: 'increasing' | 'stable' | 'declining';
  isFatigued: boolean;
  restTimerActive: boolean;
  restTimeRemaining: number;
  restTimerTarget: number;
  deviceName: string;
  deviceRssi: number;

  startScan: () => Promise<void>;
  connectDevice: (name: string) => void;
  disconnect: () => void;
  usePhoneOnly: () => void;
  resetReps: () => void;
  addRep: (velocity?: number) => void;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;

  // Internal
  _subscription: any;
  _lastPeak: number;
  _restInterval: ReturnType<typeof setInterval> | null;
  _startAccelerometer: () => void;
  _stopAccelerometer: () => void;
}

const REP_THRESHOLD = 1.8; // g-force to count as rep
const REP_DEBOUNCE = 600; // ms min between reps
const FATIGUED_VELOCITY_THRESHOLD = 0.25;

export const useSensorStore = create<SensorState>((set, get) => ({
  mode: 'disconnected',
  repCount: 0,
  repEvents: [],
  currentVelocity: 0.5,
  avgVelocity: 0.5,
  velocityTrend: 'stable',
  isFatigued: false,
  restTimerActive: false,
  restTimeRemaining: 0,
  restTimerTarget: 90,
  deviceName: '',
  deviceRssi: 0,
  _subscription: null,
  _lastPeak: 0,
  _restInterval: null,

  startScan: async () => {
    set({ mode: 'scanning', deviceName: '', deviceRssi: 0 });
    // Simulate BLE scan finding device after 2s
    await new Promise(r => setTimeout(r, 2000));
    set({ deviceName: 'GymTrack Clip', deviceRssi: -58, mode: 'scanning' });
  },

  connectDevice: (name) => {
    set({ mode: 'connected', deviceName: name });
    get()._startAccelerometer();
  },

  disconnect: () => {
    get()._stopAccelerometer();
    set({ mode: 'disconnected', deviceName: '', repCount: 0, repEvents: [] });
  },

  usePhoneOnly: () => {
    set({ mode: 'phone_only', deviceName: 'Phone (Built-in)' });
    get()._startAccelerometer();
  },

  resetReps: () => {
    set({ repCount: 0, repEvents: [], currentVelocity: 0.5, avgVelocity: 0.5, isFatigued: false, velocityTrend: 'stable' });
  },

  addRep: (velocity = 0.4) => {
    const now = Date.now();
    const events = [...get().repEvents, { timestamp: now, velocity, quality: velocity > 0.5 ? 'good' : velocity > 0.3 ? 'partial' : 'fast' as RepQuality }];
    const recentVelocities = events.slice(-5).map(e => e.velocity);
    const avg = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
    const trend: 'increasing' | 'stable' | 'declining' =
      events.length >= 3
        ? (events.slice(-1)[0].velocity > events.slice(-3, -2)[0].velocity + 0.05 ? 'increasing'
          : events.slice(-1)[0].velocity < events.slice(-3, -2)[0].velocity - 0.05 ? 'declining'
          : 'stable')
        : 'stable';
    set({
      repCount: get().repCount + 1,
      repEvents: events,
      currentVelocity: velocity,
      avgVelocity: avg,
      velocityTrend: trend,
      isFatigued: avg < FATIGUED_VELOCITY_THRESHOLD,
    });
  },

  startRestTimer: (seconds) => {
    const { _restInterval } = get();
    if (_restInterval) clearInterval(_restInterval);
    const interval = setInterval(() => {
      const { restTimeRemaining } = get();
      if (restTimeRemaining <= 1) {
        clearInterval(interval);
        set({ restTimerActive: false, restTimeRemaining: 0, _restInterval: null });
      } else {
        get().tickRestTimer();
      }
    }, 1000);
    set({ restTimerActive: true, restTimeRemaining: seconds, restTimerTarget: seconds, _restInterval: interval });
  },

  stopRestTimer: () => {
    const { _restInterval } = get();
    if (_restInterval) clearInterval(_restInterval);
    set({ restTimerActive: false, restTimeRemaining: 0, _restInterval: null });
  },

  tickRestTimer: () => {
    set(s => ({ restTimeRemaining: s.restTimeRemaining - 1 }));
  },

  _startAccelerometer: () => {
    const { _subscription } = get();
    if (_subscription) _subscription.remove();
    Accelerometer.setUpdateInterval(50); // 20Hz
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      const { _lastPeak, mode } = get();
      if ((mode === 'connected' || mode === 'phone_only') && magnitude > REP_THRESHOLD && now - _lastPeak > REP_DEBOUNCE) {
        const repTime = now - _lastPeak;
        const velocity = Math.min(1, Math.max(0.1, 1500 / Math.max(repTime, 300)));
        set({ _lastPeak: now });
        get().addRep(velocity);
      }
    });
    set({ _subscription: sub });
  },

  _stopAccelerometer: () => {
    const { _subscription } = get();
    if (_subscription) { _subscription.remove(); }
    set({ _subscription: null });
  },
}));
