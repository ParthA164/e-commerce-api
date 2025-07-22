import CartItemModel from './cartItems.schema.js';
import { ApplicationError } from '../../error-handler/applicationError.js';
import mongoose from 'mongoose';

export default class CartItemRepository {

    async getCartItems(userID) {
        try {
            const cartItems = await CartItemModel.find({ userID })
                .populate({
                    path: 'productID',
                    select: 'name description price inStock seller categories',
                    populate: {
                        path: 'seller',
                        select: 'name email'
                    }
                })
                .populate('userID', 'name email');

            return cartItems;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async addToCart(userID, productID, quantity) {
        try {
            // Check if item already exists in cart
            const existingItem = await CartItemModel.findOne({ userID, productID });

            if (existingItem) {
                // Update quantity if item exists
                existingItem.quantity += quantity;
                const updatedItem = await existingItem.save();
                return await CartItemModel.findById(updatedItem._id)
                    .populate({
                        path: 'productID',
                        select: 'name description price inStock seller',
                        populate: {
                            path: 'seller',
                            select: 'name email'
                        }
                    });
            } else {
                // Create new cart item
                const newCartItem = new CartItemModel({
                    userID,
                    productID,
                    quantity
                });
                
                const savedItem = await newCartItem.save();
                return await CartItemModel.findById(savedItem._id)
                    .populate({
                        path: 'productID',
                        select: 'name description price inStock seller',
                        populate: {
                            path: 'seller',
                            select: 'name email'
                        }
                    });
            }
        } catch (error) {
            console.log(error);
            if (error.code === 11000) {
                throw new ApplicationError("Item already exists in cart", 409);
            }
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async updateCartItem(cartItemID, userID, quantity) {
        try {
            const cartItem = await CartItemModel.findOne({ _id: cartItemID, userID });
            
            if (!cartItem) {
                throw new ApplicationError("Cart item not found", 404);
            }

            cartItem.quantity = quantity;
            const updatedItem = await cartItem.save();
            
            return await CartItemModel.findById(updatedItem._id)
                .populate({
                    path: 'productID',
                    select: 'name description price inStock seller',
                    populate: {
                        path: 'seller',
                        select: 'name email'
                    }
                });
        } catch (error) {
            console.log(error);
            if (error instanceof ApplicationError) {
                throw error;
            }
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async removeFromCart(cartItemID, userID) {
        try {
            const result = await CartItemModel.findOneAndDelete({ _id: cartItemID, userID });
            
            if (!result) {
                throw new ApplicationError("Cart item not found", 404);
            }
            
            return result;
        } catch (error) {
            console.log(error);
            if (error instanceof ApplicationError) {
                throw error;
            }
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async clearCart(userID) {
        try {
            const result = await CartItemModel.deleteMany({ userID });
            return result;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getCartItemById(cartItemID, userID) {
        try {
            const cartItem = await CartItemModel.findOne({ _id: cartItemID, userID })
                .populate({
                    path: 'productID',
                    select: 'name description price inStock seller',
                    populate: {
                        path: 'seller',
                        select: 'name email'
                    }
                });
            
            return cartItem;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }
}