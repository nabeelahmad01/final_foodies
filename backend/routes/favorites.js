// ============================================
// FAVORITES FEATURE
// ============================================

import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// @desc    Get user's favorite restaurants
// @route   GET /api/favorites
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites', 'name image rating cuisine deliveryTime')
      .select('favorites');
      
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      results: user.favorites.length,
      data: {
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add restaurant to favorites
// @route   POST /api/favorites/:restaurantId
// @access  Private
router.post('/:restaurantId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    if (!user.favorites) user.favorites = [];
    
    if (user.favorites.includes(req.params.restaurantId)) {
      return next(new AppError('Restaurant already in favorites', 400));
    }
    
    user.favorites.push(req.params.restaurantId);
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Added to favorites',
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove restaurant from favorites
// @route   DELETE /api/favorites/:restaurantId
// @access  Private
router.delete('/:restaurantId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    if (!user.favorites) user.favorites = [];
    
    const index = user.favorites.indexOf(req.params.restaurantId);
    if (index === -1) {
      return next(new AppError('Restaurant not in favorites', 400));
    }
    
    user.favorites.splice(index, 1);
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Removed from favorites',
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// Add to server.js
// import favoritesRouter from './routes/favorites';
// app.use('/api/favorites', favoritesRouter);
