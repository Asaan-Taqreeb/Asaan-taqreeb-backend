const categoryService = require('../service/category.service');
const CategoryRequest = require('../model/categoryRequest.model');

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
};

const getCategoryByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const category = await categoryService.getCategoryByKey(key);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in getCategoryByKey:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { key, name, description, icon, color, backgroundColor, sortOrder, active } = req.body;

    if (!key || !name || !icon || !color || !backgroundColor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: key, name, icon, color, backgroundColor',
      });
    }

    const category = await categoryService.createCategory({
      key,
      name,
      description,
      icon,
      color,
      backgroundColor,
      sortOrder,
      active,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Category key already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create category',
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await categoryService.updateCategory(id, updateData);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.deleteCategory(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category',
    });
  }
};

const requestCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim() || !description?.trim()) return res.status(400).json({ success: false, error: 'name and description are required' });
    const request = await CategoryRequest.create({ vendor: req.user.id, name, description });
    res.status(201).json({ success: true, data: request });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to submit category request' }); }
};

module.exports = {
  getAllCategories,
  getCategoryByKey,
  createCategory,
  updateCategory,
  deleteCategory,
  requestCategory,
};
