# Backend Architecture - NestJS Modular Monolith with Event-Driven Processing

## Executive Summary

This document outlines the complete backend architecture redesign from Express + MongoDB to **NestJS + PostgreSQL + Redis + Event-Driven Architecture**.

### Why NestJS?

| Aspect      | Express             | NestJS                                    |
| ----------- | ------------------- | ----------------------------------------- |
| Structure   | Minimal, DIY        | Built-in modules, dependency injection    |
| TypeScript  | Optional            | First-class                               |
| Testing     | Manual setup        | Integrated testing utilities              |
| Scalability | Flat file structure | Modular, monolith scales to microservices |
| Database    | Manual queries      | TypeORM ORM with migrations               |
| Real-time   | Socket.io setup     | Built-in WebSocket gateway                |
| Performance | Depends on code     | Interceptors, caching, pipes built-in     |
| Security    | Manual              | Guards, decorators, helmet included       |
| API Docs    | Swagger optional    | Swagger auto-generated                    |

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│        HTTP / REST / WebSocket          │
├─────────────────────────────────────────┤
│         Controllers (Routing)            │
├─────────────────────────────────────────┤
│    Services (Business Logic)             │
├─────────────────────────────────────────┤
│    Repositories (Data Access)            │
├─────────────────────────────────────────┤
│     Events & Event Listeners             │
├─────────────────────────────────────────┤
│  Redis Cache & Session Store             │
├─────────────────────────────────────────┤
│    PostgreSQL Database (TypeORM)         │
└─────────────────────────────────────────┘
```

---

## Module Breakdown

### 1. Auth Module

**Responsibility**: User authentication, JWT, sessions, permissions

```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cachingService: CachingService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await this.validatePassword(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Emit login event for logging, audit trail
    this.eventEmitter.emit("user.login", { userId: user.id, email });

    const tokens = await this.generateTokens(user);

    // Cache refresh token for revocation
    await this.cachingService.set(
      `refresh-token:${tokens.refreshToken}`,
      user.id,
      7 * 24 * 60 * 60, // 7 days
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // Refresh token rotation (security best practice)
  async refreshTokens(refreshToken: string) {
    const userId = await this.cachingService.get(
      `refresh-token:${refreshToken}`,
    );
    if (!userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.usersService.findById(userId);
    const newTokens = await this.generateTokens(user);

    // Invalidate old token, store new
    await this.cachingService.del(`refresh-token:${refreshToken}`);
    await this.cachingService.set(
      `refresh-token:${newTokens.refreshToken}`,
      user.id,
      7 * 24 * 60 * 60,
    );

    return newTokens;
  }

  private async generateTokens(user: User) {
    const access = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: "1h" },
    );

    const refresh = this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "7d" },
    );

    return { accessToken: access, refreshToken: refresh };
  }
}
```

**Key Features**:

- JWT with access + refresh token rotation
- Role-based access control (RBAC)
- Token blacklisting via Redis
- Audit logging for security events

---

### 2. Products Module

**Responsibility**: Product CRUD, inventory, categories, search, filtering, caching

```typescript
// products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    private productsRepository: ProductsRepository,
    private categoriesRepository: CategoriesRepository,
    private cachingService: CachingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(filters: ProductFilterDto): Promise<Product[]> {
    const cacheKey = this.generateCacheKey(filters);

    // Try cache first
    let products = await this.cachingService.get(cacheKey);
    if (products) return products;

    // Query DB with filters
    products = await this.productsRepository.findWithFilters(filters);

    // Cache hot products for 1 hour
    await this.cachingService.set(cacheKey, products, 60 * 60);

    return products;
  }

  async updateStock(productId: string, delta: number) {
    const product = await this.productsRepository.findById(productId);

    // Event: Stock changed
    const previousStock = product.stock;
    product.stock = Math.max(0, product.stock + delta);
    await this.productsRepository.save(product);

    // Invalidate cache
    this.cachingService.invalidateProductCache(productId);

    // Emit event for WebSocket broadcast
    this.eventEmitter.emit("product.stock-changed", {
      productId,
      previousStock,
      newStock: product.stock,
      timestamp: new Date(),
    });

    // Alert if low stock
    if (product.stock < 5 && previousStock > 5) {
      this.eventEmitter.emit("inventory.low-stock", {
        productId,
        stock: product.stock,
      });
    }

    return product;
  }

  private generateCacheKey(filters: ProductFilterDto): string {
    const sortKey = JSON.stringify(filters);
    return `products:${Buffer.from(sortKey).toString("base64")}`;
  }
}
```

**Caching Strategy**:

- Product list: 1 hour TTL
- Single product: 2 hours TTL
- Categories: 1 day TTL
- Invalidate on any write

---

### 3. Orders Module (Event-Driven)

**Responsibility**: Order creation, payment processing, state machine, event-based workflow

```typescript
// orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    private ordersRepository: OrdersRepository,
    private productsService: ProductsService,
    private paymentService: PaymentService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Core: Create order (initiates state machine)
  async createOrder(
    createOrderDto: CreateOrderDto,
    user: User,
  ): Promise<Order> {
    const order = new Order();
    order.user = user;
    order.items = createOrderDto.items;
    order.totalAmount = this.calculateTotal(createOrderDto.items);
    order.status = OrderStatus.PENDING;
    order.paymentMethod = createOrderDto.paymentMethod;

    const savedOrder = await this.ordersRepository.save(order);

    // Emit: Order Created
    // Triggers: Payment processing, inventory hold, notification
    this.eventEmitter.emit("order.created", {
      orderId: savedOrder.id,
      userId: user.id,
      amount: savedOrder.totalAmount,
      paymentMethod: createOrderDto.paymentMethod,
    });

    return savedOrder;
  }

  // Listen: Payment confirmed
  @OnEvent("payment.confirmed")
  async handlePaymentConfirmed(payload: PaymentConfirmedEvent) {
    const order = await this.ordersRepository.findById(payload.orderId);
    order.status = OrderStatus.PAID;
    order.paidAt = new Date();
    await this.ordersRepository.save(order);

    // Emit: Order Paid
    // Triggers: Inventory deduction, auto-delivery, commission earning
    this.eventEmitter.emit("order.paid", {
      orderId: order.id,
      userId: order.user.id,
      items: order.items,
    });
  }

  // Listen: Auto-delivery triggered
  @OnEvent("order.paid")
  async handleAutoDelivery(payload: OrderPaidEvent) {
    const order = await this.ordersRepository.findById(payload.orderId);

    // Update inventory
    for (const item of payload.items) {
      await this.productsService.updateStock(item.productId, -item.quantity);
    }

    // Send delivery (email, telegram, download link)
    this.eventEmitter.emit("order.deliver", {
      orderId: order.id,
      userId: payload.userId,
      deliveryMethod: order.deliveryType,
      content: order.stockItems, // The actual product content (keys, accounts, etc.)
    });

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    await this.ordersRepository.save(order);
  }
}

