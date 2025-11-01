// backend/controllers/reviewController.js
import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

// @desc    Get all reviews for a restaurant
// @route   GET /api/restaurants/:restaurantId/reviews
// @access  Public
export const getReviews = async (req, res, next) => {
  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return next(new AppError('No restaurant found with that ID', 404));
    }

    // Build query
    const query = { restaurant: req.params.restaurantId };
    
    // Filter by rating if provided
    if (req.query.rating) {
      query.rating = req.query.rating;
    }

    // Execute query
    const reviews = await Review.find(query)
      .populate({
        path: 'user',
        select: 'name profileImage',
      })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review
// @route   GET /api/restaurants/:restaurantId/reviews/:id
// @access  Public
export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate({
      path: 'user',
      select: 'name profileImage',
    });

    if (!review) {
      return next(new AppError('No review found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/restaurants/:restaurantId/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { rating, comment } = req.body;
    const { restaurantId } = req.params;

    // Check if the user has already reviewed this restaurant
    const existingReview = await Review.findOne({
      user: req.user.id,
      restaurant: restaurantId,
    });

    if (existingReview) {
      return next(
        new AppError('You have already reviewed this restaurant', 400)
      );
    }

    // Check if the user has ordered from this restaurant
    const hasOrdered = await Order.exists({
      user: req.user.id,
      restaurant: restaurantId,
      status: 'delivered',
    });

    if (!hasOrdered) {
      return next(
        new AppError('You need to order from this restaurant before reviewing', 400)
      );
    }

    const review = await Review.create({
      rating,
      comment,
      user: req.user.id,
      restaurant: restaurantId,
    });

    // Populate user data
    await review.populate({
      path: 'user',
      select: 'name profileImage',
    });

    // Update restaurant rating
    await updateRestaurantRating(restaurantId);

    res.status(201).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PATCH /api/restaurants/:restaurantId/reviews/:id
// @access  Private/Review Owner
export const updateReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { rating, comment } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!review) {
      return next(new AppError('No review found with that ID', 404));
    }

    // Update restaurant rating
    await updateRestaurantRating(review.restaurant);

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/restaurants/:restaurantId/reviews/:id
// @access  Private/Review Owner & Admin
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return next(new AppError('No review found with that ID', 404));
    }

    // Update restaurant rating
    await updateRestaurantRating(review.restaurant);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/restaurants/reviews/admin/all
// @access  Private/Admin
export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate({
        path: 'user',
        select: 'name email',
      })
      .populate({
        path: 'restaurant',
        select: 'name',
      })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any review (Admin)
// @route   DELETE /api/restaurants/reviews/admin/:id
// @access  Private/Admin
export const adminDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return next(new AppError('No review found with that ID', 404));
    }

    // Update restaurant rating
    await updateRestaurantRating(review.restaurant);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Middleware to set restaurant and user IDs
// @desc    Set restaurant and user IDs
// @access  Private
export const setRestaurantUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.restaurant) req.body.restaurant = req.params.restaurantId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Middleware to check if user is the review author
// @desc    Check if user is review author
// @access  Private
export const checkIfReviewAuthor = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new AppError('No review found with that ID', 404));
    }

    // Check if the user is the review author or an admin
    if (
      review.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to restrict routes to specific roles
// @desc    Restrict to specific roles
// @access  Private
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Helper function to update restaurant rating
// @desc    Update restaurant rating
// @access  Private
const updateRestaurantRating = async restaurantId => {
  try {
    const stats = await Review.aggregate([
      {
        $match: { restaurant: restaurantId },
      },
      {
        $group: {
          _id: '$restaurant',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      await Restaurant.findByIdAndUpdate(restaurantId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5, // Default rating
      });
    }
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
  }
};
