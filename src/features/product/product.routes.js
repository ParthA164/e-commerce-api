import express from 'express';
import ProductController from './product.controller.js';

const productRouter = express.Router();
const productController = new ProductController();

// Public routes for all authenticated users
productRouter.get('/', productController.getAllProducts.bind(productController));
productRouter.get('/search', productController.searchProducts.bind(productController));
productRouter.get('/filter', productController.filterProducts.bind(productController));
productRouter.get('/categories', productController.getAllCategories.bind(productController));
productRouter.get('/:id', productController.getOneProduct.bind(productController));

// Rate product (all authenticated users)
productRouter.post('/rate', productController.rateProduct.bind(productController));

// Seller-specific routes
productRouter.get('/my/products', productController.getMyProducts.bind(productController));

// Seller and Admin routes
productRouter.post('/', productController.addProduct.bind(productController));
productRouter.put('/:id', productController.updateProduct.bind(productController));
productRouter.delete('/:id', productController.deleteProduct.bind(productController));

// Admin-only routes
productRouter.post('/categories', productController.createCategory.bind(productController));

export default productRouter;