// Order Status Machine
enum OrderStatus {
  PENDING = "pending", // Initial state
  PAID = "paid", // Payment confirmed
  DELIVERED = "delivered", // Auto-delivery done
  COMPLETED = "completed", // User confirmed receipt
  REFUNDED = "refunded", // Refund initiated
  CANCELLED = "cancelled", // User cancelled
}

// Event-driven flow:
// User creates order
//   ↓ (emit: order.created)
// Payment processor receives event
//   ↓ (processes payment)
// Payment confirmed (emit: payment.confirmed)
//   ↓ (order status → paid)
// Order service receives event
//   ↓ (emit: order.paid)
// Delivery service receives event + Affiliate service receives event
//   ↓ (sends product via email/telegram + marks commission earned)
// Order marked delivered
```

---

### 4. Payment Module (Multi-Provider)

**Responsibility**: Payment processing, webhook handling, reconciliation

```typescript
// payment/payment.service.ts
@Injectable()
export class PaymentService {
  constructor(
    private vietqrProvider: VietQRProvider,
    private usdtProvider: USDTProvider,
    private cassoService: CassoService,
    private ordersService: OrdersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async initializePayment(
    order: Order,
    method: PaymentMethod,
  ): Promise<PaymentInitData> {
    switch (method) {
      case "bank":
        return await this.vietqrProvider.generateQR(
          order.id,
          order.totalAmount,
        );
      case "usdt":
        return await this.usdtProvider.generateWallet(
          order.id,
          order.totalAmount,
        );
      case "card":
        return await this.cardProvider.initiate(order.id, order.totalAmount);
      default:
        throw new BadRequestException("Unsupported payment method");
    }
  }

  // Webhook: Casso bank transfer confirmed
  @Post("webhooks/casso")
  async handleCassoWebhook(@Body() payload: CassoWebhookDto) {
    // Verify signature
    if (!this.cassoService.verifySignature(payload)) {
      throw new UnauthorizedException("Invalid Casso signature");
    }

    // Extract order ID from description
    const orderId = this.extractOrderId(payload.description);
    const order = await this.ordersService.findById(orderId);

    // Verify amount
    if (payload.amount !== order.totalAmount) {
      throw new BadRequestException("Amount mismatch");
    }

    // Emit: Payment Confirmed
    this.eventEmitter.emit("payment.confirmed", {
      orderId: order.id,
      amount: payload.amount,
      provider: "casso",
      referenceId: payload.transactionId,
    });

    return { success: true };
  }

  // Webhook: TronGrid USDT transfer confirmed
  @Post("webhooks/tron")
  async handleTronWebhook(@Body() payload: TronWebhookDto) {
    const orderId = this.extractOrderIdFromMemo(payload.memo);
    const order = await this.ordersService.findById(orderId);

    // Verify USDT amount (convert to VND)
    const vndAmount = await this.usdtProvider.convertToVND(payload.amount);
    if (vndAmount < order.totalAmount * 0.99) {
      // 1% tolerance
      throw new BadRequestException("Insufficient payment");
    }

    this.eventEmitter.emit("payment.confirmed", {
      orderId: order.id,
      amount: vndAmount,
      provider: "tron",
      cryptoAmount: payload.amount,
      referenceId: payload.transactionHash,
    });

    return { success: true };
  }
}
```

---

### 5. Affiliate Module (Event-Driven Commission)

**Responsibility**: Referral links, commission tracking, withdrawal

```typescript
// affiliate/affiliate.service.ts
@Injectable()
export class AffiliateService {
  constructor(
    private usersService: UsersService,
    private orderService: OrdersService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Listen: Order Paid → Earn commission
  @OnEvent("order.paid")
  async handleCommissionEarned(payload: OrderPaidEvent) {
    const order = await this.orderService.findById(payload.orderId);
    const user = order.user;

    // Check if user was referred
    if (!user.referredBy) return;

    const referrer = await this.usersService.findById(user.referredBy);
    if (!referrer) return;

    // Commission: 10% of order total
    const commission = order.totalAmount * 0.1;
    referrer.commissionBalance += commission;
    await this.usersService.save(referrer);

    // Emit: Commission Earned
    this.eventEmitter.emit("commission.earned", {
      referrerId: referrer.id,
      commission,
      orderId: order.id,
      amount: order.totalAmount,
    });

    // Notify referrer via Telegram
    this.eventEmitter.emit("notification.commission-earned", {
      referrerId: referrer.id,
      commission,
    });
  }

  async requestWithdrawal(userId: string, dto: WithdrawDto) {
    const user = await this.usersService.findById(userId);
    if (user.commissionBalance < dto.amount) {
      throw new BadRequestException("Insufficient balance");
    }

    const withdrawal = new Withdrawal();
    withdrawal.user = user;
    withdrawal.amount = dto.amount;
    withdrawal.method = dto.method; // 'bank' or 'usdt'
    withdrawal.details = dto.details;
    withdrawal.status = WithdrawalStatus.PENDING;

    const saved = await this.withdrawalRepository.save(withdrawal);

    // Emit: Withdrawal requested (triggers admin notification)
    this.eventEmitter.emit("withdrawal.requested", {
      withdrawalId: saved.id,
      userId,
      amount: dto.amount,
    });

    return saved;
  }
}
```

---

### 6. Telegram Module (Event-Driven Notifications)

**Responsibility**: Bot commands, notifications, order updates, broadcasts

```typescript
// telegram/telegram.service.ts
@Injectable()
export class TelegramService {
  private bot: TelegramBot;

