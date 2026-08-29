# Gym Tracker

A workout tracker that counts your reps from the phone's accelerometer instead
of making you tap after every set, and uses the motion signal to estimate rep
quality and fatigue.

## The interesting part

`store/sensorStore.ts` reads `expo-sensors` accelerometer data and derives:

- **Rep detection** — each rep logged as an event with a timestamp
- **Velocity estimate** — per-rep speed, plus a running average
- **Rep quality** — classified `good` / `partial` / `fast`
- **Fatigue detection** — from the velocity trend across a set
  (`increasing` / `stable` / `declining`), since bar speed dropping off is the
  standard proxy for fatigue in velocity-based training
- **Auto rest timer** — starts when a set ends

It degrades gracefully: `phone_only` mode works with no external hardware, and
the store also models `scanning` / `connected` states with device name and
RSSI for a dedicated sensor.

## Screens

```
app/(tabs)/index.tsx      home
app/(tabs)/workout.tsx    active session
app/(tabs)/history.tsx    past workouts
app/(tabs)/records.tsx    personal records
app/(tabs)/profile.tsx    profile
app/exercise/[id].tsx     per-exercise detail
app/connect.tsx           sensor pairing, with an animated pulse ring
app/session.tsx           session flow
```

## Stack

Expo · React Native · TypeScript · expo-router · zustand (sensor + workout
stores) · expo-sensors · AsyncStorage · react-native-svg · expo-haptics

## Running it

```bash
npm install
npx expo start
```

Rep detection needs a real device — the simulator has no accelerometer.

## Status

Tracking, history and records work, with workout state persisted locally. The
rep-detection thresholds are tuned by hand and haven't been validated against
a ground-truth rep count, so treat the quality and fatigue classifications as
a working prototype rather than a measurement.
