import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import colors from '../../styles/colors';

const TermsScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.text}>These are the sample terms and conditions for the app. Replace with your real content.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  text: { color: colors.text.secondary, lineHeight: 20 },
});

export default TermsScreen;
