import mongoose from 'mongoose';
import { productSchema } from './product.schema.js';
import { ApplicationError } from '../../error-handler/applicationError.js';
import CategoryRepository from './category.repository.js';

const ProductModel = mongoose.model('Product', productSchema);

export default class ProductRepository {

    constructor() {
        this.categoryRepository = new CategoryRepository();
    }

    async add(productData, userID, userType) {
        try {
            // Only sellers and admins can add products
            if (!['Seller', 'Admin'].includes(userType)) {
                throw new ApplicationError("Only sellers and admins can add products", 403);
            }

            // Handle categories - create if they don't exist
            const categoryIds = [];
            if (productData.categories && productData.categories.length > 0) {
                for (let categoryName of productData.categories) {
                    const category = await this.categoryRepository.findOrCreateCategory(categoryName, userID);
                    categoryIds.push(category._id);
                }
            }

            // Create product with category references
            const newProductData = {
                ...productData,
                categories: categoryIds,
                seller: userID
            };

            const newProduct = new ProductModel(newProductData);
            const savedProduct = await newProduct.save();
            
            // Populate categories and seller info
            const populatedProduct = await ProductModel.findById(savedProduct._id)
                .populate('categories', 'name description')
                .populate('seller', 'name email');
                
            return populatedProduct;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getAll() {
        try {
            const products = await ProductModel.find({ isActive: true })
                .populate('categories', 'name description')
                .populate('seller', 'name email type')
                .populate('ratings.userID', 'name');
            return products;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async get(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApplicationError("Invalid product ID", 400);
            }
            
            const product = await ProductModel.findOne({ _id: id, isActive: true })
                .populate('categories', 'name description')
                .populate('seller', 'name email type')
                .populate('ratings.userID', 'name');
                
            if (!product) {
                throw new ApplicationError("Product not found", 404);
            }
            return product;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async update(id, updateData, userID, userType) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApplicationError("Invalid product ID", 400);
            }

            const product = await ProductModel.findOne({ _id: id, isActive: true });
            if (!product) {
                throw new ApplicationError("Product not found", 404);
            }

            // Only the seller who created the product or admin can update
            if (userType !== 'Admin' && product.seller.toString() !== userID) {
                throw new ApplicationError("You can only update your own products", 403);
            }

            // Handle category updates
            if (updateData.categories && updateData.categories.length > 0) {
                const categoryIds = [];
                for (let categoryName of updateData.categories) {
                    const category = await this.categoryRepository.findOrCreateCategory(categoryName, userID);
                    categoryIds.push(category._id);
                }
                updateData.categories = categoryIds;
            }

            const updatedProduct = await ProductModel.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            )
            .populate('categories', 'name description')
            .populate('seller', 'name email');

            return updatedProduct;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async delete(id, userID, userType) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApplicationError("Invalid product ID", 400);
            }

            const product = await ProductModel.findOne({ _id: id, isActive: true });
            if (!product) {
                throw new ApplicationError("Product not found", 404);
            }

            // Only the seller who created the product or admin can delete
            if (userType !== 'Admin' && product.seller.toString() !== userID) {
                throw new ApplicationError("You can only delete your own products", 403);
            }

            // Soft delete
            await ProductModel.findByIdAndUpdate(id, { isActive: false });
            return { message: "Product deleted successfully" };
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getMyProducts(userID) {
        try {
            const products = await ProductModel.find({ 
                seller: userID, 
                isActive: true 
            })
            .populate('categories', 'name description')
            .populate('ratings.userID', 'name');
            return products;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async filter(minPrice, maxPrice, categories) {
        try {
            let filterExpression = { isActive: true };
            
            // Price filters
            if (minPrice || maxPrice) {
                filterExpression.price = {};
                if (minPrice) {
                    filterExpression.price.$gte = parseFloat(minPrice);
                }
                if (maxPrice) {
                    filterExpression.price.$lte = parseFloat(maxPrice);
                }
            }
            
            // Category filter
            if (categories) {
                const categoryNames = categories.split(',').map(cat => cat.trim());
                const categoryDocs = await this.categoryRepository.getAllCategories();
                const categoryIds = categoryDocs
                    .filter(cat => categoryNames.some(name => 
                        cat.name.toLowerCase().includes(name.toLowerCase())
                    ))
                    .map(cat => cat._id);
                    
                if (categoryIds.length > 0) {
                    filterExpression.categories = { $in: categoryIds };
                }
            }
            
            const products = await ProductModel.find(filterExpression)
                .populate('categories', 'name description')
                .populate('seller', 'name email type');
            return products;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async rate(userID, productID, rating) {
        try {
            if (!mongoose.Types.ObjectId.isValid(productID)) {
                throw new ApplicationError("Invalid product ID", 400);
            }
            if (rating < 1 || rating > 5) {
                throw new ApplicationError("Rating must be between 1 and 5", 400);
            }

            const product = await ProductModel.findOne({ _id: productID, isActive: true });
            if (!product) {
                throw new ApplicationError("Product not found", 404);
            }

            // Check if user has already rated this product
            const existingRatingIndex = product.ratings.findIndex(
                r => r.userID.toString() === userID.toString()
            );

            if (existingRatingIndex !== -1) {
                // Update existing rating
                product.ratings[existingRatingIndex].rating = rating;
            } else {
                // Add new rating
                product.ratings.push({
                    userID: userID,
                    rating: rating
                });
            }

            await product.save();
            return { message: "Product rated successfully" };
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async searchProducts(searchTerm) {
        try {
            const products = await ProductModel.find({
                isActive: true,
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            })
            .populate('categories', 'name description')
            .populate('seller', 'name email type');
            return products;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }
}