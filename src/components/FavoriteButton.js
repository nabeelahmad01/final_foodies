// Frontend - Favorite Button Component
// src/components/FavoriteButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import colors from '../styles/colors';

const FavoriteButton = ({ restaurantId, size = 24, style }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkIfFavorite();
  }, [restaurantId]);

  const checkIfFavorite = async () => {
    try {
      const response = await api.get('/favorites');
      setIsFavorite(response.data.favorites.some(f => f._id === restaurantId));
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${restaurantId}`);
        setIsFavorite(false);
        Alert.alert('Removed', 'Removed from favorites');
      } else {
        await api.post(`/favorites/${restaurantId}`);
        setIsFavorite(true);
        Alert.alert('Added', 'Added to favorites');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  return (
    <TouchableOpacity onPress={toggleFavorite} style={style}>
      <Icon
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? colors.error : colors.gray}
      />
    </TouchableOpacity>
  );
};

export default FavoriteButton;

