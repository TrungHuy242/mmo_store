import bcrypt from 'bcryptjs';
import { config, validateConfig } from '../config/env.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { generateRefCode } from '../utils/token.js';

async function seed() {
  validateConfig();
  await connectDB();

  // Admin
  let admin = await User.findOne({ email: config.admin.email });
  if (!admin) {
    admin = await User.create({
      email: config.admin.email,
      password: await bcrypt.hash(config.admin.password, 10),
      name: 'Admin',
      role: 'admin',
      refCode: generateRefCode(),
    });
    console.log('[seed] Da tao admin:', config.admin.email);
  }

  // Categories
  const catData = [
    { name: 'Tai khoan', slug: 'accounts', icon: '👤' },
    { name: 'Proxy', slug: 'proxy', icon: '🌐' },
    { name: 'Tool', slug: 'tools', icon: '🛠️' },
    { name: 'SMS / So dien thoai', slug: 'sms', icon: '📱' },
    { name: 'The cao / Gift card', slug: 'cards', icon: '🎁' },
    { name: 'Khoa hoc', slug: 'courses', icon: '📚' },
  ];
  const cats = {};
  for (const c of catData) {
    let cat = await Category.findOne({ slug: c.slug });
    if (!cat) cat = await Category.create(c);
    cats[c.slug] = cat;
  }

  // San pham mau
  if ((await Product.countDocuments()) === 0) {
    const gmail = new Product({
      name: 'Tai khoan Gmail New', description: 'Gmail moi tao, da verify.',
      price: 15000, image: 'https://picsum.photos/seed/gmail/400/300',
      category: cats['accounts']._id, deliveryType: 'text',
    });
    gmail.addStock(['user1@gmail.com|pass123', 'user2@gmail.com|pass456', 'user3@gmail.com|pass789']);

    const proxy = new Product({
      name: 'Proxy US Datacenter', description: 'Proxy US toc do cao.',
      price: 30000, image: 'https://picsum.photos/seed/proxy/400/300',
      category: cats['proxy']._id, deliveryType: 'text',
    });
    proxy.addStock(['1.2.3.4:8080:user:pass', '5.6.7.8:8080:user:pass']);

    await gmail.save();
    await proxy.save();
    console.log('[seed] Da tao san pham mau.');
  }

  console.log('[seed] Hoan tat.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
