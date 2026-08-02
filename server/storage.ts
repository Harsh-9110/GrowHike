import {
  users,
  stocks,
  ipos,
  portfolios,
  holdings,
  orders,
  predictions,
  priceHistory,
  type User,
  type UpsertUser,
  type Stock,
  type InsertStock,
  type IPO,
  type InsertIPO,
  type Portfolio,
  type InsertPortfolio,
  type Holding,
  type InsertHolding,
  type Order,
  type InsertOrder,
  type Prediction,
  type InsertPrediction,
  type PriceHistory,
  type InsertPriceHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, or, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Stock operations
  getStocks(market?: string): Promise<Stock[]>;
  getStock(id: string): Promise<Stock | undefined>;
  searchStocks(query: string, market?: string): Promise<Stock[]>;
  upsertStock(stock: InsertStock): Promise<Stock>;
  
  // IPO operations
  getIPOs(market?: string): Promise<IPO[]>;
  searchIPOs(query: string, market?: string): Promise<IPO[]>;
  upsertIPO(ipo: InsertIPO): Promise<IPO>;
  
  // Portfolio operations
  getPortfolio(userId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio>;
  
  // Holdings operations
  getHoldings(portfolioId: string): Promise<Holding[]>;
  getHolding(portfolioId: string, stockId: string): Promise<Holding | undefined>;
  upsertHolding(holding: InsertHolding): Promise<Holding>;
  deleteHolding(id: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(portfolioId: string, limit?: number): Promise<Order[]>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;
  
  // Predictions operations
  getPredictions(stockId?: string, ipoId?: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  // Price history operations
  getPriceHistory(stockId: string, days?: number): Promise<PriceHistory[]>;
  addPriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Stock operations
  async getStocks(market?: string): Promise<Stock[]> {
    if (market && market !== 'both') {
      return await db.select().from(stocks)
        .where(eq(stocks.market, market))
        .orderBy(asc(stocks.name));
    }
    
    return await db.select().from(stocks).orderBy(asc(stocks.name));
  }

  async getStock(id: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.id, id));
    return stock;
  }

  async searchStocks(query: string, market?: string): Promise<Stock[]> {
    const conditions = [
      or(
        like(stocks.name, `%${query}%`),
        like(stocks.symbol, `%${query}%`)
      )
    ];
    
    if (market && market !== 'both') {
      conditions.push(eq(stocks.market, market));
    }
    
    return await db.select().from(stocks)
      .where(and(...conditions))
      .orderBy(asc(stocks.name));
  }

  async upsertStock(stock: InsertStock): Promise<Stock> {
    const [result] = await db
      .insert(stocks)
      .values(stock)
      .onConflictDoUpdate({
        target: stocks.id,
        set: {
          ...stock,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // IPO operations
  async getIPOs(market?: string): Promise<IPO[]> {
    if (market && market !== 'both') {
      return await db.select().from(ipos)
        .where(eq(ipos.market, market))
        .orderBy(desc(ipos.openDate));
    }
    
    return await db.select().from(ipos).orderBy(desc(ipos.openDate));
  }

  async searchIPOs(query: string, market?: string): Promise<IPO[]> {
    const conditions = [like(ipos.name, `%${query}%`)];
    
    if (market && market !== 'both') {
      conditions.push(eq(ipos.market, market));
    }
    
    return await db.select().from(ipos)
      .where(and(...conditions))
      .orderBy(desc(ipos.openDate));
  }

  async upsertIPO(ipo: InsertIPO): Promise<IPO> {
    const [result] = await db
      .insert(ipos)
      .values(ipo)
      .onConflictDoUpdate({
        target: ipos.id,
        set: ipo,
      })
      .returning();
    return result;
  }

  // Portfolio operations
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    return portfolio;
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const [result] = await db.insert(portfolios).values(portfolio).returning();
    return result;
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio> {
    const [result] = await db
      .update(portfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portfolios.id, id))
      .returning();
    return result;
  }

  // Holdings operations
  async getHoldings(portfolioId: string): Promise<Holding[]> {
    return await db.select().from(holdings).where(eq(holdings.portfolioId, portfolioId));
  }

  async getHolding(portfolioId: string, stockId: string): Promise<Holding | undefined> {
    const [holding] = await db
      .select()
      .from(holdings)
      .where(and(eq(holdings.portfolioId, portfolioId), eq(holdings.stockId, stockId)));
    return holding;
  }

  async upsertHolding(holding: InsertHolding): Promise<Holding> {
    const existing = await this.getHolding(holding.portfolioId, holding.stockId);
    
    if (existing) {
      const [result] = await db
        .update(holdings)
        .set({ ...holding, updatedAt: new Date() })
        .where(eq(holdings.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(holdings).values(holding).returning();
      return result;
    }
  }

  async deleteHolding(id: string): Promise<void> {
    await db.delete(holdings).where(eq(holdings.id, id));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(order).returning();
    return result;
  }

  async getOrders(portfolioId: string, limit = 50): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.portfolioId, portfolioId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const [result] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return result;
  }

  // Predictions operations
  async getPredictions(stockId?: string, ipoId?: string): Promise<Prediction[]> {
    if (stockId) {
      return await db.select().from(predictions)
        .where(eq(predictions.stockId, stockId))
        .orderBy(desc(predictions.createdAt));
    } else if (ipoId) {
      return await db.select().from(predictions)
        .where(eq(predictions.ipoId, ipoId))
        .orderBy(desc(predictions.createdAt));
    }
    
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt));
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [result] = await db.insert(predictions).values(prediction).returning();
    return result;
  }

  // Price history operations
  async getPriceHistory(stockId: string, days = 30): Promise<PriceHistory[]> {
    return await db
      .select()
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.stockId, stockId),
          sql`timestamp >= NOW() - INTERVAL '${days} days'`
        )
      )
      .orderBy(asc(priceHistory.timestamp));
  }

  async addPriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory> {
    const [result] = await db.insert(priceHistory).values(priceData).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
