import mongoose from 'mongoose';

export const cartItemSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, {
    timestamps: true
});

// Create compound index to prevent duplicate cart items
cartItemSchema.index({ userID: 1, productID: 1 }, { unique: true });

const CartItemModel = mongoose.model('CartItem', cartItemSchema);
export default CartItemModel;