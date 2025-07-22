import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    type: {
        type: String,
        enum: ['Customer', 'Seller', 'Admin'],
        default: 'Customer'
    }
}, {
    timestamps: true
});