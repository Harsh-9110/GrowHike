import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stocks table
export const stocks = pgTable("stocks", {
  id: varchar("id").primaryKey(),
  symbol: varchar("symbol").notNull(),
  name: varchar("name").notNull(),
  exchange: varchar("exchange").notNull(), // NSE, BSE, NASDAQ, NYSE
  market: varchar("market").notNull(), // indian, international
  currency: varchar("currency").notNull().default("INR"),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  previousClose: decimal("previous_close", { precision: 10, scale: 2 }),
  dayChange: decimal("day_change", { precision: 10, scale: 2 }),
  dayChangePercent: decimal("day_change_percent", { precision: 5, scale: 2 }),
  dayHigh: decimal("day_high", { precision: 10, scale: 2 }),
  dayLow: decimal("day_low", { precision: 10, scale: 2 }),
  volume: integer("volume"),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// IPOs table
export const ipos = pgTable("ipos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  priceRangeLow: decimal("price_range_low", { precision: 10, scale: 2 }),
  priceRangeHigh: decimal("price_range_high", { precision: 10, scale: 2 }),
  openDate: timestamp("open_date"),
  closeDate: timestamp("close_date"),
  listingDate: timestamp("listing_date"),
  market: varchar("market").notNull(), // indian, international
  type: varchar("type").notNull(), // mainboard, sme
  gmp: decimal("gmp", { precision: 10, scale: 2 }), // Grey Market Premium
  gmpPercent: decimal("gmp_percent", { precision: 5, scale: 2 }),
  status: varchar("status").notNull().default("upcoming"), // upcoming, open, closed, listed
  createdAt: timestamp("created_at").defaultNow(),
});

// User portfolios
export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).default("0"),
  totalInvested: decimal("total_invested", { precision: 15, scale: 2 }).default("0"),
  dayPnL: decimal("day_pnl", { precision: 15, scale: 2 }).default("0"),
  totalPnL: decimal("total_pnl", { precision: 15, scale: 2 }).default("0"),
  cash: decimal("cash", { precision: 15, scale: 2 }).default("100000"), // Starting with 1L virtual money
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User stock holdings
export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  stockId: varchar("stock_id").notNull().references(() => stocks.id),
  quantity: integer("quantity").notNull(),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }),
  pnl: decimal("pnl", { precision: 15, scale: 2 }),
  pnlPercent: decimal("pnl_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  stockId: varchar("stock_id").notNull().references(() => stocks.id),
  type: varchar("type").notNull(), // buy, sell
  orderType: varchar("order_type").notNull().default("market"), // market, limit, stop_loss
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  executedPrice: decimal("executed_price", { precision: 10, scale: 2 }),
  status: varchar("status").notNull().default("pending"), // pending, executed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  executedAt: timestamp("executed_at"),
});

// AI Predictions table
export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockId: varchar("stock_id").references(() => stocks.id),
  ipoId: varchar("ipo_id").references(() => ipos.id),
  type: varchar("type").notNull(), // stock_price, ipo_gmp
  predictionDate: timestamp("prediction_date").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  timeframe: varchar("timeframe").notNull(), // 1d, 7d, 30d
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock price history
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockId: varchar("stock_id").notNull().references(() => stocks.id),
  timestamp: timestamp("timestamp").notNull(),
  open: decimal("open", { precision: 10, scale: 2 }).notNull(),
  high: decimal("high", { precision: 10, scale: 2 }).notNull(),
  low: decimal("low", { precision: 10, scale: 2 }).notNull(),
  close: decimal("close", { precision: 10, scale: 2 }).notNull(),
  volume: integer("volume").notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = typeof stocks.$inferInsert;
export type IPO = typeof ipos.$inferSelect;
export type InsertIPO = typeof ipos.$inferInsert;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = typeof holdings.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

export const insertStockSchema = createInsertSchema(stocks);
export const insertIPOSchema = createInsertSchema(ipos);
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, executedAt: true });
export const insertHoldingSchema = createInsertSchema(holdings);
