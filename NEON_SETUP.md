# Neon Database Setup for GROW HIKE

This guide covers setting up and managing your Neon PostgreSQL database for the GROW HIKE stock trading platform.

## 🚀 Quick Setup

### 1. Create Neon Database

1. **Sign up at [Neon](https://neon.tech)**
2. **Create a new project** 
3. **Copy your connection string** from the dashboard

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your Neon connection string
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
SESSION_SECRET="your-super-secret-session-key-32-chars-minimum"
```

### 3. Initialize Database

```bash
# Install dependencies
npm install

# Push schema to Neon
npm run db:push

# Initialize with sample data
node scripts/neon-setup.js
```

### 4. Start Development

```bash
npm run dev
```

Your app will be available at `http://localhost:5000`

## 🎯 Database Management

### API Endpoints

The application provides several endpoints to manage your Neon database:

- **`GET /api/database/info`** - Complete database information and health status
- **`GET /api/database/stats`** - Database statistics (table counts, records)
- **`GET /api/database/tables`** - Table sizes and storage usage
- **`POST /api/database/initialize`** - Initialize with sample stock data
- **`POST /api/database/optimize`** - Run VACUUM and ANALYZE
- **`POST /api/database/cleanup`** - Remove old order records

### Health Check

```bash
curl http://localhost:5000/api/database/info
```

### Initialize Sample Data

```bash
curl -X POST http://localhost:5000/api/database/initialize
```

## 📊 Database Schema

The application uses the following main tables:

### Core Tables
- **`users`** - User accounts and authentication
- **`sessions`** - User session storage
- **`stocks`** - Stock data (Indian and International)
- **`ipos`** - IPO information and GMP tracking

### Trading Tables
- **`portfolios`** - User portfolio management
- **`holdings`** - Individual stock positions
- **`orders`** - Buy/sell transaction records
- **`predictions`** - AI-powered stock predictions
- **`price_history`** - Historical stock price data

## 🔧 Neon Configuration

The application is optimized for Neon with:

- **Serverless Driver** - `@neondatabase/serverless`
- **Connection Pooling** - Optimized pool settings
- **WebSocket Support** - For real-time capabilities
- **Performance Tuning** - Query optimization for Neon

```typescript
// Optimized Neon configuration
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🚀 Deployment with Neon

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=your_secret_key
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy with PostgreSQL
railway login
railway new
railway add postgresql
railway up
```

### Environment Variables

For production deployment, set these variables:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=your-super-secret-session-key-minimum-32-chars
NODE_ENV=production
```

## 🛠️ Troubleshooting

### Connection Issues

1. **Check DATABASE_URL format**:
   ```
   postgresql://username:password@hostname:port/database?sslmode=require
   ```

2. **Verify SSL mode**: Neon requires SSL connections

3. **Test connection**:
   ```bash
   node -e "
   import('@neondatabase/serverless').then(({ Pool }) => {
     const pool = new Pool({ connectionString: process.env.DATABASE_URL });
     pool.query('SELECT 1').then(() => console.log('✓ Connected')).catch(console.error);
   });
   "
   ```

### Schema Issues

1. **Push schema changes**:
   ```bash
   npm run db:push
   ```

2. **Force push if needed**:
   ```bash
   npm run db:push -- --force
   ```

3. **Check migration status**:
   ```bash
   npx drizzle-kit introspect
   ```

### Performance Issues

1. **Optimize database**:
   ```bash
   curl -X POST http://localhost:5000/api/database/optimize
   ```

2. **Check table sizes**:
   ```bash
   curl http://localhost:5000/api/database/tables
   ```

3. **Clean up old data**:
   ```bash
   curl -X POST http://localhost:5000/api/database/cleanup \
     -H "Content-Type: application/json" \
     -d '{"days": 30}'
   ```

## 📈 Monitoring

### Database Statistics

Monitor your database health with:

```javascript
// Get complete database info
const response = await fetch('/api/database/info');
const info = await response.json();

console.log('Health:', info.health.healthy);
console.log('Tables:', info.stats.tableCount);
console.log('Users:', info.stats.userCount);
console.log('Stocks:', info.stats.stockCount);
```

### Connection Health

The application automatically monitors:
- Connection pool status
- Query performance
- Error rates
- Database response times

## 🔒 Security

### Best Practices

1. **Use strong SESSION_SECRET** (32+ random characters)
2. **Enable SSL** in production (required by Neon)
3. **Rotate credentials** regularly
4. **Monitor access logs** in Neon dashboard
5. **Use environment variables** for secrets

### Access Control

- Database operations require authentication
- Admin functions protected by user roles
- Session storage encrypted with strong secret
- Connection pooling prevents connection exhaustion

## 💡 Advanced Features

### Connection Pooling

Optimized for Neon's serverless architecture:

```typescript
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000, // Connection timeout
});
```

### Query Optimization

- Prepared statements for repeated queries
- Connection reuse across requests
- Automatic query analysis and optimization
- Index recommendations based on usage patterns

### Backup & Recovery

Neon provides:
- Automatic daily backups
- Point-in-time recovery
- Branch-based development databases
- Snapshot management

## 📞 Support

### Documentation
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Getting Help

1. Check Neon dashboard for connection issues
2. Review application logs for errors
3. Use database info endpoint for diagnostics
4. Contact Neon support for infrastructure issues

---

Your GROW HIKE application is now ready to scale with Neon's serverless PostgreSQL! 🎉