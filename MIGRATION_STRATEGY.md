# Migration Strategy: Express + MongoDB → NestJS + PostgreSQL

## Phase Overview

```
Phase 1: Foundation (Week 1-2)
├─ NestJS boilerplate
├─ PostgreSQL setup
├─ TypeORM entities
└─ Database schema

Phase 2: Core Services (Week 3-4)
├─ Auth module
├─ Products service
├─ Orders service
└─ Payment providers

Phase 3: Features (Week 5-6)
├─ Affiliate module
├─ Telegram bot
├─ Analytics
└─ WebSocket

Phase 4: Integration (Week 7)
├─ Parallel run
├─ Data migration
├─ Testing
└─ Monitoring

Phase 5: Cutover (Week 8)
├─ Final validation
├─ DNS switch
└─ Rollback plan
```

---

## Phase 1: Foundation (Week 1-2)

### Step 1.1: Initialize NestJS Project

```bash
# Create NestJS project
npm i -g @nestjs/cli
nest new mmo-store-backend --strict

# Install core dependencies
cd mmo-store-backend
npm install @nestjs/typeorm typeorm postgres redis @nestjs/jwt @nestjs/passport passport @nestjs/event-emitter @nestjs/websockets @nestjs/platform-socket.io class-validator class-transformer

# Install dev dependencies
npm install --save-dev @types/node jest ts-jest @nestjs/testing eslint prettier
```

### Step 1.2: Configure Database (PostgreSQL)

```typescript
// config/database.config.ts
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "mmostore",
  entities: [__dirname + "/../**/*.entity.ts"],
  synchronize: false, // Use migrations instead
  migrations: [__dirname + "/../database/migrations/*.ts"],
  logging: process.env.NODE_ENV === "development",
};

// app.module.ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConfig } from "./config/database.config";

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 1.3: Create Initial Entities

```typescript
// entities/base.entity.ts
export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

// entities/user.entity.ts
import { Entity, Column, OneToMany, ManyToOne } from "typeorm";

@Entity("users")
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: ["user", "admin", "moderator"],
    default: "user",
  })
  role: string;

  @Column({ nullable: true, unique: true })
  telegramId: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  commissionBalance: number;

  @ManyToOne(() => User, { nullable: true })
  referredBy: User;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}

// entities/product.entity.ts
@Entity("products")
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  price: number;

  @Column({ type: "int", default: 0 })
  stock: number;

  @Column({ nullable: true })
  image: string;

  @ManyToOne(() => Category)
  category: Category;

  @Column({ default: true })
  isActive: boolean;
}

// entities/order.entity.ts
@Entity("orders")
export class Order extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Column({ type: "jsonb" })
  items: OrderItem[];

  @Column({ type: "decimal", precision: 15, scale: 2 })
  totalAmount: number;

  @Column({
    type: "enum",
    enum: ["pending", "paid", "delivered", "completed", "refunded"],
  })
  status: string;

  @Column()
  paymentMethod: string;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true, type: "text" })
  stockItems: string; // Encrypted

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;
}
```

### Step 1.4: Generate Migrations

```bash
# Auto-generate migration from entities
npm run typeorm migration:generate -- -n InitialSchema

# Verify migration in database/migrations/
npm run typeorm migration:run

# Rollback if needed
npm run typeorm migration:revert
```

---

## Phase 2: Core Services (Week 3-4)

### Step 2.1: Auth Module

```typescript
// auth/auth.service.ts
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: "1h" }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "7d" }),
    };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; accessToken: string }> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    const { accessToken } = await this.login(user);
    return { user, accessToken };
  }
}

// auth/auth.controller.ts
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException();
    return this.authService.login(user);
  }

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Request() req) {
    return req.user;
  }
}

// auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Step 2.2: Products Module

