import express from 'express';
import LikeController from './like.controller.js';

const likeRouter = express.Router();
const likeController = new LikeController();

// Get likes for an entity
likeRouter.get('/', likeController.getLikes.bind(likeController));

// Toggle like (like/unlike)
likeRouter.post('/', likeController.toggleLike.bind(likeController));

// Get user's liked items
likeRouter.get('/my-likes', likeController.getUserLikes.bind(likeController));

export default likeRouter;