  constructor(
    private ordersService: OrdersService,
    private eventEmitter: EventEmitter2,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      webHook: {
        port: process.env.TELEGRAM_WEBHOOK_PORT,
        host: process.env.TELEGRAM_WEBHOOK_HOST,
      },
    });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Command: /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, "👋 Welcome to MMO Store!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛍️ Shop", callback_data: "shop" }],
            [{ text: "📦 My Orders", callback_data: "orders" }],
            [{ text: "💰 Affiliate", callback_data: "affiliate" }],
          ],
        },
      });
    });
  }

  // Listen: Order Paid → Send receipt
  @OnEvent("order.paid")
  async handleOrderPaidNotification(payload: OrderPaidEvent) {
    const user = await this.usersService.findById(payload.userId);
    if (!user.telegramId) return;

    const order = await this.ordersService.findById(payload.orderId);
    const message = `
✅ **Order Confirmed!**
Order ID: \`${order.id}\`
Amount: **${order.totalAmount.toLocaleString("vi-VN")} ₫**
Status: Delivering now...

🔗 [Check Status](${process.env.PUBLIC_BASE_URL}/order/${order.id})
    `.trim();

    await this.bot.sendMessage(user.telegramId, message, {
      parse_mode: "Markdown",
    });
  }

  // Listen: Delivery Complete → Send items
  @OnEvent("order.deliver")
  async handleDeliveryNotification(payload: OrderDeliverEvent) {
    const user = await this.usersService.findById(payload.userId);
    if (!user.telegramId) return;

    const message = `
🎁 **Your Order Is Ready!**

${payload.content}

Thank you for your purchase!
    `.trim();

    await this.bot.sendMessage(user.telegramId, message);
  }

  // Admin: Broadcast to all users
  async broadcastMessage(message: string, adminId: string) {
    const users = await this.usersService.findAllWithTelegram();

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await this.bot.sendMessage(user.telegramId, message, {
          parse_mode: "Markdown",
        });
        sent++;
      } catch (err) {
        failed++;
        console.error(`Failed to send to ${user.telegramId}:`, err);
      }
    }

    // Notify admin
    await this.bot.sendMessage(
      adminId,
      `Broadcast complete: ${sent} sent, ${failed} failed`,
    );
  }
}
```

---

### 7. Analytics Module (Cached Aggregations)

**Responsibility**: Dashboard metrics, reports, revenue tracking

```typescript
// analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
    private cachingService: CachingService,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cacheKey = "analytics:dashboard";

    // Check cache
    let metrics = await this.cachingService.get(cacheKey);
    if (metrics) return metrics;

    // Compute aggregations
    const [totalRevenue, totalOrders, totalUsers, topProducts] =
      await Promise.all([
        this.ordersRepository.sumRevenue({ since: startOfMonth() }),
        this.ordersRepository.count({ status: "completed" }),
        this.usersRepository.count(),
        this.getTopProducts(10),
      ]);

    metrics = {
      totalRevenue,
      totalOrders,
      totalUsers,
      topProducts,
      generatedAt: new Date(),
    };

    // Cache for 15 minutes
    await this.cachingService.set(cacheKey, metrics, 15 * 60);

    return metrics;
  }

  // Listen: Order events → Invalidate cache
  @OnEvent("order.paid")
  async invalidateAnalyticsCache() {
    await this.cachingService.del("analytics:dashboard");
  }
}
```

---

## Data Models (TypeORM Entities)

```typescript
// entities/user.entity.ts
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Bcrypt hashed

  @Column()
  name: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  telegramId: string;

  @Column({ type: "decimal", default: 0 })
  balance: number;

  @Column({ type: "decimal", default: 0 })
  commissionBalance: number;

  @ManyToOne(() => User, { nullable: true })
  referredBy: User;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

