import service from './service.js';
import { validationResult } from 'express-validator';

class ProductController {
  async getAll(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page, limit, category, search, minPrice, maxPrice, sortBy, sortOrder } = req.query;
      
      const result = await service.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        category,
        search,
        minPrice,
        maxPrice,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      });
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await service.getById(req.params.id);
      
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const product = await service.getBySlug(req.params.slug);
      
      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const products = await service.getFeatured(parseInt(limit));
      
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopSelling(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const products = await service.getTopSelling(parseInt(limit));
      
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await service.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Product created',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await service.update(req.params.id, req.body, req.user?.userId);
      
      res.json({
        success: true,
        message: 'Product updated',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await service.delete(req.params.id, req.user?.userId);
      
      res.json({
        success: true,
        message: 'Product deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  async archive(req, res, next) {
    try {
      await service.archive(req.params.id, req.user?.userId);
      
      res.json({
        success: true,
        message: 'Product archived',
      });
    } catch (error) {
      next(error);
    }
  }

  async restore(req, res, next) {
    try {
      await service.restore(req.params.id, req.user?.userId);
      
      res.json({
        success: true,
        message: 'Product restored',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const product = await service.toggleStatus(req.params.id, req.user?.userId);
      
      res.json({
        success: true,
        message: `Product ${product.isActive ? 'activated' : 'deactivated'}`,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkAction(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productIds, action } = req.body;
      const result = await service.bulkUpdate(productIds, action, req.user?.userId);
      
      res.json({
        success: true,
        message: `Bulk action "${action}" completed`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkStock(req, res, next) {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'items array is required' });
      }

      const results = await service.checkStockForItems(items);
      
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
