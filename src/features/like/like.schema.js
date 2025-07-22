import mongoose from 'mongoose';

export const likeSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likeableType: {
        type: String,
        required: true,
        enum: ['Product', 'Category']
    },
    likeableID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'likeableType'
    }
}, {
    timestamps: true
});

// Create compound index to prevent duplicate likes
likeSchema.index({ userID: 1, likeableType: 1, likeableID: 1 }, { unique: true });

const LikeModel = mongoose.model('Like', likeSchema);
export default LikeModel;