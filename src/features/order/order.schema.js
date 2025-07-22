import mongoose from "mongoose";

export const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'India' }
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery', 'UPI'],
        default: 'Cash on Delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderNotes: {
        type: String,
        default: ''
    },
    trackingNumber: {
        type: String,
        default: ''
    },
    estimatedDelivery: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    cancelReason: {
        type: String
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });