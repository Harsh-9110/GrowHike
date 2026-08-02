# GROW HIKE Deployment Guide

This guide covers deploying GROW HIKE to various platforms and setting up local development.

## Quick Setup for VSCode

1. **Clone and Install**

   ```bash
   git clone <your-repo>
   cd grow-hike
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Database Setup**

   ```bash
   npm run db:push
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```
   Or press `F5` in VSCode to start debugging.

## Vercel Deployment

### Prerequisites

- Vercel account
- PostgreSQL database (Neon, Supabase, etc.)
- OAuth provider setup

### Steps

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Set Environment Variables**
   In Vercel dashboard, add:

   ```
   DATABASE_URL=your_postgres_url
   SESSION_SECRET=your_session_secret_32_chars_min
   REPL_ID=your_oauth_client_id
   Harsh_DOMAINS=your-app.vercel.app
   NODE_ENV=production
   ```

5. **Deploy Again**
   ```bash
   vercel --prod
   ```

## Railway Deployment

1. **Install Railway CLI**

   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**

   ```bash
   railway login
   railway new
   railway add postgresql
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables:set SESSION_SECRET=your_secret
   railway variables:set REPL_ID=your_client_id
   railway variables:set Harsh_DOMAINS=your-app.railway.app
   ```

## Render Deployment

1. **Create New Web Service**
   - Connect your GitHub repo
   - Use Docker or Node.js build

2. **Build Command:**

   ```
   npm install && npm run build
   ```

3. **Start Command:**

   ```
   npm start
   ```

4. **Environment Variables:**
   ```
   DATABASE_URL=your_postgres_url
   SESSION_SECRET=your_session_secret
   REPL_ID=your_oauth_client_id
   Harsh_DOMAINS=your-app.onrender.com
   NODE_ENV=production
   ```

## Docker Deployment

1. **Build Image**

   ```bash
   docker build -t grow-hike .
   ```

2. **Run with Docker Compose**

   ```bash
   docker-compose up -d
   ```

3. **Or Run Manually**
   ```bash
   docker run -p 5000:5000 \
     -e DATABASE_URL=your_db_url \
     -e SESSION_SECRET=your_secret \
     grow-hike
   ```

## Environment Variables Reference

| Variable         | Description                               | Required | Example                               |
| ---------------- | ----------------------------------------- | -------- | ------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string              | Yes      | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption (32+ chars) | Yes      | `your-super-secret-session-key-here`  |
| `REPL_ID`        | OAuth client ID                           | Yes      | `your-oauth-client-id`                |
| `Harsh_DOMAINS`  | Allowed domains for OAuth                 | Yes      | `localhost:5000,app.vercel.app`       |
| `NODE_ENV`       | Environment mode                          | No       | `development` or `production`         |
| `PORT`           | Server port                               | No       | `5000`                                |

## Database Setup

The application uses PostgreSQL with Drizzle ORM. After setting up your database:

1. **Update DATABASE_URL** in your environment
2. **Push Schema:**
   ```bash
   npm run db:push
   ```
3. **Seed Data (optional):**
   Visit `/api/seed` endpoint after deployment

## OAuth Setup

1. **Register OAuth Application**
   - Set redirect URI to: `https://your-domain.com/api/callback`
   - Note the client ID for `REPL_ID`

2. **Update Harsh_DOMAINS**
   - Include all domains where your app will run
   - Separate multiple domains with commas

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure all dependencies are installed
   - Check Node.js version (requires 20+)
   - Verify TypeScript compilation

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check firewall/security group settings
   - Ensure database exists

3. **OAuth Issues**
   - Verify REPL_ID is correct
   - Check Harsh_DOMAINS includes your domain
   - Ensure redirect URI matches

### VSCode Issues

1. **TypeScript Errors**
   - Run `npm run check` to see all errors
   - Ensure dependencies are installed
   - Restart TypeScript server (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

2. **Debugging Not Working**
   - Check .vscode/launch.json configuration
   - Ensure .env file exists
   - Verify port 5000 is available

### Deployment Issues

1. **Vercel Build Failures**
   - Check build logs in Vercel dashboard
   - Verify vercel.json configuration
   - Ensure all environment variables are set

2. **Runtime Errors**
   - Check function logs in platform dashboard
   - Verify environment variables
   - Test database connectivity

## Performance Tips

1. **Database Optimization**
   - Use connection pooling
   - Add database indexes for queries
   - Consider read replicas for scale

2. **Frontend Optimization**
   - Enable Vite build optimizations
   - Use React.memo for expensive components
   - Implement lazy loading

3. **Caching**
   - Add Redis for session storage
   - Implement API response caching
   - Use CDN for static assets

## Security Checklist

- [ ] Strong SESSION_SECRET (32+ random characters)
- [ ] HTTPS enabled in production
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] OAuth redirect URIs validated
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints

## Support

For issues or questions:

1. Check this documentation
2. Review error logs
3. Check GitHub issues
4. Contact the development team
