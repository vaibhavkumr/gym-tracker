import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../design/colors';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Ionicons name={name as any} size={21} color={focused ? Colors.accent : Colors.textMuted} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }}
      />
      <Tabs.Screen
        name="workout"
        options={{ title: 'Exercises', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'barbell' : 'barbell-outline'} focused={focused} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} /> }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: 'Records', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  iconWrap: {
    width: 38, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
  },
  iconActive: { backgroundColor: Colors.accentGlow },
});