// entities/order.entity.ts
@Entity("orders")
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  code: string; // Human-readable order code (ORD-2024-0001, etc.)

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Column({ type: "jsonb" })
  items: OrderItem[];

  @Column({ type: "decimal" })
  totalAmount: number;

  @Column({ type: "enum", enum: OrderStatus })
  status: OrderStatus;

  @Column()
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentReference: string; // Webhook reference from payment provider

  @Column({ nullable: true, type: "text" })
  stockItems: string; // Encrypted content (accounts, keys, etc.) - AES-256-GCM

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
```

---

## Event Bus Architecture

```typescript
// core/event-emitter.service.ts
@Injectable()
export class EventBusService {
  constructor(private eventEmitter: EventEmitter2) {}

  // Emit event asynchronously
  emit(eventName: string, payload: any) {
    this.eventEmitter.emit(eventName, payload);
  }

  // Emit and wait for all listeners (synchronous)
  async emitAsync(eventName: string, payload: any) {
    return await this.eventEmitter.emitAsync(eventName, payload);
  }
}

// All events follow: domain.action pattern
// Examples:
// - order.created
// - order.paid
// - order.delivered
// - payment.confirmed
// - commission.earned
// - inventory.low-stock
// - notification.order-update
// - user.login
// - withdrawal.requested
```

---

## Caching Strategy (Redis)

```
Cache Hierarchy:
┌─ Hot Data (1 hour)
│  ├─ Top 100 products
│  ├─ Featured products
│  └─ Flash sales
│
├─ Warm Data (2 hours)
│  ├─ Product details
│  ├─ User profiles
│  └─ Category listings
│
└─ Cold Data (1 day)
   ├─ Categories
   ├─ Admin settings
   └─ Static content

