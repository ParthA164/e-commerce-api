import ProductRepository from './product.repository.js';
import CategoryRepository from './category.repository.js';
import { ApplicationError } from '../../error-handler/applicationError.js';
import UserRepository from '../user/user.repository.js';

export default class ProductController {

    constructor() {
        this.productRepository = new ProductRepository();
        this.categoryRepository = new CategoryRepository();
        this.userRepository = new UserRepository();
    }

    // Get all products (accessible to all authenticated users)
    async getAllProducts(req, res) {
        try {
            const products = await this.productRepository.getAll();
            res.status(200).send({
                success: true,
                count: products.length,
                products
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Add product (Sellers and Admins only)
    async addProduct(req, res) {
        try {
            const { name, price, inStock, categories, description } = req.body;
            const user = await this.userRepository.findById(req.userID);

            // Check user role
            if (!['Seller', 'Admin'].includes(user.type)) {
                return res.status(403).send("Only sellers and admins can add products");
            }

            // Validation
            if (!name || !price || !description) {
                return res.status(400).send("Name, price, and description are required");
            }

            if (!categories || categories.length === 0) {
                return res.status(400).send("At least one category is required");
            }

            const productData = {
                name,
                description,
                price: parseFloat(price),
                inStock: parseInt(inStock) || 0,
                categories: Array.isArray(categories) ? categories : [categories]
            };

            const createdProduct = await this.productRepository.add(productData, req.userID, user.type);
            res.status(201).send({
                success: true,
                message: "Product created successfully",
                product: createdProduct
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get single product (accessible to all authenticated users)
    async getOneProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await this.productRepository.get(id);
            
            res.status(200).send({
                success: true,
                product
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Update product (Only product owner or Admin)
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const user = await this.userRepository.findById(req.userID);

            // Convert price to number if provided
            if (updateData.price) {
                updateData.price = parseFloat(updateData.price);
            }
            if (updateData.inStock !== undefined) {
                updateData.inStock = parseInt(updateData.inStock);
            }

            const updatedProduct = await this.productRepository.update(id, updateData, req.userID, user.type);
            
            res.status(200).send({
                success: true,
                message: "Product updated successfully",
                product: updatedProduct
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Delete product (Only product owner or Admin)
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const user = await this.userRepository.findById(req.userID);

            await this.productRepository.delete(id, req.userID, user.type);
            
            res.status(200).send({
                success: true,
                message: "Product deleted successfully"
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get seller's own products (Sellers only)
    async getMyProducts(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Seller') {
                return res.status(403).send("Only sellers can access this endpoint");
            }

            const products = await this.productRepository.getMyProducts(req.userID);
            
            res.status(200).send({
                success: true,
                count: products.length,
                products
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Rate product (All authenticated users)
    async rateProduct(req, res) {
        try {
            const { productID, rating } = req.body;

            if (!productID || !rating) {
                return res.status(400).send("Product ID and rating are required");
            }

            await this.productRepository.rate(req.userID, productID, rating);
            return res.status(200).send({
                success: true,
                message: "Rating added successfully"
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Filter products (All authenticated users)
    async filterProducts(req, res) {
        try {
            const { minPrice, maxPrice, categories } = req.query;
            const products = await this.productRepository.filter(minPrice, maxPrice, categories);
            
            res.status(200).send({
                success: true,
                count: products.length,
                products
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Search products (All authenticated users)
    async searchProducts(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).send("Search query is required");
            }

            const products = await this.productRepository.searchProducts(q);
            
            res.status(200).send({
                success: true,
                query: q,
                count: products.length,
                products
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get all categories (All authenticated users)
    async getAllCategories(req, res) {
        try {
            const categories = await this.categoryRepository.getAllCategories();
            res.status(200).send({
                success: true,
                count: categories.length,
                categories
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Create category (Admins only)
    async createCategory(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Admin') {
                return res.status(403).send("Only admins can create categories");
            }

            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).send("Category name is required");
            }

            const categoryData = {
                name,
                description: description || '',
                createdBy: req.userID
            };

            const category = await this.categoryRepository.createCategory(categoryData);
            res.status(201).send({
                success: true,
                message: "Category created successfully",
                category
            });
        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }
}