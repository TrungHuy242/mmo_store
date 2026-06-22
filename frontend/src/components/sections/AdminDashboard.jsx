/**
 * Admin Dashboard - Main Overview
 * Stats, charts, recent orders, top products
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Button, Skeleton } from '../common';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/**
 * Stat Card Component
 */
const StatCard = ({ icon: Icon, label, value, change, trend }) => {
  const isPositive = trend !== 'down';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass rounded-xl p-6 space-y-3 cursor-pointer transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="p-3 bg-dark-secondary rounded-lg group-hover:bg-dark-hover transition-colors">
          {Icon && <Icon className="w-6 h-6 text-neon-cyan" />}
        </div>
        {change && (
          <Badge
            variant={isPositive ? 'success' : 'error'}
            size="sm"
            className="text-xs"
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          </Badge>
        )}
      </div>

      <div>
        <p className="text-text-tertiary text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </motion.div>
  );
};

/**
 * Revenue Chart
 */
const RevenueChart = ({ data }) => {
  return (
    <Card variant="glass" className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-text-primary">
          Revenue Trend
        </h3>
        <p className="text-sm text-text-tertiary">Last 30 days</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="rgb(184, 193, 212)" />
          <YAxis stroke="rgb(184, 193, 212)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(26, 32, 47)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0.75rem',
            }}
            labelStyle={{ color: 'rgb(245, 247, 250)' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="rgb(0, 212, 255)"
            strokeWidth={2}
            dot={{ fill: 'rgb(0, 212, 255)', r: 4 }}
            name="Revenue (₫)"
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="rgb(255, 0, 110)"
            strokeWidth={2}
            dot={{ fill: 'rgb(255, 0, 110)', r: 4 }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

/**
 * Top Products Chart
 */
const TopProductsChart = ({ data }) => {
  return (
    <Card variant="glass" className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-text-primary">
          Top Products
        </h3>
        <p className="text-sm text-text-tertiary">By revenue</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgb(184, 193, 212)" />
          <YAxis stroke="rgb(184, 193, 212)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(26, 32, 47)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0.75rem',
            }}
            labelStyle={{ color: 'rgb(245, 247, 250)' }}
          />
          <Bar dataKey="sales" fill="rgb(0, 212, 255)" name="Sales (₫)" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

/**
 * Recent Orders Table
 */
const RecentOrdersTable = ({ orders, isLoading }) => {
  return (
    <Card variant="glass" className="space-y-4 overflow-x-auto">
      <div>
        <h3 className="text-lg font-bold text-text-primary">
          Recent Orders
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="w-full" height="h-12" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-text-tertiary border-b border-white/10">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 font-semibold">
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-semibold">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-dark-hover transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-neon-cyan">
                      {order.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-primary">
                    {order.customer}
                  </td>
                  <td className="py-3 px-4 font-semibold text-neon-cyan">
                    {order.amount.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'success'
                          : order.status === 'pending'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-text-tertiary">
                    {new Date(order.date).toLocaleDateString('vi-VN')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

/**
 * Admin Dashboard Main Component
 */
export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    revenue: '₫2,456,000',
    orders: '1,234',
    customers: '856',
    products: '342',
  });

  const [isLoading, setIsLoading] = useState(false);

  const mockRevenueData = [
    { date: 'Jan 1', revenue: 5000000, orders: 120 },
    { date: 'Jan 2', revenue: 6500000, orders: 145 },
    { date: 'Jan 3', revenue: 4200000, orders: 98 },
    { date: 'Jan 4', revenue: 7800000, orders: 178 },
    { date: 'Jan 5', revenue: 8200000, orders: 195 },
    { date: 'Jan 6', revenue: 6900000, orders: 156 },
    { date: 'Jan 7', revenue: 9100000, orders: 210 },
  ];

  const mockProductsData = [
    { name: 'Product A', sales: 45000000 },
    { name: 'Product B', sales: 38000000 },
    { name: 'Product C', sales: 32000000 },
    { name: 'Product D', sales: 28000000 },
  ];

  const mockOrders = [
    {
      id: 'ORD-001',
      customer: 'John Doe',
      amount: 1500000,
      status: 'completed',
      date: '2024-01-15',
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      amount: 2300000,
      status: 'pending',
      date: '2024-01-14',
    },
    {
      id: 'ORD-003',
      customer: 'Bob Johnson',
      amount: 980000,
      status: 'completed',
      date: '2024-01-13',
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-tertiary">
            Welcome back! Here's your overview.
          </p>
        </div>
        <Button variant="secondary">Generate Report</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          )}
          label="Total Revenue"
          value="₫2.45M"
          change={12}
          trend="up"
        />
        <StatCard
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-. .9-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.73 13.45l.75-1.3H17v2H9.9l-.37-.7zM6.5 7h15V4h-15z" />
            </svg>
          )}
          label="Total Orders"
          value="1,234"
          change={8}
          trend="up"
        />
        <StatCard
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
          label="Customers"
          value="856"
          change={-2}
          trend="down"
        />
        <StatCard
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.3-2.92-.6.75 3.05 3.89 3.5-4.49z" />
            </svg>
          )}
          label="Products"
          value="342"
          change={5}
          trend="up"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart data={mockRevenueData} />
        <TopProductsChart data={mockProductsData} />
      </div>

      {/* Recent Orders */}
      <RecentOrdersTable orders={mockOrders} isLoading={isLoading} />
    </div>
  );
};

export default AdminDashboard;
