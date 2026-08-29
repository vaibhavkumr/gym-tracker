import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';
import { Colors } from '../design/colors';

export default function RootLayout() {
  const load = useWorkoutStore(s => s.load);
  const isLoading = useWorkoutStore(s => s.isLoading);

  useEffect(() => { load(); }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="connect" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
