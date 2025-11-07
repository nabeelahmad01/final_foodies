// src/components/RatingReviewModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiClient } from '../services/api';
import colors from '../styles/colors';
import { useToast } from '../context.js/ToastContext';

const StarRating = ({ rating, onRatingChange, size = 30, disabled = false }) => {
  const [animatedValues] = useState(
    Array.from({ length: 5 }, () => new Animated.Value(1))
  );

  const handleStarPress = (starIndex) => {
    if (disabled) return;
    
    // Animate the pressed star
    Animated.sequence([
      Animated.timing(animatedValues[starIndex], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[starIndex], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onRatingChange(starIndex + 1);
  };

  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star, index) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(index)}
          disabled={disabled}
          style={styles.starButton}
        >
          <Animated.View
            style={{
              transform: [{ scale: animatedValues[index] }],
            }}
          >
            <Icon
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#FFD700' : '#DDD'}
            />
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const RatingReviewModal = ({ visible, onClose, order, onSubmitSuccess }) => {
  const [foodRating, setFoodRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [foodReview, setFoodReview] = useState('');
  const [riderReview, setRiderReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const resetForm = () => {
    setFoodRating(0);
    setRiderRating(0);
    setFoodReview('');
    setRiderReview('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (foodRating === 0) {
      toast.show('Please rate the food quality', 'error');
      return false;
    }
    if (riderRating === 0) {
      toast.show('Please rate the delivery experience', 'error');
      return false;
    }
    return true;
  };

  const submitReview = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        orderId: order.id,
        restaurantId: order.restaurantId,
        riderId: order.riderId,
        foodRating,
        riderRating,
        foodReview: foodReview.trim(),
        riderReview: riderReview.trim(),
      };

      await apiClient.post('/reviews/submit', reviewData);
      
      toast.show('Thank you for your review!', 'success');
      onSubmitSuccess && onSubmitSuccess();
      handleClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.show(
        error.response?.data?.message || 'Failed to submit review. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[rating] || '';
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Rate Your Experience</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Order Info */}
            <View style={styles.orderInfo}>
              <Text style={styles.orderText}>Order #{order.id}</Text>
              <Text style={styles.restaurantText}>{order.restaurant?.name}</Text>
            </View>

            {/* Food Rating Section */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingHeader}>
                <Icon name="restaurant" size={24} color={colors.primary} />
                <Text style={styles.ratingTitle}>Food Quality</Text>
              </View>
              
              <StarRating
                rating={foodRating}
                onRatingChange={setFoodRating}
                size={35}
              />
              
              {foodRating > 0 && (
                <Text style={styles.ratingText}>
                  {getRatingText(foodRating)}
                </Text>
              )}

              <TextInput
                style={styles.reviewInput}
                placeholder="Tell us about the food quality, taste, presentation..."
                placeholderTextColor={colors.textLight}
                value={foodReview}
                onChangeText={setFoodReview}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Rider Rating Section */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingHeader}>
                <Icon name="bicycle" size={24} color={colors.primary} />
                <Text style={styles.ratingTitle}>Delivery Experience</Text>
              </View>
              
              <StarRating
                rating={riderRating}
                onRatingChange={setRiderRating}
                size={35}
              />
              
              {riderRating > 0 && (
                <Text style={styles.ratingText}>
                  {getRatingText(riderRating)}
                </Text>
              )}

              <TextInput
                style={styles.reviewInput}
                placeholder="How was the delivery? Timeliness, packaging, rider behavior..."
                placeholderTextColor={colors.textLight}
                value={riderReview}
                onChangeText={setRiderReview}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (foodRating === 0 || riderRating === 0 || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={submitReview}
              disabled={foodRating === 0 || riderRating === 0 || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  orderInfo: {
    backgroundColor: colors.lightGray,
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'center',
  },
  orderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  restaurantText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  ratingSection: {
    marginBottom: 30,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 15,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    padding: 15,
  },
  skipButtonText: {
    color: colors.textLight,
    fontSize: 16,
  },
});

export default RatingReviewModal;
