import prisma from '../../database/prisma.js';
import slugify from 'slugify';

class CategoryService {
  // Create category
  async create(data) {
    const slug = slugify(data.name, { lower: true, strict: true });
    
    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
    
    return prisma.category.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        icon: data.icon,
        image: data.image,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder || 0,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: true,
        _count: { select: { products: true } },
      },
    });
  }

  // Update category
  async update(id, data) {
    const updateData = {};
    
    if (data.name) {
      const slug = slugify(data.name, { lower: true, strict: true });
      updateData.name = data.name;
      updateData.slug = slug;
    }
    
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    
    return prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: true,
        _count: { select: { products: true } },
      },
    });
  }

  // Delete category
  async delete(id) {
    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    
    if (productCount > 0) {
      throw new Error('Cannot delete category with products. Move or delete products first.');
    }
    
    // Check if category has children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });
    
    if (childCount > 0) {
      // Move children to parent or root
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
    }
    
    return prisma.category.delete({ where: { id } });
  }

  // Get all categories
  async getAll({ includeInactive = false, hierarchical = false } = {}) {
    const where = includeInactive ? {} : { isActive: true };
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });
    
    if (hierarchical) {
      return this.buildTree(categories);
    }
    
    return categories;
  }

  // Build hierarchical tree
  buildTree(categories) {
    const map = {};
    const roots = [];
    
    // Create map
    categories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });
    
    // Build tree
    categories.forEach(cat => {
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat.id]);
      } else {
        roots.push(map[cat.id]);
      }
    });
    
    return roots;
  }

  // Get category by ID
  async getById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          take: 10,
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            price: true,
          },
        },
        _count: { select: { products: true } },
      },
    });
  }

  // Get category by slug
  async getBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });
  }

  // Toggle category active status
  async toggleStatus(id) {
    const category = await prisma.category.findUnique({ where: { id } });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    return prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }

  // Reorder categories
  async reorder(categories) {
    const updates = categories.map(({ id, sortOrder, parentId }) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder, parentId },
      })
    );
    
    return prisma.$transaction(updates);
  }

  // Get category statistics
  async getStatistics() {
    const [total, active, withProducts, totalProducts] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({ where: { products: { some: {} } } }),
      prisma.product.count(),
    ]);
    
    return {
      total,
      active,
      withProducts,
      totalProducts,
    };
  }
}

export default new CategoryService();
