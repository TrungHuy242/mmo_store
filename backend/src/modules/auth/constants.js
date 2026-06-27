export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  SUPPORT: 'SUPPORT',
  FINANCE: 'FINANCE',
  INVENTORY_STAFF: 'INVENTORY_STAFF',
  MARKETING: 'MARKETING',
  CUSTOMER: 'CUSTOMER',
};

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
};

export const AdminRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.MANAGER,
  UserRole.SUPPORT,
  UserRole.FINANCE,
  UserRole.INVENTORY_STAFF,
  UserRole.MARKETING,
];

export const isAdminRole = (role) => AdminRoles.includes(role);
export const isCustomerRole = (role) => role === UserRole.CUSTOMER;
export const isSuperAdmin = (role) => role === UserRole.SUPER_ADMIN;

export const RolePermissions = {
  [UserRole.SUPER_ADMIN]: ['*'],
  [UserRole.MANAGER]: [
    'products.*', 'orders.*', 'customers.*', 'inventory.*',
    'analytics.*', 'reports.*', 'settings.read',
  ],
  [UserRole.SUPPORT]: [
    'tickets.*', 'customers.read', 'orders.read',
  ],
  [UserRole.FINANCE]: [
    'orders.*', 'transactions.*', 'customers.read',
    'reports.*', 'affiliates.*',
  ],
  [UserRole.INVENTORY_STAFF]: [
    'inventory.*', 'products.read', 'products.update',
  ],
  [UserRole.MARKETING]: [
    'coupons.*', 'affiliates.read', 'products.read',
    'analytics.read',
  ],
  [UserRole.CUSTOMER]: [
    'profile.*', 'orders.read', 'cart.*', 'wishlist.*',
  ],
};

export const hasPermission = (userRole, requiredPermission) => {
  const permissions = RolePermissions[userRole] || [];
  if (permissions.includes('*')) return true;
  return permissions.some(p => {
    if (p.endsWith('.*')) {
      return requiredPermission.startsWith(p.slice(0, -2));
    }
    return p === requiredPermission;
  });
};
