import express from 'express';
import OrderController from './order.controller.js';

const orderRouter = express.Router();
const orderController = new OrderController();

// Create order (Customers only)
orderRouter.post('/', orderController.createOrder.bind(orderController));

// Get customer's own orders (Customers only)
orderRouter.get('/my-orders', orderController.getMyOrders.bind(orderController));

// Get seller's orders (Sellers only)
orderRouter.get('/seller-orders', orderController.getSellerOrders.bind(orderController));

// Get all orders (Admin only)
orderRouter.get('/all', orderController.getAllOrders.bind(orderController));

// Get order analytics (Admin and Sellers)
orderRouter.get('/analytics', orderController.getOrderAnalytics.bind(orderController));

// Get single order by ID
orderRouter.get('/:id', orderController.getOrderById.bind(orderController));

// Update order status
orderRouter.put('/:id/status', orderController.updateOrderStatus.bind(orderController));

// Cancel order
orderRouter.put('/:id/cancel', orderController.cancelOrder.bind(orderController));

export default orderRouter;