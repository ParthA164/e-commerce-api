import LikeModel from './like.schema.js';
import { ApplicationError } from '../../error-handler/applicationError.js';

export default class LikeRepository {

    async getLikes(likeableType, likeableID) {
        try {
            const likes = await LikeModel.find({ likeableType, likeableID })
                .populate('userID', 'name email')
                .sort({ createdAt: -1 });

            return likes;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async toggleLike(userID, likeableType, likeableID) {
        try {
            const existingLike = await LikeModel.findOne({
                userID,
                likeableType,
                likeableID
            });

            if (existingLike) {
                // Unlike
                await LikeModel.findByIdAndDelete(existingLike._id);
                return {
                    message: "Unliked successfully",
                    liked: false,
                    action: "unliked"
                };
            } else {
                // Like
                const newLike = new LikeModel({
                    userID,
                    likeableType,
                    likeableID
                });
                await newLike.save();
                return {
                    message: "Liked successfully",
                    liked: true,
                    action: "liked"
                };
            }
        } catch (error) {
            console.log(error);
            if (error.code === 11000) {
                throw new ApplicationError("Duplicate like detected", 409);
            }
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getUserLikes(userID, likeableType = null) {
        try {
            const filter = { userID };
            if (likeableType) {
                filter.likeableType = likeableType;
            }

            const likes = await LikeModel.find(filter)
                .populate('likeableID')
                .sort({ createdAt: -1 });

            return likes;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async checkUserLike(userID, likeableType, likeableID) {
        try {
            const like = await LikeModel.findOne({
                userID,
                likeableType,
                likeableID
            });

            return !!like;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getLikeCount(likeableType, likeableID) {
        try {
            const count = await LikeModel.countDocuments({
                likeableType,
                likeableID
            });

            return count;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }
}