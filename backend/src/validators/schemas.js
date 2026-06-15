import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
  name: z.string().optional(),
  ref: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(1, 'Nhap mat khau'),
});

export const createOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  paymentMethod: z.enum(['balance', 'usdt', 'bank', 'card']),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive('So tien phai lon hon 0'),
  method: z.string().optional(),
  details: z.string().optional(),
});
