import express from 'express';
import cors from 'cors';
import swagger from 'swagger-ui-express';
import apiDocs from './swagger.json' with { type: "json" };
import jwtAuth from './src/middlewares/jwt.middleware.js';
import userRouter from './src/features/user/user.routes.js';
import productRouter from './src/features/product/product.routes.js';
import cartRouter from './src/features/cartItems/cartItems.routes.js';
import orderRouter from './src/features/order/order.routes.js';
import likeRouter from './src/features/like/like.routes.js';
import loggerMiddleware from './src/middlewares/logger.middleware.js';
import { ApplicationError } from './src/error-handler/applicationError.js';
import { connectUsingMongoose } from './src/config/mongooseConfig.js';
import mongoose from 'mongoose';
import open from 'open';

const server = express();

// Get port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// CORS configuration
server.use(cors({
  origin: '*',  // In production, specify your frontend domains
  credentials: true
}));

server.use(express.urlencoded({ extended: true }));

// Handle preflight requests
server.use((req, res, next) => {
  if (req.method == 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

server.use(express.json());

// API Documentation
server.use('/api-docs', swagger.serve, swagger.setup(apiDocs));

// Routes
server.use(loggerMiddleware);
server.use('/api/orders', jwtAuth, orderRouter);
server.use('/api/products', jwtAuth, productRouter);
server.use('/api/cartItems', jwtAuth, cartRouter);
server.use('/api/users', userRouter);
server.use('/api/likes', jwtAuth, likeRouter);

// Redirect root to API docs
server.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Error handler middleware
server.use((err, req, res, next) => {
  console.log(err);
  if(err instanceof mongoose.Error.ValidationError){
    return res.status(400).send(err.message);
  }
  if (err instanceof ApplicationError) {
    return res.status(err.code).send(err.message);
  }
  res.status(500).send('Something went wrong, please try later');
});

// 404 handler
server.use((req, res) => {
  res.status(404).send('API not found. Please check our documentation for more information at /api-docs');
});

// Start server
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at: http://localhost:${PORT}/api-docs`);
  
  // Connect to MongoDB
  await connectUsingMongoose();
  
  // Only open browser in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      await open(`http://localhost:${PORT}/api-docs`);
      console.log('API Documentation opened in browser');
    } catch (error) {
      console.log('Could not open browser automatically');
    }
  }
});