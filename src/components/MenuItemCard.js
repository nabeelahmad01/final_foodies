import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';

const MenuItemCard = ({ item, onAdd }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/80' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {!!item.description && (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.row}>
          <Text style={styles.price}>Rs. {item.price}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => onAdd?.(item)}>
            <Icon name="add" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 12, elevation: 1 },
  image: { width: 80, height: 80, borderRadius: 10, backgroundColor: colors.lightGray },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  desc: { fontSize: 12, color: colors.text.secondary, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});

export default MenuItemCard;
