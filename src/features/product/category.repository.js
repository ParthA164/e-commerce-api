import mongoose from 'mongoose';
import { categorySchema } from './category.schema.js';
import { ApplicationError } from '../../error-handler/applicationError.js';

const CategoryModel = mongoose.model('Category', categorySchema);

export default class CategoryRepository {

    async createCategory(categoryData) {
        try {
            // Check if category already exists
            const existingCategory = await CategoryModel.findOne({ 
                name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') }
            });
            
            if (existingCategory) {
                return existingCategory; // Return existing category instead of creating duplicate
            }

            const newCategory = new CategoryModel(categoryData);
            const savedCategory = await newCategory.save();
            return savedCategory;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getAllCategories() {
        try {
            const categories = await CategoryModel.find({ isActive: true })
                .populate('createdBy', 'name email')
                .sort({ name: 1 });
            return categories;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getCategoryByName(name) {
        try {
            const category = await CategoryModel.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                isActive: true 
            });
            return category;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async updateCategory(id, updateData) {
        try {
            const updatedCategory = await CategoryModel.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            );
            return updatedCategory;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async deleteCategory(id) {
        try {
            // Soft delete - mark as inactive
            const deletedCategory = await CategoryModel.findByIdAndUpdate(
                id, 
                { isActive: false }, 
                { new: true }
            );
            return deletedCategory;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async findOrCreateCategory(categoryName, createdBy) {
        try {
            let category = await this.getCategoryByName(categoryName);
            
            if (!category) {
                category = await this.createCategory({
                    name: categoryName,
                    createdBy: createdBy
                });
            }
            
            return category;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }
}