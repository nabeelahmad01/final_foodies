import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const ConfirmModal = ({ visible, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text?.primary || '#111', marginBottom: 8 },
  message: { fontSize: 14, color: colors.text?.secondary || '#555', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: colors.background || '#f2f2f2' },
  cancelText: { color: colors.text?.primary || '#111', fontWeight: '600' },
  confirm: { backgroundColor: colors.primary },
  confirmText: { color: colors.white, fontWeight: '700' },
});

export default ConfirmModal;
