import {
  addStockItems,
  createProduct as createProductRecord,
  deleteProductById,
  findProductById,
  listProducts as fetchProducts,
  updateProduct as updateProductRecord,
} from '../repositories/productRepository.js';

// Public: danh sach san pham (an du lieu stock nhay cam)
export async function listProducts(req, res) {
  const { category, search, page, limit, sort } = req.query;
  const products = await fetchProducts({
    categoryId: category,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 12,
    sort: sort || 'default',
  });
  res.json(products);
}

export async function getProduct(req, res) {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(publicView(product));
}

// Admin: tao san pham
export async function createProduct(req, res) {
  const { name, description, price, image, category, deliveryType, flashSale, stock } = req.body;
  const product = await createProductRecord({ name, description, price, image, category, deliveryType, flashSale });
  if (Array.isArray(stock) && stock.length) {
    await addStockItems(product.id, stock);
  }
  const fresh = await findProductById(product.id);
  res.status(201).json(adminView(fresh));
}

export async function updateProduct(req, res) {
  const existing = await findProductById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  const product = await updateProductRecord(req.params.id, req.body);
  res.json(adminView(product));
}

// Admin: nap them stock
export async function replenishStock(req, res) {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  const { items } = req.body; // mảng chuỗi payload
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Cần mảng items để nạp kho' });
  }
  await addStockItems(product.id, items);
  const updated = await findProductById(product.id);
  res.json({ message: `Đã nạp ${items.length} sản phẩm`, stock: updated.stock });
}

export async function deleteProduct(req, res) {
  await deleteProductById(req.params.id);
  res.json({ message: 'Đã xóa sản phẩm' });
}

function publicView(p) {
  const now = new Date();
  const flashSale = p.flashSale || { enabled: false, salePrice: 0, endsAt: null };
  const effectivePrice = flashSale.enabled && flashSale.endsAt && new Date(flashSale.endsAt) > now
    ? flashSale.salePrice : p.price;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    effectivePrice,
    image: p.image,
    category: p.category,
    deliveryType: p.deliveryType,
    stock: p.stock,
    flashSale,
    createdAt: p.createdAt,
  };
}

function adminView(p) {
  return { ...publicView(p), totalItems: p.stock };
}
