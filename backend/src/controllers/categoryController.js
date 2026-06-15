import Category from '../models/Category.js';

export async function listCategories(req, res) {
  const items = await Category.find().sort({ name: 1 });
  res.json(items);
}

export async function createCategory(req, res) {
  const { name, slug, description, icon } = req.body;
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(409).json({ message: 'Slug da ton tai' });
  const cat = await Category.create({ name, slug, description, icon });
  res.status(201).json(cat);
}

export async function updateCategory(req, res) {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) return res.status(404).json({ message: 'Khong tim thay danh muc' });
  res.json(cat);
}

export async function deleteCategory(req, res) {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Da xoa danh muc' });
}
