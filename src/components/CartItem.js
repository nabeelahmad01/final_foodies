import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';

const CartItem = ({ item, onAdd, onRemove }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/60' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>Rs. {item.price}</Text>
      </View>
      <View style={styles.qty}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onRemove(item)}>
          <Icon name="remove" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.count}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdd(item)}>
          <Icon name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  image: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.lightGray },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  price: { fontSize: 14, color: colors.primary, fontWeight: 'bold' },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: colors.text.primary },
});

export default CartItem;
