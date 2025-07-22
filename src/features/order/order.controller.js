import OrderRepository from './order.repository.js';
import UserRepository from '../user/user.repository.js';
import ProductRepository from '../product/product.repository.js';
import CartRepository from '../cartItems/cartItems.repository.js';
import { ApplicationError } from '../../error-handler/applicationError.js';

export default class OrderController {

    constructor() {
        this.orderRepository = new OrderRepository();
        this.userRepository = new UserRepository();
        this.productRepository = new ProductRepository();
        this.cartRepository = new CartRepository();
    }

    // Create order (Customers only)
    async createOrder(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Customer') {
                return res.status(403).send("Only customers can place orders");
            }

            const { items, shippingAddress, paymentMethod, orderNotes } = req.body;

            // Validation
            if (!items || items.length === 0) {
                return res.status(400).send("Order items are required");
            }

            if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
                !shippingAddress.state || !shippingAddress.zipCode) {
                return res.status(400).send("Complete shipping address is required");
            }

            // Process order items
            let totalAmount = 0;
            const processedItems = [];

            for (let item of items) {
                const product = await this.productRepository.get(item.productID);
                
                if (!product) {
                    return res.status(404).send(`Product not found: ${item.productID}`);
                }

                if (product.inStock < item.quantity) {
                    return res.status(400).send(`Insufficient stock for product: ${product.name}`);
                }

                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;

                processedItems.push({
                    product: product._id,
                    seller: product.seller,
                    quantity: item.quantity,
                    price: product.price,
                    totalPrice: itemTotal
                });

                // Update product stock
                await this.productRepository.update(
                    product._id, 
                    { inStock: product.inStock - item.quantity },
                    product.seller.toString(),
                    'Admin' // Override permission for stock update
                );
            }

            // Calculate final amounts
            const taxRate = 0.18; // 18% GST
            const taxAmount = totalAmount * taxRate;
            const shippingCost = totalAmount > 500 ? 0 : 50; // Free shipping above ₹500
            const finalAmount = totalAmount + taxAmount + shippingCost;

            // Create order
            const orderData = {
                customer: req.userID,
                items: processedItems,
                shippingAddress,
                paymentMethod: paymentMethod || 'Cash on Delivery',
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                taxAmount: parseFloat(taxAmount.toFixed(2)),
                shippingCost,
                finalAmount: parseFloat(finalAmount.toFixed(2)),
                orderNotes: orderNotes || '',
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            };

            const createdOrder = await this.orderRepository.createOrder(orderData);

            // Clear user's cart after successful order
            try {
                await this.cartRepository.clearCart(req.userID);
            } catch (error) {
                // Don't fail order creation if cart clearing fails
                console.log("Failed to clear cart:", error);
            }

            res.status(201).send({
                success: true,
                message: "Order placed successfully",
                order: createdOrder
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get single order (Customer can view own, Admin can view all, Seller can view orders containing their products)
    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const user = await this.userRepository.findById(req.userID);
            const order = await this.orderRepository.getOrderById(id);

            // Check permissions
            if (user.type === 'Customer' && order.customer._id.toString() !== req.userID) {
                return res.status(403).send("You can only view your own orders");
            }

            if (user.type === 'Seller') {
                const sellerHasItems = order.items.some(
                    item => item.seller._id.toString() === req.userID
                );
                if (!sellerHasItems) {
                    return res.status(403).send("You can only view orders containing your products");
                }
            }

            res.status(200).send({
                success: true,
                order
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get customer's orders (Customer only)
    async getMyOrders(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Customer') {
                return res.status(403).send("Only customers can access this endpoint");
            }

            const { page = 1, limit = 10, status } = req.query;
            const result = await this.orderRepository.getCustomerOrders(
                req.userID, 
                parseInt(page), 
                parseInt(limit),
                status
            );

            res.status(200).send({
                success: true,
                ...result
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get seller's orders (Seller only)
    async getSellerOrders(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Seller') {
                return res.status(403).send("Only sellers can access this endpoint");
            }

            const { page = 1, limit = 10, status } = req.query;
            const result = await this.orderRepository.getSellerOrders(
                req.userID, 
                parseInt(page), 
                parseInt(limit),
                status
            );

            res.status(200).send({
                success: true,
                message: "Seller orders retrieved successfully",
                ...result
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get all orders (Admin only)
    async getAllOrders(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (user.type !== 'Admin') {
                return res.status(403).send("Only admins can access this endpoint");
            }

            const { page = 1, limit = 10, status } = req.query;
            const result = await this.orderRepository.getAllOrders(
                parseInt(page), 
                parseInt(limit),
                status
            );

            res.status(200).send({
                success: true,
                ...result
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Update order status (Admin can update any, Seller can update their items, Customer can cancel)
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const user = await this.userRepository.findById(req.userID);

            if (!status) {
                return res.status(400).send("Order status is required");
            }

            const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).send("Invalid order status");
            }

            const updatedOrder = await this.orderRepository.updateOrderStatus(
                id, 
                status, 
                req.userID, 
                user.type
            );

            res.status(200).send({
                success: true,
                message: "Order status updated successfully",
                order: updatedOrder
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Cancel order
    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const { cancelReason } = req.body;
            const user = await this.userRepository.findById(req.userID);

            if (!cancelReason) {
                return res.status(400).send("Cancel reason is required");
            }

            const cancelledOrder = await this.orderRepository.cancelOrder(
                id, 
                cancelReason, 
                req.userID, 
                user.type
            );

            res.status(200).send({
                success: true,
                message: "Order cancelled successfully",
                order: cancelledOrder
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            return res.status(500).send("Something went wrong");
        }
    }

    // Get order analytics (Admin for all, Seller for own orders)
    async getOrderAnalytics(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (!['Admin', 'Seller'].includes(user.type)) {
                return res.status(403).send("Access denied. Seller or Admin privileges required.");
            }

            const sellerId = user.type === 'Seller' ? req.userID : null;
            const analytics = await this.orderRepository.getOrderAnalytics(sellerId);

            res.status(200).send({
                success: true,
                analytics
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