import CartItemRepository from './cartItems.repository.js';
import ProductRepository from '../product/product.repository.js';
import UserRepository from '../user/user.repository.js';
import { ApplicationError } from '../../error-handler/applicationError.js';

export default class CartItemController {

    constructor() {
        this.cartRepository = new CartItemRepository();
        this.productRepository = new ProductRepository();
        this.userRepository = new UserRepository();
    }

    async getCartItems(req, res) {
        try {
            const cartItems = await this.cartRepository.getCartItems(req.userID);
            
            // Calculate total amount
            let totalAmount = 0;
            cartItems.forEach(item => {
                if (item.productID) {
                    totalAmount += item.productID.price * item.quantity;
                }
            });

            res.status(200).send({
                success: true,
                count: cartItems.length,
                totalAmount,
                cartItems
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    async addToCart(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Customer') {
                return res.status(403).send("Only customers can add items to cart");
            }

            const { productID, quantity = 1 } = req.body;

            if (!productID) {
                return res.status(400).send("Product ID is required");
            }

            if (quantity < 1) {
                return res.status(400).send("Quantity must be at least 1");
            }

            // Check if product exists and is active
            const product = await this.productRepository.get(productID);
            if (!product) {
                return res.status(404).send("Product not found");
            }

            if (!product.isActive) {
                return res.status(400).send("Product is not available");
            }

            if (product.inStock < quantity) {
                return res.status(400).send(`Only ${product.inStock} items available in stock`);
            }

            const cartItem = await this.cartRepository.addToCart(req.userID, productID, parseInt(quantity));

            res.status(201).send({
                success: true,
                message: "Item added to cart successfully",
                cartItem
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    async updateCartItem(req, res) {
        try {
            const { id } = req.params;
            const { quantity } = req.body;

            if (!quantity || quantity < 1) {
                return res.status(400).send("Valid quantity is required");
            }

            // Check if cart item exists and belongs to user
            const existingCartItem = await this.cartRepository.getCartItemById(id, req.userID);
            if (!existingCartItem) {
                return res.status(404).send("Cart item not found");
            }

            // Check if enough stock is available
            if (existingCartItem.productID.inStock < quantity) {
                return res.status(400).send(`Only ${existingCartItem.productID.inStock} items available in stock`);
            }

            const updatedCartItem = await this.cartRepository.updateCartItem(id, req.userID, parseInt(quantity));

            res.status(200).send({
                success: true,
                message: "Cart item updated successfully",
                cartItem: updatedCartItem
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    async removeFromCart(req, res) {
        try {
            const { id } = req.params;

            const result = await this.cartRepository.removeFromCart(id, req.userID);

            res.status(200).send({
                success: true,
                message: "Item removed from cart successfully"
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    async clearCart(req, res) {
        try {
            await this.cartRepository.clearCart(req.userID);

            res.status(200).send({
                success: true,
                message: "Cart cleared successfully"
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