```typescript
// products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async findAll(skip = 0, take = 20) {
    return this.productsRepository.find({ skip, take });
  }

  async findById(id: string) {
    return this.productsRepository.findOne({ where: { id } });
  }

  async create(dto: CreateProductDto) {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.productsRepository.update(id, dto);
    return this.findById(id);
  }
}

// products/products.controller.ts
@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async getAll(@Query("skip") skip = 0, @Query("take") take = 20) {
    return this.productsService.findAll(skip, take);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.productsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

---

## Phase 3: Features (Week 5-6)

### Step 3.1: Event-Driven Orders

```typescript
// orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto, user: User) {
    const order = this.ordersRepository.create({
      ...dto,
      user,
      code: this.generateOrderCode(),
      status: "pending",
    });

    const saved = await this.ordersRepository.save(order);

    // Emit event
    this.eventEmitter.emit("order.created", {
      orderId: saved.id,
      userId: user.id,
      amount: saved.totalAmount,
      paymentMethod: dto.paymentMethod,
    });

    return saved;
  }

  @OnEvent("payment.confirmed")
  async handlePaymentConfirmed(payload: any) {
    const order = await this.ordersRepository.findOne({
      where: { id: payload.orderId },
    });

    order.status = "paid";
    order.paidAt = new Date();
    const updated = await this.ordersRepository.save(order);

    this.eventEmitter.emit("order.paid", {
      orderId: order.id,
      userId: order.user.id,
      amount: order.totalAmount,
    });

    return updated;
  }

  private generateOrderCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
```

### Step 3.2: Payment Webhooks

```typescript
// payment/casso.provider.ts
@Injectable()
export class CassoProvider {
  constructor(
    private ordersService: OrdersService,
    private eventEmitter: EventEmitter2,
  ) {}

  verifySignature(payload: any, signature: string): boolean {
    const message = JSON.stringify(payload);
    const expectedSig = crypto
      .createHmac("sha256", process.env.CASSO_SECRET)
      .update(message)
      .digest("hex");
    return expectedSig === signature;
  }

  async handleWebhook(payload: CassoWebhookDto) {
    // Extract order ID from description
    const match = payload.description.match(/ORD-[\w-]+/);
    if (!match) throw new BadRequestException("Invalid order reference");

    const orderId = match[0];

    // Verify signature
    if (!this.verifySignature(payload, payload.signature)) {
      throw new UnauthorizedException("Invalid signature");
    }

    // Emit payment confirmed
    this.eventEmitter.emit("payment.confirmed", {
      orderId,
      amount: payload.amount,
      provider: "casso",
      reference: payload.transactionId,
    });

    return { success: true };
  }
}
```

### Step 3.3: Affiliate Module

```typescript
// affiliate/affiliate.service.ts
@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent("order.paid")
  async handleCommissionEarned(payload: any) {
    const order = await this.ordersRepository.findOne(payload.orderId);
    if (!order.user.referredBy) return;

    const referrer = await this.usersRepository.findOne(
      order.user.referredBy.id,
    );

    const commission = order.totalAmount * 0.1;
    referrer.commissionBalance += commission;
    await this.usersRepository.save(referrer);

    this.eventEmitter.emit("commission.earned", {
      referrerId: referrer.id,
      amount: commission,
      orderId: order.id,
    });
  }

  async requestWithdrawal(userId: string, dto: WithdrawDto) {
    const user = await this.usersRepository.findOne(userId);
    if (user.commissionBalance < dto.amount) {
      throw new BadRequestException("Insufficient balance");
    }

    const withdrawal = new Withdrawal();
    withdrawal.user = user;
    withdrawal.amount = dto.amount;
    withdrawal.method = dto.method;
    withdrawal.status = "pending";

    return this.withdrawalRepository.save(withdrawal);
  }
}
```

---

## Phase 4: Integration & Parallel Run (Week 7)

### Step 4.1: Data Migration Script

```typescript
// scripts/migrate-data.ts
import { MongoClient } from 'mongodb';
import { DataSource } from 'typeorm';

