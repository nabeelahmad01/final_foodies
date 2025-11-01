// backend/controllers/menuController.js
import Menu from '../models/Menu.js';
import Restaurant from '../models/Restaurant.js';
import { validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get all menus for a restaurant
// @route   GET /api/restaurants/:restaurantId/menus
// @access  Public
export const getMenus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    const menus = await Menu.find({ restaurant: restaurantId, isActive: true })
      .populate('categories.items')
      .sort('displayOrder');

    res.json({
      status: 'success',
      count: menus.length,
      menus,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menus',
    });
  }
};

// @desc    Get single menu
// @route   GET /api/restaurants/:restaurantId/menus/:id
// @access  Public
export const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne({
      _id: req.params.id,
      restaurant: req.params.restaurantId,
      isActive: true,
    }).populate('categories.items');

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    res.json({
      status: 'success',
      menu,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menu',
    });
  }
};

// @desc    Create a new menu
// @route   POST /api/restaurants/:restaurantId/menus
// @access  Private/Restaurant Owner & Admin
export const createMenu = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, description, isActive, displayOrder } = req.body;
    const { restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add menu to this restaurant',
      });
    }

    // Handle image upload
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `foodie/menus/${restaurantId}`,
      });
      imageUrl = result.secure_url;
    }

    const menu = new Menu({
      name,
      description,
      image: imageUrl,
      restaurant: restaurantId,
      isActive: isActive || true,
      displayOrder: displayOrder || 0,
      categories: [],
    });

    await menu.save();

    res.status(201).json({
      status: 'success',
      menu,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create menu',
    });
  }
};

// @desc    Update a menu
// @route   PUT /api/restaurants/:restaurantId/menus/:id
// @access  Private/Restaurant Owner & Admin
export const updateMenu = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, description, isActive, displayOrder } = req.body;
    const { restaurantId, id } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this menu',
      });
    }

    // Find the menu
    const menu = await Menu.findOne({
      _id: id,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Handle image upload if a new image is provided
    if (req.file) {
      // Delete old image if exists
      if (menu.image) {
        // Extract public_id from the URL and delete the old image
        const publicId = menu.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`foodie/menus/${restaurantId}/${publicId}`);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `foodie/menus/${restaurantId}`,
      });
      menu.image = result.secure_url;
    }

    // Update menu fields
    menu.name = name || menu.name;
    menu.description = description || menu.description;
    if (isActive !== undefined) menu.isActive = isActive;
    if (displayOrder !== undefined) menu.displayOrder = displayOrder;

    await menu.save();

    res.json({
      status: 'success',
      menu,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update menu',
    });
  }
};

// @desc    Delete a menu
// @route   DELETE /api/restaurants/:restaurantId/menus/:id
// @access  Private/Restaurant Owner & Admin
export const deleteMenu = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this menu',
      });
    }

    // Find and delete the menu
    const menu = await Menu.findOneAndDelete({
      _id: id,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Delete the image from Cloudinary if it exists
    if (menu.image) {
      const publicId = menu.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`foodie/menus/${restaurantId}/${publicId}`);
    }

    res.json({
      status: 'success',
      message: 'Menu deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete menu',
    });
  }
};

// @desc    Add a menu category
// @route   POST /api/restaurants/:restaurantId/menus/:menuId/categories
// @access  Private/Restaurant Owner & Admin
export const addMenuCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, description } = req.body;
    const { menuId, restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add category to this menu',
      });
    }

    // Find the menu
    const menu = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Add the new category
    const newCategory = {
      name,
      description: description || '',
      items: [],
    };

    menu.categories.push(newCategory);
    await menu.save();

    res.status(201).json({
      status: 'success',
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add category',
    });
  }
};

// @desc    Update a menu category
// @route   PUT /api/restaurants/:restaurantId/menus/:menuId/categories/:categoryId
// @access  Private/Restaurant Owner & Admin
export const updateMenuCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, description } = req.body;
    const { menuId, categoryId, restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this category',
      });
    }

    // Find the menu and update the category
    const menu = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Find the category index
    const categoryIndex = menu.categories.findIndex(
      cat => cat._id.toString() === categoryId
    );

    if (categoryIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    // Update category
    if (name) menu.categories[categoryIndex].name = name;
    if (description !== undefined) {
      menu.categories[categoryIndex].description = description;
    }

    await menu.save();

    res.json({
      status: 'success',
      category: menu.categories[categoryIndex],
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update category',
    });
  }
};

