import express from 'express';
import CartItemController from './cartItems.controller.js';

const cartRouter = express.Router();
const cartItemController = new CartItemController();

// Get cart items
cartRouter.get('/', cartItemController.getCartItems.bind(cartItemController));

// Add to cart
cartRouter.post('/', cartItemController.addToCart.bind(cartItemController));

// Update cart item
cartRouter.put('/:id', cartItemController.updateCartItem.bind(cartItemController));

// Remove from cart
cartRouter.delete('/:id', cartItemController.removeFromCart.bind(cartItemController));

// Clear cart
cartRouter.delete('/', cartItemController.clearCart.bind(cartItemController));

export default cartRouter;