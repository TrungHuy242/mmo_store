import service from './service.js';
import { validationResult } from 'express-validator';

class OrderController {
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await service.create(req.body, req.user.userId);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await service.getById(req.params.id);
      
      // Check ownership if customer
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByOrderNumber(req, res, next) {
    try {
      const order = await service.getByOrderNumber(req.params.orderNumber);
      
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      
      const result = await service.getUserOrders(req.user.userId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
      });
      
      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const { page, limit, status, userId, search, startDate, endDate } = req.query;
      
      const result = await service.getAllOrders({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        userId,
        search,
        startDate,
        endDate,
      });
      
      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, note } = req.body;
      const order = await service.updateStatus(req.params.id, status, note, req.user.userId);
      
      res.json({
        success: true,
        message: 'Order status updated',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async addNote(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { note } = req.body;
      const order = await service.addNote(req.params.id, note, req.user.userId);
      
      res.json({
        success: true,
        message: 'Note added',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await service.getStatistics(startDate, endDate);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderStatus(req, res, next) {
    try {
      const order = await service.getById(req.params.id);
      
      if (req.user.role === 'CUSTOMER' && order.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json({
        success: true,
        data: {
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
