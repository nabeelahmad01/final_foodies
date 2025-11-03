import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';

const RestaurantCard = ({ restaurant, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(restaurant)}>
      <Image source={{ uri: restaurant.images?.[0] || 'https://via.placeholder.com/300x160' }} style={styles.cover} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="star" size={14} color={colors.warning} />
            <Text style={styles.metaText}>{restaurant.rating || '4.5'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.metaText}>30-40 mins</Text>
          </View>
        </View>
        {!!restaurant.cuisineType && (
          <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisineType.join(', ')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 1 },
  cover: { width: '100%', height: 160, backgroundColor: colors.lightGray },
  info: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.text.secondary },
  cuisine: { fontSize: 12, color: colors.text.secondary },
});

export default RestaurantCard;
