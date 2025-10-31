// src/screens/user/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchRestaurants } from '../../redux/slices/restaurantSlice';
import { CATEGORIES } from '../../utils/constants';
import colors from '../../styles/colors';
import { t } from '../../utils/i18n';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { restaurants, isLoading } = useSelector(state => state.restaurant);
  const { user } = useSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchRestaurants());
    setRefreshing(false);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryEmoji}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderRestaurant = restaurant => (
    <TouchableOpacity
      key={restaurant._id}
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant })}
    >
      <Image
        source={{
          uri: restaurant.images?.[0] || 'https://via.placeholder.com/300',
        }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.restaurantCuisine}>
          {restaurant.cuisineType?.join(', ')}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color={colors.warning} />
            <Text style={styles.rating}>{restaurant.rating || '4.5'}</Text>
            <Text style={styles.reviews}>
              ({restaurant.totalReviews || '0'})
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Icon name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.time}>30-40 min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text>{t('home.title')}</Text>
            <TextInput placeholder={t('home.searchPlaceholder')} />
            <Text>{t('home.popularRestaurants')}</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Foodie</Text>
            <View style={styles.locationContainer}>
              <Icon name="location" size={16} color={colors.white} />
              <Text style={styles.location}>Lahore, Punjab</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Icon name="person" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            horizontal
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={item => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Popular Restaurants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Restaurants</Text>
          <View style={styles.restaurantsGrid}>
            {restaurants.map(restaurant => renderRestaurant(restaurant))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  location: {
    color: colors.white,
    fontSize: 14,
    marginLeft: 5,
    opacity: 0.9,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text.primary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  restaurantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  restaurantCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  restaurantImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.lightGray,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: colors.text.primary,
  },
  reviews: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
});

export default HomeScreen;
