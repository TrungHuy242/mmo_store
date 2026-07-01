import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import LocketGoldAdmin from './admin/LocketGoldAdmin.jsx';
import Orders from './admin/Orders.jsx';
import Products from './admin/Products.jsx';
import Categories from './admin/Categories.jsx';
import Customers from './admin/Customers.jsx';
import Transactions from './admin/Transactions.jsx';
import Revenue from './admin/Revenue.jsx';
import Inventory from './admin/Inventory.jsx';
import Support from './admin/Support.jsx';
import Affiliates from './admin/Affiliates.jsx';
import Coupons from './admin/Coupons.jsx';
import Licenses from './admin/Licenses.jsx';
import Assets from './admin/Assets.jsx';
import Activity from './admin/Activity.jsx';
import Settings from './admin/Settings.jsx';
import Reviews from './admin/Reviews.jsx';
import { useLocation } from 'react-router-dom';

const pageComponents = {
  '/admin': Dashboard,
  '/admin/orders': Orders,
  '/admin/products': Products,
  '/admin/categories': Categories,
  '/admin/customers': Customers,
  '/admin/transactions': Transactions,
  '/admin/revenue': Revenue,
  '/admin/inventory': Inventory,
  '/admin/support': Support,
  '/admin/affiliates': Affiliates,
  '/admin/coupons': Coupons,
  '/admin/licenses': Licenses,
  '/admin/assets': Assets,
  '/admin/activity': Activity,
  '/admin/settings': Settings,
  '/admin/reviews': Reviews,
  '/admin/locket-gold': LocketGoldAdmin,
};

export default function Admin() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(location.pathname);

  useEffect(() => {
    setCurrentPage(location.pathname);
  }, [location.pathname]);

  const PageComponent = pageComponents[currentPage] || Dashboard;

  return (
    <AdminLayout>
      <PageComponent />
    </AdminLayout>
  );
}
