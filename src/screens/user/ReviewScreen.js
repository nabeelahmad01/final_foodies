// src/screens/user/ReviewScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../styles/colors';
import api from '../../services/api';

const ReviewScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const { user } = useSelector(state => state.auth);
  
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [comment, setComment] = useState('');
  const [restaurantComment, setRestaurantComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderStars = (rating, setRating, color = colors.warning) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Icon
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? color : colors.lightGray}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const submitOrderReview = async () => {
    if (foodRating === 0 || deliveryRating === 0) {
      Alert.alert('Required', 'Please rate both food quality and delivery service');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/orders/${order._id}/rate`, {
        food: foodRating,
        delivery: deliveryRating,
        comment: comment.trim(),
      });

      Alert.alert('Success', 'Thank you for your review!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to submit order review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRestaurantReview = async () => {
    if (restaurantRating === 0) {
      Alert.alert('Required', 'Please rate the restaurant');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/restaurants/${order.restaurantId._id}/reviews`, {
        rating: restaurantRating,
        comment: restaurantComment.trim(),
        orderId: order._id,
      });

      Alert.alert('Success', 'Restaurant review submitted!');
      setRestaurantRating(0);
      setRestaurantComment('');
    } catch (error) {
      console.error('Failed to submit restaurant review:', error);
      Alert.alert('Error', 'Failed to submit restaurant review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <View style={styles.restaurantInfo}>
          <Image
            source={{ uri: order.restaurantId?.image || 'https://via.placeholder.com/60' }}
            style={styles.restaurantImage}
          />
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{order.restaurantId?.name}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.orderAmount}>Rs. {order.totalAmount}</Text>
          </View>
        </View>
      </View>

      {/* Order Review Section */}
      <View style={styles.reviewSection}>
        <Text style={styles.sectionTitle}>Rate Your Order</Text>
        
        {/* Food Quality */}
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Food Quality</Text>
          {renderStars(foodRating, setFoodRating)}
        </View>

        {/* Delivery Service */}
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Delivery Service</Text>
          {renderStars(deliveryRating, setDeliveryRating)}
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us about your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={submitOrderReview}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Order Review'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant Review Section */}
      <View style={styles.reviewSection}>
        <Text style={styles.sectionTitle}>Rate the Restaurant</Text>
        
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Overall Restaurant Experience</Text>
          {renderStars(restaurantRating, setRestaurantRating, colors.primary)}
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Restaurant Feedback (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your thoughts about the restaurant..."
            value={restaurantComment}
            onChangeText={setRestaurantComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, styles.restaurantButton, isSubmitting && styles.disabledButton]}
          onPress={submitRestaurantReview}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Restaurant Review'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  orderInfo: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reviewSection: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingItem: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  restaurantButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  skipButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default ReviewScreen;
