import {
  createCategory as createCategoryRecord,
  deleteCategoryById,
  findCategoryById,
  findCategoryBySlug,
  listCategories as fetchCategories,
  updateCategory as updateCategoryRecord,
} from '../repositories/categoryRepository.js';

export async function listCategories(req, res) {
  const items = await fetchCategories();
  res.json(items);
}

export async function createCategory(req, res) {
  const { name, slug: providedSlug, description, icon } = req.body;
  const slug = providedSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const exists = await findCategoryBySlug(slug);
  if (exists) return res.status(409).json({ message: 'Slug đã tồn tại' });
  const cat = await createCategoryRecord({ name, slug, description, icon });
  res.status(201).json(cat);
}

export async function updateCategory(req, res) {
  const cat = await updateCategoryRecord(req.params.id, req.body);
  if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
  res.json(cat);
}

export async function deleteCategory(req, res) {
  await deleteCategoryById(req.params.id);
  res.json({ message: 'Đã xóa danh mục' });
}
