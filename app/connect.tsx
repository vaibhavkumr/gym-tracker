import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../design/colors';
import { Typography } from '../design/typography';
import { useSensorStore } from '../store/sensorStore';
import { useWorkoutStore } from '../store/workoutStore';

function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      opacity.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.pulseCore}>
        <Ionicons
          name={active ? 'radio-outline' : 'bluetooth'}
          size={32}
          color={active ? Colors.accent : Colors.textMuted}
        />
      </View>
    </View>
  );
}

function SignalDots({ rssi }: { rssi: number }) {
  const bars = rssi >= -50 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
      {[1, 2, 3, 4].map(b => (
        <View
          key={b}
          style={{
            width: 5,
            height: 5 + b * 4,
            borderRadius: 2,
            backgroundColor: b <= bars ? Colors.success : Colors.surfaceHigh,
          }}
        />
      ))}
    </View>
  );
}

export default function ConnectScreen() {
  const mode = useSensorStore(s => s.mode);
  const deviceName = useSensorStore(s => s.deviceName);
  const deviceRssi = useSensorStore(s => s.deviceRssi);
  const startScan = useSensorStore(s => s.startScan);
  const connectDevice = useSensorStore(s => s.connectDevice);
  const disconnect = useSensorStore(s => s.disconnect);
  const usePhoneOnly = useSensorStore(s => s.usePhoneOnly);
  const updateProfile = useWorkoutStore(s => s.updateProfile);

  const [scanDone, setScanDone] = useState(mode === 'scanning' && !!deviceName);

  const isScanning = mode === 'scanning';
  const isConnected = mode === 'connected';
  const isPhoneOnly = mode === 'phone_only';

  async function handleScan() {
    setScanDone(false);
    await startScan();
    setScanDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleConnect() {
    connectDevice(deviceName || 'GymTrack Clip');
    updateProfile({ sensorPaired: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handlePhoneOnly() {
    usePhoneOnly();
    Haptics.selectionAsync();
  }

  function handleDisconnect() {
    Alert.alert('Disconnect Sensor', 'Stop using the GymTrack Clip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive',
        onPress: () => {
          disconnect();
          updateProfile({ sensorPaired: false });
          Haptics.selectionAsync();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={Typography.h3}>Sensor Setup</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        {/* Status visual */}
        <View style={styles.visualSection}>
          <PulseRing active={isScanning} />
          <Text style={[Typography.h3, { marginTop: 20, textAlign: 'center' }]}>
            {isConnected
              ? deviceName
              : isPhoneOnly
              ? 'Phone Sensor Active'
              : isScanning
              ? 'Scanning...'
              : 'No Sensor Connected'}
          </Text>
          <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: 6 }]}>
            {isConnected
              ? 'Clip sensor is tracking reps via accelerometer'
              : isPhoneOnly
              ? 'Using built-in phone accelerometer for rep detection'
              : isScanning && !scanDone
              ? 'Looking for GymTrack Clip nearby...'
              : isScanning && scanDone
              ? 'Device found. Ready to connect.'
              : 'Connect the clip sensor or use your phone'}
          </Text>
          {isConnected && <SignalDots rssi={deviceRssi || -60} />}
        </View>

        {/* Connected state */}
        {(isConnected || isPhoneOnly) && (
          <View style={styles.connectedCard}>
            <View style={styles.connectedRow}>
              <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{isConnected ? deviceName : 'Phone (Built-in)'}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                  {isConnected ? 'GymTrack Clip · Bluetooth LE' : 'Using device accelerometer'}
                </Text>
              </View>
              {isConnected && <SignalDots rssi={deviceRssi || -60} />}
            </View>

            <View style={styles.featureList}>
              {[
                { icon: 'fitness-outline', label: 'Automatic rep counting' },
                { icon: 'speedometer-outline', label: 'Velocity tracking per rep' },
                { icon: 'pulse-outline', label: 'Fatigue detection' },
                { icon: 'time-outline', label: 'Auto rest timer' },
              ].map(f => (
                <View key={f.label} style={styles.featureRow}>
                  <Ionicons name={f.icon as any} size={16} color={Colors.success} />
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginLeft: 8 }]}>{f.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectBtnText}>DISCONNECT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan result — device found */}
        {isScanning && scanDone && !isConnected && (
          <View style={styles.deviceCard}>
            <View style={styles.deviceCardLeft}>
              <View style={styles.deviceIcon}>
                <Ionicons name="hardware-chip-outline" size={22} color={Colors.accent} />
              </View>
              <View>
                <Text style={Typography.h4}>{deviceName || 'GymTrack Clip'}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>Bluetooth LE · {deviceRssi} dBm</Text>
              </View>
            </View>
            <SignalDots rssi={deviceRssi} />
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {!isConnected && !isPhoneOnly && (
            <>
              {/* Scan / connect */}
              {!isScanning && !scanDone && (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleScan} activeOpacity={0.85}>
                  <Ionicons name="bluetooth" size={18} color={Colors.background} />
                  <Text style={styles.primaryBtnText}>SCAN FOR SENSOR</Text>
                </TouchableOpacity>
              )}

              {isScanning && !scanDone && (
                <View style={[styles.primaryBtn, { backgroundColor: Colors.surfaceHigh }]}>
                  <Ionicons name="radio-outline" size={18} color={Colors.accent} />
                  <Text style={[styles.primaryBtnText, { color: Colors.accent }]}>SCANNING...</Text>
                </View>
              )}

              {scanDone && (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleConnect} activeOpacity={0.85}>
                  <Ionicons name="link-outline" size={18} color={Colors.background} />
                  <Text style={styles.primaryBtnText}>CONNECT {(deviceName || 'GymTrack Clip').toUpperCase()}</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={[Typography.caption, { color: Colors.textMuted, marginHorizontal: 12 }]}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Phone only */}
              <TouchableOpacity style={styles.secondaryBtn} onPress={handlePhoneOnly} activeOpacity={0.85}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.accent} />
                <Text style={styles.secondaryBtnText}>USE PHONE SENSOR</Text>
              </TouchableOpacity>
            </>
          )}

          {(isConnected || isPhoneOnly) && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.success }]}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color={Colors.background} />
              <Text style={styles.primaryBtnText}>DONE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info note */}
        {!isConnected && !isPhoneOnly && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={[Typography.bodySmall, { color: Colors.textMuted, flex: 1, marginLeft: 8 }]}>
              The GymTrack Clip attaches to your barbell or dumbbell and detects rep motion via accelerometer. Make sure Bluetooth is enabled.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1, padding: 20 },

  visualSection: { alignItems: 'center', paddingVertical: 32 },
  pulseWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: Colors.accent,
  },
  pulseCore: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  connectedCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.success + '40',
    padding: 16, marginBottom: 16,
  },
  connectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  featureList: { gap: 8, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  disconnectBtn: {
    borderWidth: 1, borderColor: Colors.danger + '50',
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center',
  },
  disconnectBtnText: { fontSize: 12, fontWeight: '800', color: Colors.danger, letterSpacing: 1.5 },

  deviceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent + '30',
    padding: 14, marginBottom: 16,
  },
  deviceCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },

  actions: { gap: 10, marginBottom: 16 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '900', color: Colors.background, letterSpacing: 2 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1, borderColor: Colors.accent + '40',
    borderRadius: 14, paddingVertical: 14,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '800', color: Colors.accent, letterSpacing: 1.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12,
  },
});
