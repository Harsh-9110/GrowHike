import { db, checkDatabaseHealth, getDatabaseInfo } from './db';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

export interface DatabaseStats {
  tableCount: number;
  userCount: number;
  stockCount: number;
  ipoCount: number;
  orderCount: number;
  lastUpdated: Date;
}

export interface NeonDatabaseInfo {
  connectionInfo: ReturnType<typeof getDatabaseInfo>;
  health: Awaited<ReturnType<typeof checkDatabaseHealth>>;
  stats: DatabaseStats;
}

// Get comprehensive database statistics
export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const [
      tableCountResult,
      userCountResult,
      stockCountResult,
      ipoCountResult,
      orderCountResult,
    ] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.users),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.stocks),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.ipos),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.orders),
    ]);

    return {
      tableCount: Number((tableCountResult as any)[0]?.count || 0),
      userCount: userCountResult[0]?.count || 0,
      stockCount: stockCountResult[0]?.count || 0,
      ipoCount: ipoCountResult[0]?.count || 0,
      orderCount: orderCountResult[0]?.count || 0,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      tableCount: 0,
      userCount: 0,
      stockCount: 0,
      ipoCount: 0,
      orderCount: 0,
      lastUpdated: new Date(),
    };
  }
}

// Get complete Neon database information
export async function getNeonDatabaseInfo(): Promise<NeonDatabaseInfo> {
  const [connectionInfo, health, stats] = await Promise.all([
    getDatabaseInfo(),
    checkDatabaseHealth(),
    getDatabaseStats(),
  ]);

  return {
    connectionInfo,
    health,
    stats,
  };
}

// Cleanup old data (for development)
export async function cleanupOldData(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db
      .delete(schema.orders)
      .where(sql`created_at < ${cutoffDate}`)
      .execute();

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return 0;
  }
}

// Optimize database (VACUUM and ANALYZE)
export async function optimizeDatabase(): Promise<boolean> {
  try {
    await db.execute(sql`VACUUM ANALYZE`);
    return true;
  } catch (error) {
    console.error('Error optimizing database:', error);
    return false;
  }
}

// Check table sizes
export async function getTableSizes(): Promise<Array<{ table: string; size: string }>> {
  try {
    const result = await db.execute(sql`
      SELECT 
        schemaname,
        tablename as table,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);

    return (result as any).map((row: any) => ({
      table: row.table,
      size: row.size,
    }));
  } catch (error) {
    console.error('Error getting table sizes:', error);
    return [];
  }
}

// Initialize database with sample data
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Check if data already exists
    const stockCount = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.stocks);

    if (stockCount[0]?.count > 0) {
      console.log('Database already has data, skipping initialization');
      return true;
    }

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
        marketCap: "1920000000000"
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
        marketCap: "1450000000000"
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
        marketCap: "1280000000000"
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
        marketCap: "740000000000"
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
        marketCap: "810000000000"
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
        marketCap: "295000000000"
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
        marketCap: "281000000000"
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
        marketCap: "158000000000"
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
        marketCap: "79000000000"
      }
    ];

    // Sample IPOs
    const sampleIPOs = [
      {
        name: "TechCorp Solutions",
        priceRangeLow: "450",
        priceRangeHigh: "500",
        openDate: new Date("2025-02-15"),
        closeDate: new Date("2025-02-17"),
        listingDate: new Date("2025-02-20"),
        market: "indian",
        type: "mainboard",
        gmp: "25",
        gmpPercent: "5.56",
        status: "upcoming"
      },
      {
        name: "BioPharm Ltd.",
        priceRangeLow: "280",
        priceRangeHigh: "320",
        openDate: new Date("2025-02-20"),
        closeDate: new Date("2025-02-22"),
        listingDate: new Date("2025-02-25"),
        market: "indian",
        type: "sme",
        gmp: "-10",
        gmpPercent: "-3.13",
        status: "upcoming"
      }
    ];

    // Insert data
    await Promise.all([
      db.insert(schema.stocks).values([...indianStocks, ...internationalStocks]),
      db.insert(schema.ipos).values(sampleIPOs),
    ]);

    console.log('Database initialized with sample data');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}