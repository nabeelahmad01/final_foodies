import { StyleSheet } from 'react-native';

const spacing = 16;

const globalStyles = StyleSheet.create({
  screen: { flex: 1, padding: spacing },
  card: { borderRadius: 12, padding: spacing, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },
  shadow: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
});

export default globalStyles;
