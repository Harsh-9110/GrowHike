import { Router } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupGoogleAuth, isAuthenticated, getAuthMode } from "./googleauth";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import { 
  getNeonDatabaseInfo, 
  getDatabaseStats, 
  initializeDatabase,
  getTableSizes,
  optimizeDatabase,
  cleanupOldData 
} from "./neon-utils";
import { stockAPI } from "./services/stock-api";
import { ipoAPI } from "./services/ipo-api";
import {
  demoPortfolio,
  demoUserId,
  getDemoIPOs,
  getDemoPriceHistory,
  getDemoStocks,
} from "./demo-data";

function isDemoRequest(req: any) {
  return req.user?.id === demoUserId && getAuthMode().demoEnabled;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ Setup Google Auth FIRST - this adds the auth routes
  await setupGoogleAuth(app);

  // ✅ Add a test route to verify routing is working
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
  });

  // ✅ Add health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'GROW HIKE API' });
  });

  // Auth routes - these are now handled by setupGoogleAuth but let's add fallbacks
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    if (req.user?.id === 'demo-user' && getAuthMode().demoEnabled) {
      return res.json(req.user);
    }

    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ✅ Add explicit login route if not already handled by setupGoogleAuth
  app.get('/api/login', (_req, res) => {
    const authMode = getAuthMode();
    res.redirect(authMode.defaultProvider === 'demo' ? '/api/auth/demo' : '/api/auth/google');
  });

  app.get('/api/logout', (_req, res) => {
    res.redirect('/api/auth/logout');
  });

  // Live stock data routes
  app.get('/api/stocks', async (req, res) => {
    try {
      const market = req.query.market as string;
      const search = req.query.search as string;
      const live = req.query.live as string;

      if (isDemoRequest(req)) {
        res.json(getDemoStocks(market, search));
        return;
      }
      
      // If live data requested, fetch from APIs
      if (live === 'true') {
        let liveStocks;
        
        if (search) {
          liveStocks = await stockAPI.searchStocks(search, market);
        } else if (market === 'indian') {
          liveStocks = await stockAPI.getIndianStocks();
        } else if (market === 'international') {
          liveStocks = await stockAPI.getInternationalStocks();
        } else {
          liveStocks = await stockAPI.getAllStocks();
        }
        
        // Update database with live data
        for (const stockData of liveStocks) {
          if (stockData.symbol) {
            await storage.upsertStock({
              id: stockData.id || stockData.symbol,
              symbol: stockData.symbol,
              name: stockData.name || stockData.symbol,
              exchange: stockData.exchange || 'UNKNOWN',
              market: stockData.market || 'international',
              currency: stockData.currency || 'USD',
              currentPrice: stockData.currentPrice,
              previousClose: stockData.previousClose,
              dayChange: stockData.dayChange,
              dayChangePercent: stockData.dayChangePercent,
              dayHigh: stockData.dayHigh,
              dayLow: stockData.dayLow,
              volume: stockData.volume,
              marketCap: stockData.marketCap,
            });
          }
        }
        
        res.json(liveStocks);
        return;
      }
      
      // Otherwise return cached data from database
      let stocks;
      if (search) {
        stocks = await storage.searchStocks(search, market);
      } else {
        stocks = await storage.getStocks(market);
      }
      
      res.json(stocks);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  app.get('/api/stocks/:id', async (req, res) => {
    try {
      if (isDemoRequest(req)) {
        const stock = getDemoStocks().find(
          (item) => item.id === req.params.id || item.symbol === req.params.id,
        );

        if (!stock) {
          return res.status(404).json({ message: "Stock not found" });
        }

        return res.json(stock);
      }

      const stock = await storage.getStock(req.params.id);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  app.get('/api/stocks/:id/history', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const live = req.query.live as string;

      if (isDemoRequest(req)) {
        res.json(getDemoPriceHistory(req.params.id, days));
        return;
      }
      
      // If live data requested, fetch from API
      if (live === 'true') {
        const liveHistory = await stockAPI.getHistoricalData(req.params.id, days);
        
        // Store in database for caching
        for (const point of liveHistory) {
          await storage.addPriceHistory({
            stockId: req.params.id,
            timestamp: new Date(point.date),
            open: point.open.toString(),
            high: point.high.toString(),
            low: point.low.toString(),
            close: point.close.toString(),
            volume: point.volume,
          });
        }
        
        res.json(liveHistory);
        return;
      }
      
      // Otherwise return cached data
      const history = await storage.getPriceHistory(req.params.id, days);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Live IPO data routes
  app.get('/api/ipos', async (req, res) => {
    try {
      const market = req.query.market as string;
      const search = req.query.search as string;
      const live = req.query.live as string;

      if (isDemoRequest(req)) {
        res.json(getDemoIPOs(market, search));
        return;
      }
      
      // If live data requested, fetch from APIs
      if (live === 'true') {
        let liveIPOs;
        
        if (search) {
          liveIPOs = await ipoAPI.searchIPOs(search, market);
        } else {
          liveIPOs = await ipoAPI.getIPOsByMarket(market || 'both');
        }
        
        // Update database with live IPO data
        for (const ipoData of liveIPOs) {
          if (ipoData.name) {
            await storage.upsertIPO({
              name: ipoData.name,
              priceRangeLow: ipoData.priceRangeLow,
              priceRangeHigh: ipoData.priceRangeHigh,
              openDate: ipoData.openDate,
              closeDate: ipoData.closeDate,
              listingDate: ipoData.listingDate,
              market: ipoData.market || 'indian',
              type: ipoData.type || 'mainboard',
              gmp: ipoData.gmp,
              gmpPercent: ipoData.gmpPercent,
              status: ipoData.status || 'upcoming',
            });
          }
        }
        
        res.json(liveIPOs);
        return;
      }
      
      // Otherwise return cached data from database
      let ipos;
      if (search) {
        ipos = await storage.searchIPOs(search, market);
      } else {
        ipos = await storage.getIPOs(market);
      }
      
      res.json(ipos);
    } catch (error) {
      console.error("Error fetching IPOs:", error);
      res.status(500).json({ message: "Failed to fetch IPOs" });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      if (isDemoRequest(req)) {
        return res.json(demoPortfolio);
      }

      const userId = req.user.id;
      let portfolio = await storage.getPortfolio(userId);
      
      // Create portfolio if doesn't exist
      if (!portfolio) {
        portfolio = await storage.createPortfolio({
          userId,
          totalValue: "100000",
          totalInvested: "0",
          dayPnL: "0",
          totalPnL: "0",
          cash: "100000"
        });
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.get('/api/portfolio/holdings', isAuthenticated, async (req: any, res) => {
    try {
      if (isDemoRequest(req)) {
        return res.json([]);
      }

      const userId = req.user.id;
      const portfolio = await storage.getPortfolio(userId);
      
      if (!portfolio) {
        return res.json([]);
      }
      
      const holdings = await storage.getHoldings(portfolio.id);
      
      // Enrich holdings with current stock data
      const enrichedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          const stock = await storage.getStock(holding.stockId);
          return {
            ...holding,
            stock
          };
        })
      );
      
      res.json(enrichedHoldings);
    } catch (error) {
      console.error("Error fetching holdings:", error);
      res.status(500).json({ message: "Failed to fetch holdings" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      if (isDemoRequest(req)) {
        return res.json({
          id: `demo-order-${Date.now()}`,
          portfolioId: demoPortfolio.id,
          stockId: req.body.stockId,
          type: req.body.type,
          orderType: req.body.orderType || "market",
          quantity: req.body.quantity,
          price: req.body.price,
          executedPrice: req.body.price,
          status: "executed",
          createdAt: new Date(),
          executedAt: new Date(),
        });
      }

      const userId = req.user.id;
      const portfolio = await storage.getPortfolio(userId);
      
      if (!portfolio) {
        return res.status(400).json({ message: "Portfolio not found" });
      }

      const orderData = insertOrderSchema.parse({
        ...req.body,
        portfolioId: portfolio.id
      });

      // Get stock for validation
      const stock = await storage.getStock(orderData.stockId);
      if (!stock) {
        return res.status(400).json({ message: "Stock not found" });
      }

      // For market orders, use current stock price
      const executionPrice = orderData.orderType === 'market' 
        ? parseFloat(stock.currentPrice || "0")
        : parseFloat(orderData.price || "0");

      const totalAmount = executionPrice * orderData.quantity;

      // Check if user has enough cash for buy orders
      if (orderData.type === 'buy') {
        const availableCash = parseFloat(portfolio.cash || "0");
        if (totalAmount > availableCash) {
          return res.status(400).json({ message: "Insufficient cash" });
        }
      }

      // For sell orders, check if user has enough holdings
      if (orderData.type === 'sell') {
        const holding = await storage.getHolding(portfolio.id, orderData.stockId);
        if (!holding || holding.quantity < orderData.quantity) {
          return res.status(400).json({ message: "Insufficient holdings" });
        }
      }

      // Create and execute order
      const order = await storage.createOrder({
        ...orderData,
        executedPrice: executionPrice.toString(),
        status: 'executed',
        executedAt: new Date()
      });

      // Update portfolio and holdings
      if (orderData.type === 'buy') {
        // Deduct cash
        await storage.updatePortfolio(portfolio.id, {
          cash: (parseFloat(portfolio.cash || "0") - totalAmount).toString()
        });

        // Update or create holding
        const existingHolding = await storage.getHolding(portfolio.id, orderData.stockId);
        if (existingHolding) {
          const totalQuantity = existingHolding.quantity + orderData.quantity;
          const totalValue = (existingHolding.quantity * parseFloat(existingHolding.averagePrice)) + totalAmount;
          const newAveragePrice = totalValue / totalQuantity;

          await storage.upsertHolding({
            ...existingHolding,
            quantity: totalQuantity,
            averagePrice: newAveragePrice.toString(),
            currentValue: (totalQuantity * executionPrice).toString()
          });
        } else {
          await storage.upsertHolding({
            portfolioId: portfolio.id,
            stockId: orderData.stockId,
            quantity: orderData.quantity,
            averagePrice: executionPrice.toString(),
            currentValue: totalAmount.toString()
          });
        }
      } else {
        // Sell order - add cash
        await storage.updatePortfolio(portfolio.id, {
          cash: (parseFloat(portfolio.cash || "0") + totalAmount).toString()
        });

        // Update holding
        const holding = await storage.getHolding(portfolio.id, orderData.stockId);
        if (holding) {
          const newQuantity = holding.quantity - orderData.quantity;
          if (newQuantity === 0) {
            await storage.deleteHolding(holding.id);
          } else {
            await storage.upsertHolding({
              ...holding,
              quantity: newQuantity,
              currentValue: (newQuantity * executionPrice).toString()
            });
          }
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error placing order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      if (isDemoRequest(req)) {
        return res.json([]);
      }

      const userId = req.user.id;
      const portfolio = await storage.getPortfolio(userId);
      
      if (!portfolio) {
        return res.json([]);
      }
      
      const orders = await storage.getOrders(portfolio.id);
      
      // Enrich orders with stock data
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const stock = await storage.getStock(order.stockId);
          return {
            ...order,
            stock
          };
        })
      );
      
      res.json(enrichedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Predictions routes
  app.get('/api/predictions/:stockId', async (req, res) => {
    try {
      if (isDemoRequest(req)) {
        return res.json([
          {
            id: `demo-prediction-${req.params.stockId}`,
            stockId: req.params.stockId,
            ipoId: null,
            type: "stock_price",
            predictionDate: new Date(),
            targetPrice: "0.00",
            confidence: "76.00",
            timeframe: "7d",
            createdAt: new Date(),
          },
        ]);
      }

      const predictions = await storage.getPredictions(req.params.stockId);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  // Database management routes
  app.get('/api/database/info', async (req, res) => {
    try {
      const info = await getNeonDatabaseInfo();
      res.json(info);
    } catch (error) {
      console.error("Error fetching database info:", error);
      res.status(500).json({ message: "Failed to fetch database info" });
    }
  });

  app.get('/api/database/stats', async (req, res) => {
    try {
      const stats = await getDatabaseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ message: "Failed to fetch database stats" });
    }
  });

  app.get('/api/database/tables', async (req, res) => {
    try {
      const tableSizes = await getTableSizes();
      res.json(tableSizes);
    } catch (error) {
      console.error("Error fetching table sizes:", error);
      res.status(500).json({ message: "Failed to fetch table sizes" });
    }
  });

  app.post('/api/database/optimize', isAuthenticated, async (req, res) => {
    try {
      const result = await optimizeDatabase();
      res.json({ optimized: result });
    } catch (error) {
      console.error("Error optimizing database:", error);
      res.status(500).json({ message: "Failed to optimize database" });
    }
  });

  app.post('/api/database/cleanup', isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.body.days || '30');
      const deletedCount = await cleanupOldData(days);
      res.json({ deletedRecords: deletedCount });
    } catch (error) {
      console.error("Error cleaning up data:", error);
      res.status(500).json({ message: "Failed to cleanup data" });
    }
  });

  app.post('/api/database/initialize', async (req, res) => {
    try {
      const result = await initializeDatabase();
      res.json({ initialized: result });
    } catch (error) {
      console.error("Error initializing database:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });

  // API health check routes
  app.get('/api/health/stock-apis', async (req, res) => {
    try {
      const health = await stockAPI.checkAPIHealth();
      res.json(health);
    } catch (error) {
      console.error("Error checking stock API health:", error);
      res.status(500).json({ message: "Failed to check API health" });
    }
  });

  app.get('/api/health/ipo-apis', async (req, res) => {
    try {
      const health = await ipoAPI.checkAPIHealth();
      res.json(health);
    } catch (error) {
      console.error("Error checking IPO API health:", error);
      res.status(500).json({ message: "Failed to check IPO API health" });
    }
  });

  // Refresh live data endpoint
  app.post('/api/refresh-live-data', async (req, res) => {
    try {
      const { type } = req.body; // 'stocks', 'ipos', or 'all'
      
      if (type === 'stocks' || type === 'all') {
        console.log('Refreshing live stock data...');
        const liveStocks = await stockAPI.getAllStocks();
        
        for (const stockData of liveStocks) {
          if (stockData.symbol) {
            await storage.upsertStock({
              id: stockData.id || stockData.symbol,
              symbol: stockData.symbol,
              name: stockData.name || stockData.symbol,
              exchange: stockData.exchange || 'UNKNOWN',
              market: stockData.market || 'international',
              currency: stockData.currency || 'USD',
              currentPrice: stockData.currentPrice,
              previousClose: stockData.previousClose,
              dayChange: stockData.dayChange,
              dayChangePercent: stockData.dayChangePercent,
              dayHigh: stockData.dayHigh,
              dayLow: stockData.dayLow,
              volume: stockData.volume,
              marketCap: stockData.marketCap,
            });
          }
        }
      }
      
      if (type === 'ipos' || type === 'all') {
        console.log('Refreshing live IPO data...');
        const liveIPOs = await ipoAPI.getLiveIPOData();
        
        for (const ipoData of liveIPOs) {
          if (ipoData.name) {
            await storage.upsertIPO({
              name: ipoData.name,
              priceRangeLow: ipoData.priceRangeLow,
              priceRangeHigh: ipoData.priceRangeHigh,
              openDate: ipoData.openDate,
              closeDate: ipoData.closeDate,
              listingDate: ipoData.listingDate,
              market: ipoData.market || 'indian',
              type: ipoData.type || 'mainboard',
              gmp: ipoData.gmp,
              gmpPercent: ipoData.gmpPercent,
              status: ipoData.status || 'upcoming',
            });
          }
        }
      }
      
      res.json({ success: true, message: 'Live data refreshed successfully' });
    } catch (error) {
      console.error("Error refreshing live data:", error);
      res.status(500).json({ message: "Failed to refresh live data" });
    }
  });

  // Seed data route (for development)
  app.post('/api/seed', async (req, res) => {
    try {
      // Sample Indian stocks
      const indianStocks = [
        {
          id: "RELIANCE",
          symbol: "RELIANCE",
          name: "Reliance Industries",
          exchange: "NSE",
          market: "indian",
          currency: "INR",
          currentPrice: "2847.50",
          previousClose: "2813.25",
          dayChange: "34.25",
          dayChangePercent: "1.22",
          dayHigh: "2856.90",
          dayLow: "2802.15",
          volume: 1200000,
          marketCap: "19200000000000"
        },
        {
          id: "TCS",
          symbol: "TCS",
          name: "Tata Consultancy Services",
          exchange: "NSE",
          market: "indian",
          currency: "INR",
          currentPrice: "3923.15",
          previousClose: "3954.80",
          dayChange: "-31.65",
          dayChangePercent: "-0.80",
          dayHigh: "3965.20",
          dayLow: "3915.30",
          volume: 850000,
          marketCap: "14500000000000"
        },
        {
          id: "HDFCBANK",
          symbol: "HDFCBANK",
          name: "HDFC Bank",
          exchange: "NSE",
          market: "indian",
          currency: "INR",
          currentPrice: "1642.30",
          previousClose: "1608.50",
          dayChange: "33.80",
          dayChangePercent: "2.10",
          dayHigh: "1648.75",
          dayLow: "1605.20",
          volume: 1800000,
          marketCap: "12800000000000"
        },
        {
          id: "INFY",
          symbol: "INFY",
          name: "Infosys",
          exchange: "NSE",
          market: "indian",
          currency: "INR",
          currentPrice: "1789.90",
          previousClose: "1781.05",
          dayChange: "8.85",
          dayChangePercent: "0.50",
          dayHigh: "1795.40",
          dayLow: "1775.60",
          volume: 1100000,
          marketCap: "7400000000000"
        },
        {
          id: "ICICIBANK",
          symbol: "ICICIBANK",
          name: "ICICI Bank",
          exchange: "NSE",
          market: "indian",
          currency: "INR",
          currentPrice: "1156.75",
          previousClose: "1172.00",
          dayChange: "-15.25",
          dayChangePercent: "-1.30",
          dayHigh: "1175.30",
          dayLow: "1152.80",
          volume: 1600000,
          marketCap: "8100000000000"
        },
        {
          id: "HINDUNILVR",
          symbol: "HINDUNILVR",
          name: "Hindustan Unilever",
          exchange: "NSE",
          market: "indian",
          currency: "INR",
          currentPrice: "2634.20",
          previousClose: "2590.15",
          dayChange: "44.05",
          dayChangePercent: "1.70",
          dayHigh: "2645.80",
          dayLow: "2588.90",
          volume: 720000,
          marketCap: "6200000000000"
        }
      ];

      // Sample International stocks
      const internationalStocks = [
        {
          id: "AAPL",
          symbol: "AAPL",
          name: "Apple Inc.",
          exchange: "NASDAQ",
          market: "international",
          currency: "USD",
          currentPrice: "189.43",
          previousClose: "185.14",
          dayChange: "4.29",
          dayChangePercent: "2.32",
          dayHigh: "190.75",
          dayLow: "186.20",
          volume: 52000000,
          marketCap: "2950000000000"
        },
        {
          id: "MSFT",
          symbol: "MSFT",
          name: "Microsoft Corporation",
          exchange: "NASDAQ",
          market: "international",
          currency: "USD",
          currentPrice: "378.85",
          previousClose: "380.37",
          dayChange: "-1.52",
          dayChangePercent: "-0.40",
          dayHigh: "382.15",
          dayLow: "376.90",
          volume: 24500000,
          marketCap: "2810000000000"
        },
        {
          id: "AMZN",
          symbol: "AMZN",
          name: "Amazon.com Inc.",
          exchange: "NASDAQ",
          market: "international",
          currency: "USD",
          currentPrice: "153.12",
          previousClose: "150.42",
          dayChange: "2.70",
          dayChangePercent: "1.79",
          dayHigh: "154.85",
          dayLow: "151.30",
          volume: 38200000,
          marketCap: "1580000000000"
        },
        {
          id: "TSLA",
          symbol: "TSLA",
          name: "Tesla Inc.",
          exchange: "NASDAQ",
          market: "international",
          currency: "USD",
          currentPrice: "248.97",
          previousClose: "241.19",
          dayChange: "7.78",
          dayChangePercent: "3.23",
          dayHigh: "252.40",
          dayLow: "243.15",
          volume: 68500000,
          marketCap: "790000000000"
        }
      ];

      // Sample IPOs
      const sampleIPOs = [
        {
          id: "xyz-tech",
          name: "XYZ Tech Solutions",
          priceRangeLow: "450",
          priceRangeHigh: "500",
          openDate: new Date("2025-01-15"),
          closeDate: new Date("2025-01-17"),
          listingDate: new Date("2025-01-20"),
          market: "indian",
          type: "mainboard",
          gmp: "25",
          gmpPercent: "5.56",
          status: "upcoming"
        },
        {
          id: "abc-pharma",
          name: "ABC Pharma Ltd.",
          priceRangeLow: "280",
          priceRangeHigh: "320",
          openDate: new Date("2025-01-20"),
          closeDate: new Date("2025-01-22"),
          listingDate: new Date("2025-01-25"),
          market: "indian",
          type: "sme",
          gmp: "-10",
          gmpPercent: "-3.13",
          status: "upcoming"
        }
      ];

      // Insert stocks
      for (const stock of [...indianStocks, ...internationalStocks]) {
        await storage.upsertStock(stock);
      }

      // Insert IPOs
      for (const ipo of sampleIPOs) {
        await storage.upsertIPO(ipo);
      }

      res.json({ 
        message: "Seed data created successfully",
        stocks: indianStocks.length + internationalStocks.length,
        ipos: sampleIPOs.length 
      });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
