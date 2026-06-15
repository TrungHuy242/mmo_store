import Product from '../models/Product.js';

// Public: danh sach san pham (an du lieu stock nhay cam)
export async function listProducts(req, res) {
  const { category, search } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const products = await Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 });
  res.json(products.map(publicView));
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) return res.status(404).json({ message: 'Khong tim thay san pham' });
  res.json(publicView(product));
}

// Admin: tao san pham
export async function createProduct(req, res) {
  const { name, description, price, image, category, deliveryType, flashSale, stock } = req.body;
  const product = new Product({ name, description, price, image, category, deliveryType, flashSale });
  if (Array.isArray(stock) && stock.length) product.addStock(stock);
  await product.save();
  res.status(201).json(adminView(product));
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Khong tim thay san pham' });
  const { name, description, price, image, category, deliveryType, isActive, flashSale } = req.body;
  Object.assign(product, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    ...(image !== undefined && { image }),
    ...(category !== undefined && { category }),
    ...(deliveryType !== undefined && { deliveryType }),
    ...(isActive !== undefined && { isActive }),
    ...(flashSale !== undefined && { flashSale }),
  });
  await product.save();
  res.json(adminView(product));
}

// Admin: nap them stock
export async function replenishStock(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Khong tim thay san pham' });
  const { items } = req.body; // mang chuoi payload
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Can mang items de nap kho' });
  }
  product.addStock(items);
  await product.save();
  res.json({ message: `Da nap ${items.length} san pham`, stock: product.stock });
}

export async function deleteProduct(req, res) {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Da xoa san pham' });
}

function publicView(p) {
  const price = p.flashSale?.enabled && p.flashSale.endsAt > new Date()
    ? p.flashSale.salePrice : p.price;
  return {
    id: p._id,
    name: p.name,
    description: p.description,
    price: p.price,
    effectivePrice: price,
    image: p.image,
    category: p.category,
    deliveryType: p.deliveryType,
    stock: p.stock,
    flashSale: p.flashSale,
    createdAt: p.createdAt,
  };
}

function adminView(p) {
  return { ...publicView(p), totalItems: p.stockItems.length };
}
