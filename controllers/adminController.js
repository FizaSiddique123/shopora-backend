/**
 * Admin Controller
 * 
 * PROBLEM IT SOLVES: Provides admin dashboard functionality including
 * analytics, statistics, and management operations.
 * 
 * REAL-WORLD: Admin dashboards are essential for e-commerce operations.
 * Companies need:
 * - Sales analytics
 * - User management
 * - Product management
 * - Order management
 * - Performance metrics
 */

import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 * 
 * REAL-WORLD: Admin dashboard needs quick stats overview.
 * Returns key metrics for business insights.
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Total products
    const totalProducts = await Product.countDocuments();
    const outOfStockProducts = await Product.countDocuments({ inStock: false });

    // Total orders
    const totalOrders = await Order.countDocuments();
    
    // Orders by status
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });

    // Sales statistics
    const totalSales = await Order.aggregate([
      {
        $match: { isPaid: true }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const salesData = totalSales.length > 0 ? totalSales[0] : { totalSales: 0, totalOrders: 0 };

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('totalPrice orderStatus createdAt user');

    // Monthly sales (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top selling products (by quantity sold)
    const topProducts = await Order.aggregate([
      {
        $unwind: '$orderItems'
      },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: '$product.name',
          productImage: { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1,
          revenue: 1
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          outOfStockProducts,
          totalOrders,
          totalSales: salesData.totalSales,
          totalRevenue: salesData.totalSales
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders
        },
        recentOrders,
        monthlySales,
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 * 
 * REAL-WORLD: Admin needs to view and manage all users.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's orders count
    const ordersCount = await Order.countDocuments({ user: user._id });

    // Get user's total spent
    const totalSpent = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user._id),
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          ordersCount,
          totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user (Admin)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 * 
 * REAL-WORLD: Admin may need to update user details, roles, etc.
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, isEmailVerified } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 * 
 * REAL-WORLD: Admin may need to delete users (with caution).
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};







