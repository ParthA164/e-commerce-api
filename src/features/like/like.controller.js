import LikeRepository from './like.repository.js';
import ProductRepository from '../product/product.repository.js';
import { ApplicationError } from '../../error-handler/applicationError.js';

export default class LikeController {

    constructor() {
        this.likeRepository = new LikeRepository();
        this.productRepository = new ProductRepository();
    }

    async getLikes(req, res) {
        try {
            const { type, id } = req.query;

            if (!type || !id) {
                return res.status(400).send("Type and ID parameters are required");
            }

            if (!['Product', 'Category'].includes(type)) {
                return res.status(400).send("Type must be 'Product' or 'Category'");
            }

            // Check if entity exists
            if (type === 'Product') {
                const product = await this.productRepository.get(id);
                if (!product) {
                    return res.status(404).send("Product not found");
                }
            }

            const likes = await this.likeRepository.getLikes(type, id);
            const likeCount = await this.likeRepository.getLikeCount(type, id);
            const userHasLiked = await this.likeRepository.checkUserLike(req.userID, type, id);

            res.status(200).send({
                success: true,
                entityId: id,
                entityType: type,
                likeCount,
                userHasLiked,
                likes: likes.map(like => ({
                    _id: like.userID._id,
                    name: like.userID.name,
                    email: like.userID.email,
                    likedAt: like.createdAt
                }))
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    async toggleLike(req, res) {
        try {
            const { id, type } = req.query;

            if (!id || !type) {
                return res.status(400).send("ID and type parameters are required");
            }

            if (!['Product', 'Category'].includes(type)) {
                return res.status(400).send("Type must be 'Product' or 'Category'");
            }

            // Verify entity exists
            if (type === 'Product') {
                const product = await this.productRepository.get(id);
                if (!product) {
                    return res.status(404).send("Product not found");
                }
            }

            const result = await this.likeRepository.toggleLike(req.userID, type, id);

            res.status(200).send({
                success: true,
                message: result.message,
                liked: result.liked,
                action: result.action
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    async getUserLikes(req, res) {
        try {
            const { type } = req.query;

            const likes = await this.likeRepository.getUserLikes(req.userID, type);

            res.status(200).send({
                success: true,
                count: likes.length,
                likes
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