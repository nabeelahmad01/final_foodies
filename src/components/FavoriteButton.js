// Frontend - Favorite Button Component
// src/components/FavoriteButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import colors from '../styles/colors';
import { useToast } from '../context.js/ToastContext';
import { handleApiError, showSuccess } from '../utils/helpers';

const FavoriteButton = ({ restaurantId, size = 24, style }) => {
  const toast = useToast();
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
        showSuccess(toast, 'Removed from favorites');
      } else {
        await api.post(`/favorites/${restaurantId}`);
        setIsFavorite(true);
        showSuccess(toast, 'Added to favorites');
      }
    } catch (error) {
      handleApiError(error, toast);
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

