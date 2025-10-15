# Cloudflare D1 Worker Example

This example demonstrates how to use `refine-sqlx` with Cloudflare D1 in a Workers environment.

## 🎯 Package Compatibility

All D1 features are available in **both** packages with 100% identical APIs:

| Feature             | Main Package  | D1 Package       | Bundle Size    |
| ------------------- | ------------- | ---------------- | -------------- |
| `createRefineSQL()` | `refine-sqlx` | `refine-sqlx/d1` | 10 KB vs 67 KB |
| `batchInsert()`     | ✅            | ✅               | Same API       |
| `batchUpdate()`     | ✅            | ✅               | Same API       |
| `batchDelete()`     | ✅            | ✅               | Same API       |
| `D1Options`         | ✅            | ✅               | Same types     |

**You can use either:**

```typescript
// Option 1: Main package (smallest bundle, all DB support)
import { batchInsert, createRefineSQL } from 'refine-sqlx';
// Option 2: D1-optimized package (self-contained, includes Drizzle ORM)
import { batchInsert, createRefineSQL } from 'refine-sqlx/d1';

// ✅ Code is identical - only import path differs!
```

## Features

- ✅ Optimized D1 build (`refine-sqlx/d1`)
- ✅ Type-safe schema with Drizzle ORM
- ✅ Complete REST API for users and posts
- ✅ Automatic pagination and filtering
- ✅ Error handling
- ✅ **Batch operations for bulk inserts/updates**
- ✅ **Time Travel configuration support**

## Setup

### 1. Install Dependencies

```bash
npm install refine-sqlx drizzle-orm
npm install -D wrangler @cloudflare/workers-types
```

### 2. Configure wrangler.toml

```toml
name = "refine-sqlx-d1-example"
main = "example/d1-worker.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "refine-sqlx-demo"
database_id = "your-database-id"
```

### 3. Create D1 Database

```bash
# Create database
wrangler d1 create refine-sqlx-demo

# Copy the database_id to wrangler.toml
```

### 4. Database Migrations

#### Option A: Use Drizzle Kit (Recommended)

```bash
# Set environment variables
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_DATABASE_ID="your-database-id"
export CLOUDFLARE_API_TOKEN="your-api-token"

# Generate migrations from schema
bun run db:generate:d1

# Apply migrations to D1
bun run db:migrate:d1

# Or apply manually
wrangler d1 execute refine-sqlx-demo --file=./drizzle/d1/0000_initial.sql
```

#### Option B: Initialize via API (Development Only)

```bash
# Start local development
wrangler dev

# Initialize tables (POST to /init)
curl -X POST http://localhost:8787/init
```

## API Endpoints

### Users

- `GET /users?page=1&pageSize=10&status=active` - List users with pagination and filtering
- `GET /users/:id` - Get single user
- `POST /users` - Create user
  ```json
  { "name": "John Doe", "email": "john@example.com", "status": "active" }
  ```
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Posts

- `GET /posts?page=1&pageSize=10` - List posts
- `POST /posts` - Create post
  ```json
  {
    "title": "My Post",
    "content": "Post content...",
    "userId": 1,
    "status": "published"
  }
  ```

### Initialization

- `POST /init` - Initialize database schema and sample data

## Deploy

```bash
# Build
npm run build

# Deploy to Cloudflare
wrangler deploy
```

## D1-Specific Features

### Batch Operations

⚡ **Available in both packages**: `refine-sqlx` and `refine-sqlx/d1`

The batch operations automatically handle D1's 50-statement batch limit:

```typescript
// Works with both 'refine-sqlx' and 'refine-sqlx/d1'
import {
  batchDelete,
  batchInsert,
  batchUpdate,
  createRefineSQL,
} from 'refine-sqlx/d1';

// Create data provider
const dataProvider = await createRefineSQL({
  connection: env.DB,
  schema,
  d1Options: {
    batch: { maxSize: 50 }, // Optional: customize batch size
  },
});

// Batch insert - automatically chunks into optimal batches
const users = await batchInsert(dataProvider, 'users', [
  {
    name: 'User 1',
    email: 'user1@example.com',
    status: 'active',
    createdAt: new Date(),
  },
  {
    name: 'User 2',
    email: 'user2@example.com',
    status: 'active',
    createdAt: new Date(),
  },
  // ... up to thousands of items
]);

// Batch update
const updated = await batchUpdate(dataProvider, 'users', [1, 2, 3, 4], {
  status: 'inactive',
});

// Batch delete
const deleted = await batchDelete(dataProvider, 'users', [10, 11, 12]);
```

### Time Travel Configuration

⚡ **Available in both packages**: `refine-sqlx` and `refine-sqlx/d1`

