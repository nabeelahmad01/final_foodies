import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

const WalletScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <Text style={styles.text}>Your balance and transactions will appear here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  text: { color: colors.text.secondary },
});

export default WalletScreen;
