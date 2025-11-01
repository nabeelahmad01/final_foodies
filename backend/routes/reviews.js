// backend/routes/reviews.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import * as reviewController from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

// Public routes - no authentication required
router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReview);

// Protected routes - require authentication
router.use(protect);

// User routes
router.post(
  '/',
  reviewController.setRestaurantUserIds,
  reviewController.createReview
);

router.patch(
  '/:id',
  reviewController.checkIfReviewAuthor,
  reviewController.updateReview
);

router.delete(
  '/:id',
  reviewController.checkIfReviewAuthor,
  reviewController.deleteReview
);

// Admin routes
router.use(reviewController.restrictTo('admin'));

router.get('/admin/all', reviewController.getAllReviews);
router.delete('/admin/:id', reviewController.adminDeleteReview);

export default router;
