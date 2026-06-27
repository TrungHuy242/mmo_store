import prisma from '../../database/prisma.js';
import slugify from 'slugify';

class ProductRepository {
  async findById(id, includeRelations = true) {
    const query = {
      where: { id },
    };
    
    if (includeRelations) {
      query.include = {
        category: true,
        assets: { where: { isActive: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,
            user: { select: { username: true, fullName: true } },
          },
        },
      };
    }
    
    return prisma.product.findFirst({
      ...query,
      where: { id },
    });
  }

  async findBySlug(slug) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        assets: { where: { isActive: true } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true, fullName: true } },
          },
        },
      },
    });
  }

  async findAll({
    page = 1,
    limit = 20,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeArchived = false,
  }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (category) {
      where.categoryId = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    if (!includeArchived) {
      where.isArchived = false;
      where.isActive = true;
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);
    
    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data) {
    const slug = slugify(data.name, {
      lower: true,
      strict: true,
      trim: true,
    });
    
    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;
    
    return prisma.product.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        shortDesc: data.shortDesc,
        categoryId: data.categoryId,
        price: data.price,
        originalPrice: data.originalPrice,
        costPrice: data.costPrice,
        stock: data.stock || 0,
        lowStockThreshold: data.lowStockThreshold || 5,
        unlimitedStock: data.unlimitedStock || false,
        images: data.images,
        thumbnail: data.thumbnail,
        productType: data.productType || 'digital',
        autoDelivery: data.autoDelivery ?? true,
        deliveryInstructions: data.deliveryInstructions,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        isFeatured: data.isFeatured || false,
        isActive: data.isActive ?? true,
      },
      include: { category: true },
    });
  }

  async update(id, data) {
    const updateData = {};
    
    if (data.name !== undefined) {
      const slug = slugify(data.name, { lower: true, strict: true });
      updateData.name = data.name;
      updateData.slug = slug;
    }
    
    if (data.price !== undefined) updateData.price = data.price;
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDesc !== undefined) updateData.metaDesc = data.metaDesc;
    
    return prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async delete(id) {
    return prisma.product.delete({ where: { id } });
  }

  async archive(id) {
    return prisma.product.update({
      where: { id },
      data: { isArchived: true, isActive: false },
    });
  }

  async restore(id) {
    return prisma.product.update({
      where: { id },
      data: { isArchived: false, isActive: true },
    });
  }

  async incrementViewCount(id) {
    return prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementSalesCount(id, quantity = 1) {
    return prisma.product.update({
      where: { id },
      data: { salesCount: { increment: quantity } },
    });
  }

  async updateStock(id, quantity) {
    return prisma.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
  }

  async getFeatured(limit = 10) {
    return prisma.product.findMany({
      where: { isActive: true, isArchived: false, isFeatured: true },
      take: limit,
      orderBy: { salesCount: 'desc' },
      include: { category: true },
    });
  }

  async getTopSelling(limit = 10) {
    return prisma.product.findMany({
      where: { isActive: true, isArchived: false },
      take: limit,
      orderBy: { salesCount: 'desc' },
      include: { category: true },
    });
  }

  async getStatistics() {
    const [totalProducts, activeProducts, totalSales, totalViews] = await Promise.all([
      prisma.product.count({ where: { isArchived: false } }),
      prisma.product.count({ where: { isActive: true, isArchived: false } }),
      prisma.product.aggregate({ _sum: { salesCount: true } }),
      prisma.product.aggregate({ _sum: { viewCount: true } }),
    ]);
    
    const lowStock = await prisma.product.count({
      where: {
        isActive: true,
        isArchived: false,
        unlimitedStock: false,
        stock: { lte: prisma.product.fields.lowStockThreshold },
      },
    });
    
    return {
      totalProducts,
      activeProducts,
      totalSales: totalSales._sum.salesCount || 0,
      totalViews: totalViews._sum.viewCount || 0,
      lowStockProducts: lowStock,
    };
  }

  async bulkUpdateStatus(ids, action) {
    const data = {};
    
    switch (action) {
      case 'activate':
        data.isActive = true;
        break;
      case 'deactivate':
        data.isActive = false;
        break;
      case 'archive':
        data.isActive = false;
        data.isArchived = true;
        break;
    }
    
    return prisma.product.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  async bulkDelete(ids) {
    return prisma.product.deleteMany({
      where: { id: { in: ids } },
    });
  }
}

export default new ProductRepository();
