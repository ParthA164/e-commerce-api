import mongoose from 'mongoose';
import { orderSchema } from './order.schema.js';
import { ApplicationError } from '../../error-handler/applicationError.js';

const OrderModel = mongoose.model('Order', orderSchema);

export default class OrderRepository {

    async createOrder(orderData) {
        try {
            const newOrder = new OrderModel(orderData);
            const savedOrder = await newOrder.save();
            
            // Populate order details
            const populatedOrder = await OrderModel.findById(savedOrder._id)
                .populate('customer', 'name email')
                .populate('items.product', 'name description price categories')
                .populate('items.seller', 'name email');
                
            return populatedOrder;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getOrderById(orderId) {
        try {
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                throw new ApplicationError("Invalid order ID", 400);
            }

            const order = await OrderModel.findById(orderId)
                .populate('customer', 'name email type')
                .populate('items.product', 'name description price categories')
                .populate('items.seller', 'name email');

            if (!order) {
                throw new ApplicationError("Order not found", 404);
            }

            return order;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getCustomerOrders(customerId, page = 1, limit = 10, status = null) {
        try {
            const skip = (page - 1) * limit;
            let query = { customer: customerId };
            
            if (status) {
                query.orderStatus = status;
            }

            const orders = await OrderModel.find(query)
                .populate('items.product', 'name description price')
                .populate('items.seller', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalOrders = await OrderModel.countDocuments(query);

            return {
                orders,
                totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit)
            };
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getSellerOrders(sellerId, page = 1, limit = 10, status = null) {
        try {
            const skip = (page - 1) * limit;
            let matchStage = { 'items.seller': new mongoose.Types.ObjectId(sellerId) };
            
            if (status) {
                matchStage.orderStatus = status;
            }

            const orders = await OrderModel.aggregate([
                { $match: matchStage },
                {
                    $addFields: {
                        items: {
                            $filter: {
                                input: '$items',
                                cond: { $eq: ['$$this.seller', new mongoose.Types.ObjectId(sellerId)] }
                            }
                        }
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customer',
                        foreignField: '_id',
                        as: 'customer',
                        pipeline: [{ $project: { name: 1, email: 1 } }]
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: '$customer' }
            ]);

            const totalCount = await OrderModel.countDocuments({ 'items.seller': sellerId });

            return {
                orders,
                totalOrders: totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            };
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getAllOrders(page = 1, limit = 10, status = null) {
        try {
            const skip = (page - 1) * limit;
            let query = {};
            
            if (status) {
                query.orderStatus = status;
            }

            const orders = await OrderModel.find(query)
                .populate('customer', 'name email type')
                .populate('items.product', 'name description price')
                .populate('items.seller', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalOrders = await OrderModel.countDocuments(query);

            return {
                orders,
                totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit)
            };
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async updateOrderStatus(orderId, newStatus, updatedBy, userType) {
        try {
            const order = await this.getOrderById(orderId);

            // Check permissions
            if (userType === 'Customer' && order.customer._id.toString() !== updatedBy) {
                throw new ApplicationError("You can only update your own orders", 403);
            }

            // Customers can only cancel orders
            if (userType === 'Customer' && newStatus !== 'Cancelled') {
                throw new ApplicationError("Customers can only cancel orders", 403);
            }

            // Prevent cancellation of delivered orders
            if (newStatus === 'Cancelled' && order.orderStatus === 'Delivered') {
                throw new ApplicationError("Cannot cancel delivered orders", 400);
            }

            const updateData = { orderStatus: newStatus };
            
            // Set timestamps based on status
            if (newStatus === 'Delivered') {
                updateData.deliveredAt = new Date();
            } else if (newStatus === 'Cancelled') {
                updateData.cancelledAt = new Date();
            }

            const updatedOrder = await OrderModel.findByIdAndUpdate(
                orderId,
                updateData,
                { new: true }
            ).populate('customer', 'name email')
             .populate('items.product', 'name description price')
             .populate('items.seller', 'name email');

            return updatedOrder;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async cancelOrder(orderId, cancelReason, userId, userType) {
        try {
            const order = await this.getOrderById(orderId);

            // Check permissions
            if (userType === 'Customer' && order.customer._id.toString() !== userId) {
                throw new ApplicationError("You can only cancel your own orders", 403);
            }

            // Check if order can be cancelled
            if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
                throw new ApplicationError("Cannot cancel this order", 400);
            }

            const updatedOrder = await OrderModel.findByIdAndUpdate(
                orderId,
                {
                    orderStatus: 'Cancelled',
                    cancelReason: cancelReason,
                    cancelledAt: new Date()
                },
                { new: true }
            ).populate('customer', 'name email')
             .populate('items.product', 'name description price')
             .populate('items.seller', 'name email');

            return updatedOrder;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getOrderAnalytics(sellerId = null) {
        try {
            let matchStage = {};
            if (sellerId) {
                matchStage = { 'items.seller': new mongoose.Types.ObjectId(sellerId) };
            }

            const analytics = await OrderModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$finalAmount' },
                        avgOrderValue: { $avg: '$finalAmount' },
                        statusBreakdown: {
                            $push: '$orderStatus'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalRevenue: { $round: ['$totalRevenue', 2] },
                        avgOrderValue: { $round: ['$avgOrderValue', 2] },
                        statusBreakdown: 1
                    }
                }
            ]);

            return analytics.length > 0 ? analytics[0] : {
                totalOrders: 0,
                totalRevenue: 0,
                avgOrderValue: 0,
                statusBreakdown: []
            };
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }
}