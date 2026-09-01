const Category = require('../model/category.model');

const getAllCategories = async () => {
  try {
    const categories = await Category.find({ active: true })
      .sort({ sortOrder: 1 })
      .lean();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

const getCategoryByKey = async (key) => {
  try {
    const category = await Category.findOne({ key: key.toLowerCase(), active: true }).lean();
    return category;
  } catch (error) {
    console.error('Error fetching category by key:', error);
    throw error;
  }
};

const createCategory = async (categoryData) => {
  try {
    const category = new Category({
      key: categoryData.key.toLowerCase(),
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      color: categoryData.color,
      backgroundColor: categoryData.backgroundColor,
      sortOrder: categoryData.sortOrder || 0,
      active: categoryData.active !== false,
    });
    await category.save();
    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

const updateCategory = async (id, updateData) => {
  try {
    const category = await Category.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    return category;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

const deleteCategory = async (id) => {
  try {
    const result = await Category.findByIdAndDelete(id);
    return result;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryByKey,
  createCategory,
  updateCategory,
  deleteCategory,
};
