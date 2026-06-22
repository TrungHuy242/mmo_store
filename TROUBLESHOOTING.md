# Technical FAQ & Troubleshooting Guide

## Table of Contents

1. [Frontend Issues](#frontend-issues)
2. [Backend Issues](#backend-issues)
3. [Database Issues](#database-issues)
4. [Payment Integration](#payment-integration)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)

---

## Frontend Issues

### Q: Build fails with "Module not found"

**A**: Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Common causes**:

- Outdated lock file
- Missing peer dependencies
- Node version mismatch (use Node 18+)

---

### Q: Tailwind classes not applying

**A**: Ensure `content` in `tailwind.config.js` includes all template files:

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // ...
};
```

**If still not working**:

```bash
# Rebuild Tailwind
npm run build
# Clear browser cache (Ctrl+Shift+Delete)
```

---

### Q: Framer Motion animations not smooth (janky)

**A**: Check for these causes:

1. **Large animations**: Reduce scale/transform scope

```javascript
// ❌ Bad: Animating entire layout
<motion.div animate={{ width: 1000 }}>

// ✓ Good: Use layoutId for shared layout animation
<motion.div layoutId="card">
```

2. **Heavy re-renders**: Use `React.memo` to prevent unnecessary renders

```javascript
export const MyComponent = React.memo(({ prop }) => {
  return <div>{prop}</div>;
});
```

3. **Disable animations in dev tools**: Check DevTools → Rendering → Paint flashing

---

### Q: Cart not persisting after page refresh

**A**: Check Zustand persist middleware:

```javascript
// ✓ Correct setup
const useCartStore = create(
  persist(
    (set) => ({
      /* store */
    }),
    { name: "cart-storage" },
  ),
);

// Verify localStorage
console.log(localStorage.getItem("cart-storage"));
```

**If empty**: Middleware not initialized. Ensure `persist` is imported from `zustand/middleware`.

---

### Q: API calls return 401 Unauthorized

**A**: JWT token missing or expired. Check:

```javascript
// 1. Token stored?
console.log(useAuthStore.getState().token);

// 2. Token in request header?
// Check Network tab in DevTools → Headers → Authorization

// 3. Token expired?
// If so, refresh token should trigger automatically via interceptor
```

**Interceptor not working?** Ensure axios instance is properly configured:

```javascript
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### Q: Images not loading (404 errors)

**A**: Check image path format:

```javascript
// ❌ Wrong: Relative to public folder
<img src="/products/product-1.jpg" />

// ✓ Correct (if in public/)
<img src="/products/product-1.jpg" />

// ✓ Or import
import productImage from '../assets/product-1.jpg';
<img src={productImage} />
```

**WebP format not loading?** Browser doesn't support it. Use `<picture>` tag:

```jsx
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Product" />
</picture>
```

---

## Backend Issues

### Q: NestJS app won't start

**A**: Check common errors:

```bash
# 1. Clear build cache
rm -rf dist
npm run build

# 2. Check database connection
npm run typeorm migration:generate -- -n Test

# 3. Check environment variables
cat .env

# 4. Check ports in use
lsof -i :3000
```

---

### Q: Database migrations failing

**A**:

```bash
# 1. Check migration status
npm run typeorm migration:show

# 2. Revert last migration
npm run typeorm migration:revert

# 3. Re-run migrations
npm run typeorm migration:run

# 4. If stuck, reset database (DEV ONLY)
npm run typeorm schema:drop && npm run typeorm migration:run
```

---

### Q: JWT signature invalid

**A**: Check JWT_SECRET consistency:

```typescript
// Check that JWT_SECRET is same in:
// 1. .env file
// 2. jwt.module.ts configuration
// 3. JwtStrategy

// Verify
console.log(process.env.JWT_SECRET); // Should be same 32+ char string
```

---

### Q: Payment webhook not received

**A**:

1. **Webhook URL correct?**

```bash
# Verify endpoint is accessible
curl -X POST http://your-domain/webhooks/casso \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

2. **Firewall blocking?**

```bash
# Check if port is open
sudo ufw allow 3000
```

3. **Signature verification failing?**

```typescript
// Add logging to debug
console.log("Webhook received:", payload);
console.log("Signature:", signature);
console.log("Expected:", expectedSignature);
```

---

### Q: TypeORM queries returning empty

**A**:

```typescript
// 1. Verify entity is decorated
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // ...
}

// 2. Check column names match database
@Column() // Creates 'firstName' column
firstName: string;

// 3. Use correct syntax
// ❌ Wrong
const user = await usersRepository.find({ email: 'test@test.com' });

// ✓ Correct
const user = await usersRepository.findOne({ where: { email: 'test@test.com' } });
```

---

## Database Issues

### Q: PostgreSQL won't start (Docker)

**A**:

```bash
# Check if port 5432 already in use
lsof -i :5432

# Kill process
kill -9 <PID>

# Or use different port in docker-compose.yml
ports:
  - "5433:5432"
```

---

### Q: "Connection refused" error

**A**: Check connection string:

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql postgresql://postgres:password@localhost:5432/mmostore

# If using Docker
docker-compose up postgres
docker exec -it mmo-postgres psql -U postgres
```

---

### Q: Slow database queries

**A**: Add indexes for frequently queried columns:

```typescript
@Entity("orders")
export class Order {
  @Index()
  @ManyToOne(() => User)
  user: User;

  @Index()
  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

Run migration:

```bash
npm run typeorm migration:generate -- -n AddIndexes
npm run typeorm migration:run
```

---

### Q: Data corruption / inconsistent state

**A**: Use transactions:

```typescript
@Transactional()
async createOrder(dto: CreateOrderDto) {
  const order = await this.ordersRepository.save(/* ... */);

  // If this fails, entire transaction rolls back
  await this.inventoryService.reserveStock(order.items);

  return order;
}
```

---

## Payment Integration

### Q: VietQR QR code not generating

**A**:

```typescript
// Check API credentials
console.log(process.env.VIETQR_API_KEY);
console.log(process.env.VIETQR_API_SECRET);

// Test endpoint
curl -X POST https://api.vietqr.io/qr/generate \
  -H "X-API-Key: your-key" \
  -d '{"account": "123456789", "name": "MMO Store", "amount": 100000}'
```

---

### Q: USDT payment webhook not confirming

**A**: TronGrid webhooks are unreliable. Use polling instead:

```typescript
// Poll for transaction every 10 seconds
setInterval(async () => {
  const tx = await tronWeb.trx.getTransaction(txHash);
  if (tx.receipt?.result === "SUCCESS") {
    // Payment confirmed
  }
}, 10000);
```

---

### Q: Payment stuck in "pending" status

**A**:

1. **Check webhook logs**

```typescript
// Add logging to webhook handler
console.log("Webhook payload:", payload);
console.log("Order found:", order);
console.log("Event emitted:", success);
```

2. **Manually trigger event** (admin only)

```bash
POST /admin/orders/:id/confirm-payment
```

---

## Deployment Issues

### Q: "Application CrashLoopBackOff" in Kubernetes

**A**: Check pod logs:

```bash
kubectl logs -f deployment/mmo-backend

# Common causes:
# 1. Database not accessible
# 2. Missing environment variables
# 3. Port already in use (service config)
```

---

### Q: Database connection timeout in production

**A**: Adjust PostgreSQL pool settings:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  extra: {
    max: 20,
    min: 5,
    idle_in_transaction_session_timeout: 30000,
  },
});
```

---

### Q: Redis cache not working

**A**:

```typescript
// Test Redis connection
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
redis.set('test', 'value').then(() => console.log('✓ Redis works'));

// If using Docker
docker exec -it mmo-redis redis-cli
> SET test value
> GET test
```

---

### Q: Static assets 404 in production

**A**: Ensure nginx serves dist correctly:

```nginx
# nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://backend:3000/api/;
  }
}
```

---

## Performance Issues

### Q: First load time too slow

**A**:

1. **Enable gzip compression**

```nginx
gzip on;
gzip_types text/css application/javascript;
gzip_min_length 1000;
```

2. **Code splitting**

```javascript
const Admin = lazy(() => import("./pages/Admin"));
```

3. **Minimize bundle**

```bash
npm run build
# Check dist/ size
ls -lh dist/assets/
```

---

### Q: Page transition animations janky

**A**: Disable animations during page transitions:

```typescript
// This will respect user's motion preference
<motion.div
  initial={shouldReduceMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Content
</motion.div>
```

---

### Q: Database queries slow (N+1 problem)

**A**: Use relations properly:

```typescript
// ❌ Bad: N+1 queries
const orders = await ordersRepository.find();
for (const order of orders) {
  order.user = await usersRepository.findOne(order.userId); // Query for each
}

// ✓ Good: Single query with relations
const orders = await ordersRepository.find({
  relations: ["user", "items"],
  leftJoinAndSelect: {
    user: "orders.user",
    items: "orders.items",
  },
});
```

---

### Q: Memory leak in long-running process

**A**: Check for unclosed connections/event listeners:

```typescript
// ❌ Bad: Event listeners not cleaned up
this.eventEmitter.on('order.created', () => { /* ... */ });

// ✓ Good: Cleanup
@OnEvent('order.created')
async handleOrderCreated() { /* ... */ }
// Automatically cleaned up by NestJS

// Manual cleanup if needed
this.eventEmitter.off('order.created', handler);
```

---

## Quick Diagnostics Script

```bash
#!/bin/bash

echo "=== Frontend Health Check ==="
curl -s http://localhost:5173 > /dev/null && echo "✓ Frontend running" || echo "✗ Frontend down"

echo "=== Backend Health Check ==="
curl -s http://localhost:3000/health > /dev/null && echo "✓ Backend running" || echo "✗ Backend down"

echo "=== Database Connection ==="
psql postgresql://postgres:password@localhost:5432/mmostore -c "SELECT 1;" && echo "✓ DB connected" || echo "✗ DB failed"

echo "=== Redis Connection ==="
redis-cli ping && echo "✓ Redis connected" || echo "✗ Redis failed"

echo "=== API Authentication ==="
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}' \
  | grep -q "accessToken" && echo "✓ Auth working" || echo "✗ Auth failed"

echo "=== All checks complete ==="
```

---

## Getting Help

1. **Check logs first**

   ```bash
   npm run start:dev 2>&1 | tee app.log
   tail -f app.log
   ```

2. **Enable verbose logging**

   ```typescript
   // main.ts
   app.useLogger(["debug", "error", "log", "warn", "verbose"]);
   ```

3. **Use browser DevTools**
   - Network tab: Check API responses
   - Console: JavaScript errors
   - Performance: Profiling

4. **Check GitHub Issues**
   - NestJS: https://github.com/nestjs/nest/issues
   - Tailwind: https://github.com/tailwindlabs/tailwindcss/issues

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
