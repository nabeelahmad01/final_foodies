import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const PromoCodeInput = ({ onApply }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      await onApply?.(code.trim());
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter promo code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
      />
      <TouchableOpacity style={[styles.button, !code.trim() && styles.disabled]} onPress={apply} disabled={!code.trim() || loading}>
        <Text style={styles.buttonText}>{loading ? '...' : 'Apply'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12, height: 44 },
  button: { backgroundColor: colors.primary, borderRadius: 10, height: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontWeight: '700' },
  disabled: { backgroundColor: colors.gray },
});

export default PromoCodeInput;
