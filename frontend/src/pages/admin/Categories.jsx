import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Search, Package, X } from 'lucide-react';

const categories = [
  { id: 1, name: 'Accounts', slug: 'accounts', icon: '👤', products: 45, revenue: 42000000, status: 'active' },
  { id: 2, name: 'Proxy', slug: 'proxy', icon: '🌐', products: 28, revenue: 28000000, status: 'active' },
  { id: 3, name: 'Tools', slug: 'tools', icon: '🛠️', products: 67, revenue: 32000000, status: 'active' },
  { id: 4, name: 'SMS / Phone', slug: 'sms', icon: '📱', products: 12, revenue: 15000000, status: 'active' },
  { id: 5, name: 'Gift Cards', slug: 'cards', icon: '🎁', products: 23, revenue: 8000000, status: 'active' },
  { id: 6, name: 'Courses', slug: 'courses', icon: '📚', products: 15, revenue: 45000000, status: 'active' },
  { id: 7, name: 'VPS', slug: 'vps', icon: '🖥️', products: 8, revenue: 12000000, status: 'inactive' },
];

export default function AdminCategories() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.categories')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.manage_categories')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('admin.add_category')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={t('admin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#111827] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-xs text-gray-500">/{cat.slug}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                cat.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
              }`}>
                {t('admin.' + cat.status)}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">{t('admin.products')}</p>
                <p className="text-lg font-bold">{cat.products}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('admin.revenue')}</p>
                <p className="text-lg font-bold text-green-400">{(cat.revenue / 1000000).toFixed(0)}M₫</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditingCategory(cat)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('admin.edit')}
              </button>
              <button className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
