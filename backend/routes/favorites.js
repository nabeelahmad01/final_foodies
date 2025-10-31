// ============================================
// 1. FAVORITES FEATURE
// ============================================

// Add to User model (already exists in addresses array)
// favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }]

// Backend Routes
// backend/routes/favorites.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json({ status: 'success', favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch favorites' });
  }
});

router.post('/:restaurantId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.favorites) user.favorites = [];
    
    if (user.favorites.includes(req.params.restaurantId)) {
      return res.status(400).json({ message: 'Already in favorites' });
    }
    
    user.favorites.push(req.params.restaurantId);
    await user.save();
    
    res.json({ status: 'success', message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add favorite' });
  }
});

router.delete('/:restaurantId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.restaurantId);
    await user.save();
    
    res.json({ status: 'success', message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to remove favorite' });
  }
});

module.exports = router;

// Add to server.js
// app.use('/api/favorites', require('./routes/favorites'));