// @desc    Delete a menu category
// @route   DELETE /api/restaurants/:restaurantId/menus/:menuId/categories/:categoryId
// @access  Private/Restaurant Owner & Admin
export const deleteMenuCategory = async (req, res) => {
  try {
    const { menuId, categoryId, restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this category',
      });
    }

    // Find the menu and remove the category
    const menu = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Check if category exists and has no items
    const categoryIndex = menu.categories.findIndex(
      cat => cat._id.toString() === categoryId
    );

    if (categoryIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    // Check if category has items
    if (menu.categories[categoryIndex].items.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a category that has items',
      });
    }

    // Remove the category
    menu.categories.splice(categoryIndex, 1);
    await menu.save();

    res.json({
      status: 'success',
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete category',
    });
  }
};

// @desc    Add a menu item
// @route   POST /api/restaurants/:restaurantId/menus/:menuId/items
// @access  Private/Restaurant Owner & Admin
export const addMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      categoryId,
      isVeg,
      isAvailable,
      preparationTime,
      calories,
      ingredients,
      spiceLevel,
    } = req.body;

    const { menuId, restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add items to this menu',
      });
    }

    // Find the menu
    const menu = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    // Handle image upload
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `foodie/menus/${restaurantId}/items`,
      });
      imageUrl = result.secure_url;
    }

    // Create new menu item
    const newItem = {
      name,
      description: description || '',
      price,
      isVeg: isVeg || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      image: imageUrl,
      preparationTime: preparationTime || 15, // Default 15 minutes
      calories: calories || null,
      ingredients: ingredients || [],
      spiceLevel: spiceLevel || 0, // 0 to 3 (mild to very spicy)
    };

    // Add the item to the category
    category.items.push(newItem);
    await menu.save();

    // Populate the new item for the response
    const savedItem = category.items[category.items.length - 1];

    res.status(201).json({
      status: 'success',
      item: savedItem,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add menu item',
    });
  }
};

// @desc    Update a menu item
// @route   PUT /api/restaurants/:restaurantId/menus/:menuId/items/:itemId
// @access  Private/Restaurant Owner & Admin
export const updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      categoryId,
      isVeg,
      isAvailable,
      preparationTime,
      calories,
      ingredients,
      spiceLevel,
    } = req.body;

    const { menuId, itemId, restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this item',
      });
    }

    // Find the menu
    const menu = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Find the item in any category
    let item;
    let itemCategory;
    let itemIndex;

    for (const category of menu.categories) {
      const foundIndex = category.items.findIndex(
        item => item._id.toString() === itemId
      );
      
      if (foundIndex !== -1) {
        itemCategory = category;
        itemIndex = foundIndex;
        item = category.items[foundIndex];
        break;
      }
    }

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found',
      });
    }

    // Handle image upload if a new image is provided
    if (req.file) {
      // Delete old image if exists
      if (item.image) {
        const publicId = item.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(
          `foodie/menus/${restaurantId}/items/${publicId}`
        );
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `foodie/menus/${restaurantId}/items`,
      });
      item.image = result.secure_url;
    }

    // Update item fields
    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (isVeg !== undefined) item.isVeg = isVeg;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (preparationTime !== undefined) item.preparationTime = preparationTime;
    if (calories !== undefined) item.calories = calories;
    if (ingredients !== undefined) item.ingredients = ingredients;
    if (spiceLevel !== undefined) item.spiceLevel = spiceLevel;

    // If category is being changed
    if (categoryId && categoryId !== itemCategory._id.toString()) {
      const newCategory = menu.categories.id(categoryId);
      if (!newCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'New category not found',
        });
      }

      // Remove from old category
      itemCategory.items.splice(itemIndex, 1);
      
      // Add to new category
      newCategory.items.push(item);
    }

    await menu.save();

    res.json({
      status: 'success',
      item,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update menu item',
    });
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/restaurants/:restaurantId/menus/:menuId/items/:itemId
// @access  Private/Restaurant Owner & Admin
export const deleteMenuItem = async (req, res) => {
  try {
    const { menuId, itemId, restaurantId } = req.params;

    // Check if user is the owner of the restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this item',
      });
    }

    // Find the menu
    const menu = await Menu.findOne({
      _id: menuId,
      restaurant: restaurantId,
    });

    if (!menu) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu not found',
      });
    }

    // Find the item in any category
    let itemFound = false;
    let itemImage = '';

    for (const category of menu.categories) {
      const itemIndex = category.items.findIndex(
        item => item._id.toString() === itemId
      );
      
      if (itemIndex !== -1) {
        itemImage = category.items[itemIndex].image;
        category.items.splice(itemIndex, 1);
        itemFound = true;
        break;
      }
    }

    if (!itemFound) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found',
      });
    }

    // Delete the image from Cloudinary if it exists
    if (itemImage) {
      const publicId = itemImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(
        `foodie/menus/${restaurantId}/items/${publicId}`
      );
    }

    await menu.save();

    res.json({
      status: 'success',
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete menu item',
    });
  }
};