Invalidation Events:
- Product updated → Invalidate product cache
- Stock changed → Invalidate featured/flash sale cache
- Order created → Invalidate user's recent orders
- New product → Warm cache proactively
```

---

## Deployment & Scaling

### Docker Compose (Development)

```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_TYPE: postgres
      DATABASE_URL: postgres://user:pass@postgres:5432/mmostore
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mmostore
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mmo-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mmo-backend
  template:
    metadata:
      labels:
        app: mmo-backend
    spec:
      containers:
        - name: backend
          image: mmo-store/backend:1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
            - name: REDIS_URL
              value: "redis://redis-cluster:6379"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
```

---

## Performance Benchmarks (Target)

| Metric                    | Target | Current (Express) |
| ------------------------- | ------ | ----------------- |
| Cold Start                | <2s    | ~3-4s             |
| Request Latency (p95)     | <100ms | ~150-200ms        |
| Requests/sec              | 5,000+ | ~2,000            |
| Memory Usage              | <150MB | ~200MB            |
| Cache Hit Rate            | >80%   | N/A               |
| Database Query Time (p95) | <50ms  | ~100ms            |

---

## Migration Checklist

- [ ] Set up NestJS project structure
- [ ] Create TypeORM entities and migrations
- [ ] Implement Auth module with JWT
- [ ] Migrate Products service + caching
- [ ] Implement event-driven Orders module
- [ ] Build Payment webhook handlers
- [ ] Create Affiliate commission logic
- [ ] Telegram bot redesign
- [ ] Analytics aggregation service
- [ ] WebSocket real-time inventory
- [ ] Integration tests (Jest)
- [ ] E2E tests (Supertest)
- [ ] Load testing (k6)
- [ ] Security audit (OWASP)
- [ ] Documentation (Swagger/OpenAPI)
- [ ] Database migration from MongoDB
- [ ] Parallel run (Express + NestJS)
- [ ] Cutover and DNS switch

---

**Timeline**: 8 weeks from current Express setup
