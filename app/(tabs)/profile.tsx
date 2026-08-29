import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../design/colors';
import { Typography } from '../../design/typography';
import { useWorkoutStore } from '../../store/workoutStore';
import { useSensorStore } from '../../store/sensorStore';

function SettingRow({ icon, label, value, onPress, color }: {
  icon: string; label: string; value?: string; onPress?: () => void; color?: string;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingIcon, { backgroundColor: (color ?? Colors.accent) + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color ?? Colors.accent} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={Typography.h4}>{label}</Text>
        {value && <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const profile = useWorkoutStore(s => s.profile);
  const updateProfile = useWorkoutStore(s => s.updateProfile);
  const sessions = useWorkoutStore(s => s.sessions);
  const sensorMode = useSensorStore(s => s.mode);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalSessions = sessions.length;
  const totalSets = sessions.reduce((sum, s) => sum + s.totalSets, 0);

  function saveName() {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
    }
    setEditingName(false);
  }

  function toggleUnit() {
    Haptics.selectionAsync();
    updateProfile({ unit: profile.unit === 'kg' ? 'lbs' : 'kg' });
  }

  function connectWatch() {
    Alert.alert(
      'Apple Watch',
      'Connect GymTrack to Apple Health to sync heart rate and calories.\n\nRequires iPhone + Apple Watch with watchOS 7+.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            updateProfile({ watchConnected: true });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Connected!', 'Apple Watch data will sync during workouts.');
          },
        },
      ]
    );
  }

  function disconnectWatch() {
    Alert.alert('Disconnect Watch', 'Stop syncing Apple Watch data?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => updateProfile({ watchConnected: false }) },
    ]);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 36 }}>🏋️</Text>
        </View>
        {editingName ? (
          <View style={styles.nameEdit}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onBlur={saveName}
              onSubmitEditing={saveName}
            />
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingName(true)} style={{ alignItems: 'center' }}>
            <Text style={Typography.h1}>{profile.name}</Text>
            <Text style={[Typography.caption, { color: Colors.accent }]}>TAP TO EDIT</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[Typography.metricSmall, { color: Colors.accent }]}>{totalSessions}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>SESSIONS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[Typography.metricSmall, { color: Colors.purple }]}>
            {totalVolume >= 1000 ? `${Math.round(totalVolume / 1000)}k` : totalVolume}
          </Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>KG LIFTED</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[Typography.metricSmall, { color: Colors.success }]}>{totalSets}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>TOTAL SETS</Text>
        </View>
      </View>

      {/* Sensor */}
      <View style={styles.section}>
        <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 12 }]}>SENSOR</Text>
        <View style={styles.card}>
          <View style={styles.sensorStatus}>
            <View style={[styles.statusDot, {
              backgroundColor: sensorMode === 'connected' ? Colors.success
                : sensorMode === 'phone_only' ? Colors.accent : Colors.textMuted
            }]} />
            <View>
              <Text style={Typography.h4}>
                {sensorMode === 'connected' ? 'GymTrack Clip Connected' :
                 sensorMode === 'phone_only' ? 'Phone Sensor Active' :
                 'No Sensor'}
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                {sensorMode === 'connected' ? 'Auto rep detection via clip sensor' :
                 sensorMode === 'phone_only' ? 'Using phone accelerometer for rep detection' :
                 'Connect sensor for automatic rep tracking'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.sensorBtn, { backgroundColor: sensorMode === 'disconnected' ? Colors.accent : Colors.danger + '20' }]}
            onPress={() => sensorMode === 'disconnected' ? router.push('/connect') : useSensorStore.getState().disconnect()}
          >
            <Text style={[styles.sensorBtnText, { color: sensorMode === 'disconnected' ? Colors.background : Colors.danger }]}>
              {sensorMode === 'disconnected' ? 'CONNECT' : 'DISCONNECT'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Apple Watch */}
      <View style={styles.section}>
        <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 12 }]}>APPLE WATCH</Text>
        <View style={styles.card}>
          <View style={styles.sensorStatus}>
            <View style={[styles.statusDot, { backgroundColor: profile.watchConnected ? Colors.success : Colors.textMuted }]} />
            <View>
              <Text style={Typography.h4}>{profile.watchConnected ? 'Apple Watch Connected' : 'Not Connected'}</Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                {profile.watchConnected ? 'Heart rate + calories syncing during workouts' : 'Connect to track calories and heart rate'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.sensorBtn, { backgroundColor: profile.watchConnected ? Colors.danger + '20' : Colors.surface }]}
            onPress={profile.watchConnected ? disconnectWatch : connectWatch}
          >
            <Ionicons name="watch-outline" size={14} color={profile.watchConnected ? Colors.danger : Colors.accent} />
            <Text style={[styles.sensorBtnText, { color: profile.watchConnected ? Colors.danger : Colors.accent }]}>
              {profile.watchConnected ? 'DISCONNECT' : 'CONNECT'}
            </Text>
          </TouchableOpacity>
        </View>
        {profile.watchConnected && (
          <View style={styles.watchFeatures}>
            {['❤️  Real-time heart rate', '🔥  Accurate calories burned', '📊  Workout effort score', '💤  Recovery data'].map(f => (
              <Text key={f} style={[Typography.bodySmall, { color: Colors.textSecondary }]}>{f}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[Typography.label, { color: Colors.textSecondary, marginBottom: 12 }]}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            icon="scale-outline"
            label="Weight Unit"
            value={profile.unit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
            onPress={toggleUnit}
            color={Colors.purple}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="person-outline"
            label="Body Weight"
            value={profile.bodyWeightKg ? `${profile.bodyWeightKg} kg` : 'Not set'}
            onPress={() => Alert.prompt?.('Body Weight', 'Enter your weight in kg:', (w) => {
              if (w && !isNaN(parseFloat(w))) updateProfile({ bodyWeightKg: parseFloat(w) });
            })}
            color={Colors.accent}
          />
        </View>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, alignItems: 'center', paddingBottom: 24 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  nameEdit: { marginTop: 8 },
  nameInput: {
    backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.accent,
    paddingHorizontal: 16, paddingVertical: 8, color: Colors.textPrimary,
    fontSize: 22, fontWeight: '700', textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  statBox: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: 'center', gap: 4,
  },
  section: { paddingHorizontal: 20, marginTop: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  sensorStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  sensorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  sensorBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  watchFeatures: {
    backgroundColor: Colors.successGlow, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.success + '30',
    padding: 12, marginTop: 8, gap: 6,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
});
