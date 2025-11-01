// backend/routes/menus.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as menuController from '../controllers/menuController.js';
import upload from '../middleware/upload.js';

const router = express.Router({ mergeParams: true });

// Public routes - no authentication required
router.get('/', menuController.getMenus);
router.get('/:id', menuController.getMenu);

// Protected routes - require authentication
router.use(protect);

// Restaurant owner/admin routes
router.post(
  '/',
  authorize('restaurant', 'admin'),
  upload.single('image'),
  menuController.createMenu
);

router.put(
  '/:id',
  authorize('restaurant', 'admin'),
  upload.single('image'),
  menuController.updateMenu
);

router.delete(
  '/:id',
  authorize('restaurant', 'admin'),
  menuController.deleteMenu
);

// Menu item routes
router.post(
  '/:menuId/items',
  authorize('restaurant', 'admin'),
  upload.single('image'),
  menuController.addMenuItem
);

router.put(
  '/:menuId/items/:itemId',
  authorize('restaurant', 'admin'),
  upload.single('image'),
  menuController.updateMenuItem
);

router.delete(
  '/:menuId/items/:itemId',
  authorize('restaurant', 'admin'),
  menuController.deleteMenuItem
);

// Menu category routes
router.post(
  '/:menuId/categories',
  authorize('restaurant', 'admin'),
  menuController.addMenuCategory
);

router.put(
  '/:menuId/categories/:categoryId',
  authorize('restaurant', 'admin'),
  menuController.updateMenuCategory
);

router.delete(
  '/:menuId/categories/:categoryId',
  authorize('restaurant', 'admin'),
  menuController.deleteMenuCategory
);

export default router;