async function migrateData() {
  // Connect to old MongoDB
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  const oldDb = mongoClient.db('mmo-store');

  // Connect to new PostgreSQL
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [/* entities */],
  });
  await dataSource.initialize();

  // Migrate users
  const users = await oldDb.collection('users').find().toArray();
  for (const user of users) {
    const newUser = new User();
    newUser.email = user.email;
    newUser.password = user.password; // Already hashed
    newUser.name = user.name;
    newUser.role = user.role || 'user';
    newUser.balance = user.balance || 0;
    newUser.commissionBalance = user.commissionBalance || 0;
    await dataSource.manager.save(newUser);
  }

  // Migrate orders
  const orders = await oldDb.collection('orders').find().toArray();
  for (const order of orders) {
    const newOrder = new Order();
    newOrder.code = order.code;
    newOrder.user = /* find by email */;
    newOrder.items = order.items;
    newOrder.totalAmount = order.totalAmount;
    newOrder.status = order.status;
    newOrder.paidAt = order.paidAt;
    newOrder.deliveredAt = order.deliveredAt;
    await dataSource.manager.save(newOrder);
  }

  console.log('✅ Migration complete!');
  await dataSource.destroy();
  mongoClient.close();
}

// Run: npx ts-node scripts/migrate-data.ts
```

### Step 4.2: Feature Flags for Parallel Run

```typescript
// Use feature flags to toggle between old & new backend

// frontend/.env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_NEW_BACKEND=true // Set to true gradually

// frontend/api/client.js
const baseURL = import.meta.env.VITE_ENABLE_NEW_BACKEND
  ? 'http://localhost:3001/api' // NestJS
  : 'http://localhost:5000/api'; // Express
```

---

## Phase 5: Cutover (Week 8)

### Step 5.1: Pre-Cutover Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Data migration validated
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Monitoring/alerts configured
- [ ] Team trained
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled

### Step 5.2: Cutover Day

```bash
# 1. Final data sync (2 AM)
npm run migrate:final

# 2. Health check
curl http://nestjs-backend:3000/health

# 3. Switch DNS/proxy to NestJS
# Update nginx.conf or load balancer

# 4. Monitor logs & metrics
tail -f logs/app.log

# 5. Smoke tests
npm run test:smoke

# 6. Rollback ready
# Keep old Express running for 24 hours
# If issues, switch DNS back immediately
```

### Step 5.3: Rollback Plan

If critical issues within 24 hours:

```bash
# Immediate: DNS switch back to Express
# PostgreSQL kept in sync with binlog/CDC

# Long-term fix
git rollback <commit>
docker-compose restart backend
npm run migration:revert
```

---

## Timeline & Resource Allocation

| Week | Tasks                            | Resources              |
| ---- | -------------------------------- | ---------------------- |
| 1-2  | NestJS setup, DB, entities       | 1 full-stack, 1 DevOps |
| 3-4  | Auth, Products, Orders           | 2 full-stack           |
| 5-6  | Affiliate, Telegram, Analytics   | 2 full-stack           |
| 7    | Parallel run, testing, migration | 3 people               |
| 8    | Cutover, monitoring, fixes       | 5 people on-call       |

**Total**: 1-2 months with 2-3 developers

---

## Rollout Strategy (Low-Risk)

### Option 1: Feature Flags (Recommended)

```typescript
// Use Unleash/LaunchDarkly to gradually roll out
if (featureFlags.useNewBackend) {
  // Route to NestJS
} else {
  // Route to Express
}

// Gradually increase percentage:
// Day 1: 5% traffic → NestJS
// Day 2: 25% traffic
// Day 3: 50% traffic
// Day 4: 75% traffic
// Day 5: 100% traffic
```

### Option 2: Canary Deployment

- Deploy to 1 pod
- Route 5% traffic
- Monitor for 24 hours
- Gradually increase to 100%

---

**Success Metrics**:

- Zero data loss
- < 100ms latency increase
- > 99.9% uptime
- Performance improvement by 2-3x
