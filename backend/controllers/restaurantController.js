// backend/controllers/restaurantController.js (COMPLETE VERSION)
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res) => {
  try {
    const { cuisineType, minRating, lat, lng, maxDistance } = req.query;
    
    let query = { isActive: true };

    if (cuisineType) {
      query.cuisineType = cuisineType;
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    let restaurants;

    // Location-based search
    if (lat && lng) {
      restaurants = await Restaurant.find(query)
        .populate('ownerId', 'name')
        .sort({ rating: -1 });

      // Filter by distance if needed
      if (maxDistance) {
        restaurants = restaurants.filter(restaurant => {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            restaurant.location.coordinates[1],
            restaurant.location.coordinates[0]
          );
          return distance <= parseFloat(maxDistance);
        });
      }
    } else {
      restaurants = await Restaurant.find(query)
        .populate('ownerId', 'name')
        .sort({ rating: -1 });
    }

    res.json({
      status: 'success',
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch restaurants',
    });
  }
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const toRad = (deg) => {
  return deg * (Math.PI / 180);
}

// @desc    Search restaurants
// @route   GET /api/restaurants/search
// @access  Public
export const searchRestaurants = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({
        status: 'success',
        restaurants: [],
      });
    }

    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { cuisineType: { $in: [new RegExp(q, 'i')] } },
        { description: { $regex: q, $options: 'i' } },
      ],
      isActive: true,
    })
      .limit(10)
      .populate('ownerId', 'name');

    // Also search in menu items
    const menuItems = await MenuItem.find({
      name: { $regex: q, $options: 'i' },
      isAvailable: true,
    })
      .populate('restaurantId')
      .limit(10);

    const restaurantsFromMenu = menuItems
      .map(item => item.restaurantId)
      .filter(r => r && r.isActive);

    // Combine and deduplicate
    const allRestaurants = [...restaurants];
    restaurantsFromMenu.forEach(r => {
      if (!allRestaurants.find(existing => existing._id.toString() === r._id.toString())) {
        allRestaurants.push(r);
      }
    });

    res.json({
      status: 'success',
      restaurants: allRestaurants,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Search failed',
    });
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'ownerId',
      'name phone email'
    );

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    const menuItems = await MenuItem.find({
      restaurantId: req.params.id,
      isAvailable: true,
    }).sort({ category: 1, name: 1 });

    res.json({
      status: 'success',
      restaurant: {
        ...restaurant.toObject(),
        menuItems,
      },
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch restaurant',
    });
  }
};

// @desc    Get restaurant menu
// @route   GET /api/restaurants/:id/menu
// @access  Public
export const getRestaurantMenu = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {
      restaurantId: req.params.id,
      isAvailable: true,
    };

    if (category) {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

    res.json({
      status: 'success',
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menu',
    });
  }
};

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant owner)
export const createRestaurant = async (req, res) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ ownerId: req.user.id });
    
    if (existingRestaurant) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a restaurant. Update it instead.',
      });
    }

    const restaurantData = {
      ...req.body,
      ownerId: req.user.id,
    };

    const restaurant = await Restaurant.create(restaurantData);

    // Update user's restaurantId
    await User.findByIdAndUpdate(req.user.id, { 
      restaurantId: restaurant._id 
    });

    res.status(201).json({
      status: 'success',
      restaurant,
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create restaurant',
    });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Restaurant owner)
export const updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this restaurant',
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      status: 'success',
      restaurant,
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update restaurant',
    });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Restaurant owner)
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    // Delete all menu items
    await MenuItem.deleteMany({ restaurantId: req.params.id });

    await restaurant.deleteOne();

    res.json({
      status: 'success',
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete restaurant',
    });
  }
};

// @desc    Add menu item
// @route   POST /api/restaurants/:id/menu
// @access  Private (Restaurant owner)
export const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    const menuItem = await MenuItem.create({
      ...req.body,
      restaurantId: req.params.id,
    });

    res.status(201).json({
      status: 'success',
      menuItem,
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to add menu item',
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/restaurants/:id/menu/:itemId
// @access  Private (Restaurant owner)
export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId);

    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found',
      });
    }

    const restaurant = await Restaurant.findById(menuItem.restaurantId);

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      menuItem: updatedItem,
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update menu item',
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/restaurants/:id/menu/:itemId
// @access  Private (Restaurant owner)
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId);

    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found',
      });
    }

    const restaurant = await Restaurant.findById(menuItem.restaurantId);

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    await menuItem.deleteOne();

    res.json({
      status: 'success',
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete menu item',
    });
  }
};

// @desc    Get restaurant dashboard stats
// @route   GET /api/restaurants/:id/dashboard
// @access  Private (Restaurant owner)
export const getDashboard = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      restaurantId: req.params.id,
      createdAt: { $gte: todayStart },
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: todayStart },
          paymentStatus: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    const pendingOrders = await Order.countDocuments({
      restaurantId: req.params.id,
      status: 'pending',
    });

    const totalMenuItems = await MenuItem.countDocuments({
      restaurantId: req.params.id,
    });

    res.json({
      status: 'success',
      stats: {
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        pendingOrders,
        totalMenuItems,
        rating: restaurant.rating,
        totalReviews: restaurant.totalReviews,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats',
    });
  }
};

// @desc    Get restaurant orders
// @route   GET /api/restaurants/:id/orders
// @access  Private (Restaurant owner)
export const getRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized',
      });
    }

    const { status } = req.query;
    let query = { restaurantId: req.params.id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name phone')
      .populate('riderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
    });
  }
};