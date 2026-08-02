# GROW HIKE - Smart Trading Platform

A comprehensive stock trading platform for Indian and international markets with AI-powered predictions and portfolio management.

## Features

- 🔐 **Secure Authentication** - OAuth integration with Harsh
- 📈 **Multi-Market Support** - Indian (NSE/BSE) and International (NASDAQ/NYSE) stocks
- 🤖 **AI Predictions** - Machine learning-powered price forecasts
- 💹 **Real-time Trading** - Buy/sell stocks with live portfolio tracking
- 🎯 **IPO Analytics** - Grey Market Premium (GMP) tracking and predictions
- 🌙 **Dark/Light Mode** - Complete theme support
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (Harsh OAuth)
- **UI Components**: Radix UI, Shadcn/ui
- **State Management**: TanStack React Query

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Git

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd grow-hike
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/growhike
   SESSION_SECRET=your-session-secret-minimum-32-characters

   Harsh_DOMAINS=localhost:5000
   ```

4. **Database Setup**

   ```bash
   npm run db:push
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:5000` to see the application.

### VSCode Setup

The project includes VSCode configuration in `.vscode/`:

- Settings for TypeScript, formatting, and auto-imports
- Launch configuration for debugging
- Recommended extensions

Press `F5` to start debugging in VSCode.

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Environment Variables**
   Add these in Vercel dashboard:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `Harsh_DOMAINS`

### Other Platforms

The project can also be deployed on:

- Vercel
- Railway
- Render
- Heroku
- DigitalOcean App Platform

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── googleAuth.ts      # Authentication logic
├── shared/                # Shared TypeScript types
│   └── schema.ts          # Database schema and types
└── vercel.json           # Vercel deployment configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## API Endpoints

### Authentication

- `GET /api/auth/user` - Get current user
- `GET /api/login` - Login with OAuth
- `GET /api/logout` - Logout

### Stocks

- `GET /api/stocks` - List stocks with optional market filter
- `GET /api/stocks/:id` - Get specific stock details
- `GET /api/stocks/:id/history` - Get price history

### IPOs

- `GET /api/ipos` - List IPOs with optional market filter

### Trading

- `POST /api/orders` - Place buy/sell order
- `GET /api/orders` - Get order history

### Portfolio

- `GET /api/portfolio` - Get portfolio summary
- `GET /api/portfolio/holdings` - Get current holdings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
