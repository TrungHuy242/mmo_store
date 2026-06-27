/**
 * scripts/seed-admin.cjs
 *
 * Tạo (hoặc reset password) tài khoản admin mặc định.
 *
 * Cách dùng:
 *   cd backend
 *   node scripts/seed-admin.cjs                          # dùng email/password mặc định
 *   node scripts/seed-admin.cjs --email=foo@bar.com --password=Secret@123 --role=SUPER_ADMIN
 *
 * Role hợp lệ: SUPER_ADMIN, MANAGER, SUPPORT, FINANCE, INVENTORY_STAFF, MARKETING
 *
 * Lưu ý:
 *   - Nếu email đã tồn tại, script sẽ cập nhật password + role + status = ACTIVE.
 *   - EmailVerified được bật luôn để bỏ qua bước verify email.
 *   - Chạy 1 lần, idempotent.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

const VALID_ADMIN_ROLES = [
  'SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE',
  'INVENTORY_STAFF', 'MARKETING',
];

async function main() {
  const args = parseArgs(process.argv);
  const email = (args.email || 'admin@mmostore.com').toLowerCase();
  const password = args.password || 'Admin@12345';
  const fullName = args.fullName || 'Admin User';
  const role = (args.role || 'SUPER_ADMIN').toUpperCase();

  if (!VALID_ADMIN_ROLES.includes(role)) {
    console.error(`❌ Role không hợp lệ: ${role}`);
    console.error(`   Các role hợp lệ: ${VALID_ADMIN_ROLES.join(', ')}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role,
      status: 'ACTIVE',
      emailVerified: true,
      fullName,
    },
    create: {
      email,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
      emailVerified: true,
      fullName,
      balance: 0,
    },
  });

  console.log('✅ Admin account ready');
  console.log('──────────────────────────────');
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ${user.role}`);
  console.log(`Status:   ${user.status}`);
  console.log(`Verified: ${user.emailVerified}`);
  console.log('──────────────────────────────');
  console.log('Bạn có thể đăng nhập tại POST /api/auth/admin/login');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi tạo admin:', e.message);
    if (e.code === 'P2002') {
      console.error('   Email đã tồn tại nhưng không thể cập nhật — kiểm tra lại DB.');
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
