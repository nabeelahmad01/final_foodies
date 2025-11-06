// backend/routes/riders.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as riderController from '../controllers/riderController.js';

const router = express.Router();

// All routes require authentication and rider role
router.use(protect);
router.use(authorize('rider'));

// Rider dashboard
router.get('/dashboard', riderController.getDashboard);

// Update online status
router.put('/status', riderController.updateOnlineStatus);

// Auto-set online after KYC approval
router.put('/auto-online', riderController.setAutoOnline);

// Rider earnings
router.get('/:id/earnings', riderController.getRiderEarnings);

// Rider stats
router.get('/:id/stats', riderController.getRiderStats);

export default router;
