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
  origin: process.env.NODE_ENV === 'production' ? ['*'] : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Dynamic Swagger endpoint - serves swagger.json with correct host and scheme
server.get('/swagger.json', (req, res) => {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  
  const dynamicSwagger = {
    ...apiDocs,
    host: host,
    schemes: [protocol]
  };
  
  res.json(dynamicSwagger);
});

// API Documentation with dynamic configuration
server.use('/api-docs', swagger.serve, swagger.setup(null, {
  swaggerOptions: {
    url: '/swagger.json'  // Points to our dynamic endpoint
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "E-commerce API Documentation"
}));

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

// Health check endpoint (useful for deployment monitoring)
server.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'E-commerce API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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
  console.log(`Health check endpoint: http://localhost:${PORT}/health`);
  
  // Connect to MongoDB
  try {
    await connectUsingMongoose();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
  
  // Only open browser in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      await open(`http://localhost:${PORT}/api-docs`);
      console.log('🌐 API Documentation opened in browser');
    } catch (error) {
      console.log('Could not open browser automatically');
    }
  } else {
    console.log(`🚀 Production server deployed successfully`);
    console.log(`📖 Documentation: https://your-app.onrender.com/api-docs`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});