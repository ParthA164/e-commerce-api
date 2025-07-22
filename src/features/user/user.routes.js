import express from 'express';
import UserController from './user.controller.js';
import jwtAuth from '../../middlewares/jwt.middleware.js';
import adminAuth from '../../middlewares/admin.middleware.js';

const userRouter = express.Router();
const userController = new UserController();

// Public routes
userRouter.post('/signin', userController.signIn.bind(userController));
userRouter.post('/signup', userController.signUp.bind(userController));

// Protected routes
userRouter.get('/profile', jwtAuth, userController.getProfile.bind(userController));
userRouter.get('/all', jwtAuth, adminAuth, userController.getAllUsers.bind(userController)); // Admin only
userRouter.get('/:id', jwtAuth, userController.getUserById.bind(userController));
userRouter.put('/:id', jwtAuth, userController.updateUser.bind(userController));
userRouter.delete('/:id', jwtAuth, userController.deleteUser.bind(userController));

export default userRouter;