D1's Time Travel feature allows you to restore databases to specific points in time. While runtime queries at specific timestamps are not supported by D1's API, you can configure Time Travel awareness:

```typescript
// Works with both 'refine-sqlx' and 'refine-sqlx/d1'
const dataProvider = await createRefineSQL({
  connection: env.DB,
  schema,
  d1Options: {
    timeTravel: {
      enabled: true,
      bookmark: 'before-migration', // or Unix timestamp
    },
  },
});
```

**Note**: For actual database restoration, use the Wrangler CLI:

```bash
# Restore to specific timestamp
wrangler d1 time-travel restore refine-sqlx-demo --timestamp=1234567890

# Restore to bookmark
wrangler d1 time-travel restore refine-sqlx-demo --bookmark=before-migration

# Create bookmark for current state
wrangler d1 time-travel bookmark create refine-sqlx-demo --name=before-migration
```

For runtime historical data access, consider:

1. Using `wrangler d1 time-travel restore` for point-in-time restoration
2. Implementing application-level versioning with `created_at`/`updated_at` columns
3. Creating separate historical tables with triggers

## Bundle Size

Choose the package that fits your needs:

| Package            | Size  | When to Use                             |
| ------------------ | ----- | --------------------------------------- |
| **refine-sqlx**    | 10 KB | Smallest bundle, supports all databases |
| **refine-sqlx/d1** | 67 KB | D1-only, includes inlined Drizzle ORM   |

Both packages have **identical APIs** - just different bundle optimizations!

## Performance

- **Fast cold starts** - Minimal bundle size
- **Type-safe queries** - Drizzle ORM type inference
- **Atomic transactions** - D1 batch API with rollback support

## Migration Workflow

### Development Workflow

1. **Define Schema** (`example/schema.ts`)

   ```typescript
   export const users = sqliteTable('users', {
     id: integer('id').primaryKey({ autoIncrement: true }),
     name: text('name').notNull(),
     email: text('email').notNull().unique(),
   });
   ```

2. **Generate Migration**

   ```bash
   bun run db:generate:d1
   ```

3. **Review Generated SQL** (`drizzle/d1/0000_*.sql`)

4. **Apply to Local/Dev**

   ```bash
   # Using migration script
   D1_DATABASE_NAME=refine-sqlx-demo-dev bun run db:migrate:d1

   # Or using wrangler
   wrangler d1 execute refine-sqlx-demo-dev --file=./drizzle/d1/0000_*.sql
   ```

5. **Test Changes**
   ```bash
   wrangler dev
   ```

### Production Deployment

1. **Run Tests**

   ```bash
   bun test
   ```

2. **Build**

   ```bash
   bun run build
   ```

3. **Apply Migrations to Production**

   ```bash
   # Preview (dry run)
   DRY_RUN=true D1_DATABASE_NAME=refine-sqlx-demo-prod bun run db:migrate:d1

   # Apply for real
   D1_DATABASE_NAME=refine-sqlx-demo-prod bun run db:migrate:d1
   ```

4. **Deploy Worker**
   ```bash
   wrangler deploy --env production
   ```

### Useful Commands

```bash
# View database info
wrangler d1 info refine-sqlx-demo

# Execute SQL directly
wrangler d1 execute refine-sqlx-demo --command="SELECT * FROM users LIMIT 5"

# Backup database
wrangler d1 export refine-sqlx-demo --output=backup.sql

# Restore database
wrangler d1 execute refine-sqlx-demo --file=backup.sql

# Open Drizzle Studio for visual database management
bun run db:studio:d1
```

## Troubleshooting

### Migration Issues

**Problem**: Migration fails with "table already exists"

**Solution**:

```bash
# Check existing tables
wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table'"

# Drop table if needed (be careful!)
wrangler d1 execute DB --command="DROP TABLE IF EXISTS users"
```

**Problem**: Can't connect to D1 via Drizzle Kit

**Solution**: Verify environment variables:

```bash
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_DATABASE_ID
echo $CLOUDFLARE_API_TOKEN
```

### Worker Issues

**Problem**: "DB is not defined"

**Solution**: Check wrangler.toml has correct D1 binding:

```toml
[[d1_databases]]
binding = "DB"  # Must match env.DB in your code
database_name = "refine-sqlx-demo"
database_id = "..."
```

## Best Practices

1. **Always Use Migrations** - Don't modify schema directly in production
2. **Test Locally First** - Use `wrangler dev` before deploying
3. **Version Control** - Commit all migration files to git
4. **Backup Before Migration** - Use `wrangler d1 export` before applying changes
5. **Use Environment Variables** - Never hardcode credentials
6. **Review Generated SQL** - Always check migration files before applying

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Drizzle ORM D1 Guide](https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [refine-sqlx Documentation](../README.md)
