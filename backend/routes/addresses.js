// ============================================
// 3. MULTIPLE ADDRESSES
// ============================================

// Backend route - already in User model addresses array
// backend/routes/addresses.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ status: 'success', addresses: user.addresses || [] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch addresses' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.addresses) user.addresses = [];
    
    // If this is first address or marked as default, make it default
    if (req.body.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => addr.isDefault = false);
      req.body.isDefault = true;
    }
    
    user.addresses.push(req.body);
    await user.save();
    
    res.status(201).json({ status: 'success', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add address' });
  }
});

router.put('/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    // If making this default, remove default from others
    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    Object.assign(address, req.body);
    await user.save();
    
    res.json({ status: 'success', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update address' });
  }
});

router.delete('/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.pull(req.params.addressId);
    
    // If deleted address was default, make first address default
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    res.json({ status: 'success', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete address' });
  }
});

export default router;