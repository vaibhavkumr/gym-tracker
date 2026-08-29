import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  display: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  h4: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400', color: Colors.textPrimary },
  bodySmall: { fontSize: 12, fontWeight: '400', color: Colors.textSecondary },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5 },
  caption: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5 },
  metric: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  metricSmall: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  tag: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
