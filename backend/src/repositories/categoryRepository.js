import { query } from '../config/db.js';

export async function findCategoryBySlug(slug) {
  const result = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
  return result.rows[0] || null;
}

export async function findCategoryById(id) {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function listCategories() {
  const result = await query('SELECT id, name, slug, description, icon FROM categories ORDER BY name ASC');
  return result.rows;
}

export async function createCategory(data) {
  const result = await query(
    `INSERT INTO categories (name, slug, description, icon)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.slug, data.description || '', data.icon || '']
  );
  return result.rows[0];
}

export async function updateCategory(id, updates) {
  const fields = [];
  const values = [];
  let index = 1;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  }
  if (!fields.length) return findCategoryById(id);
  fields.push('updated_at = now()');
  const result = await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, [...values, id]);
  return result.rows[0];
}

export async function deleteCategoryById(id) {
  await query('DELETE FROM categories WHERE id = $1', [id]);
}
