import type { IPO, Portfolio, Stock } from "@shared/schema";

export const demoUserId = "demo-user";

export const demoStocks: Stock[] = [
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
    marketCap: "19200000000000.00",
    updatedAt: new Date(),
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
    marketCap: "14500000000000.00",
    updatedAt: new Date(),
  },
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
    marketCap: "2950000000000.00",
    updatedAt: new Date(),
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
    marketCap: "2810000000000.00",
    updatedAt: new Date(),
  },
];

export const demoIPOs: IPO[] = [
  {
    id: "demo-ipo-1",
    name: "Nova Fintech Solutions",
    priceRangeLow: "450.00",
    priceRangeHigh: "500.00",
    openDate: new Date("2026-08-12"),
    closeDate: new Date("2026-08-14"),
    listingDate: new Date("2026-08-19"),
    market: "indian",
    type: "mainboard",
    gmp: "25.00",
    gmpPercent: "5.56",
    status: "upcoming",
    createdAt: new Date(),
  },
  {
    id: "demo-ipo-2",
    name: "CloudWare Analytics",
    priceRangeLow: "280.00",
    priceRangeHigh: "320.00",
    openDate: new Date("2026-08-20"),
    closeDate: new Date("2026-08-22"),
    listingDate: new Date("2026-08-27"),
    market: "indian",
    type: "sme",
    gmp: "-10.00",
    gmpPercent: "-3.13",
    status: "upcoming",
    createdAt: new Date(),
  },
];

export const demoPortfolio: Portfolio = {
  id: "demo-portfolio",
  userId: demoUserId,
  totalValue: "0.00",
  totalInvested: "0.00",
  dayPnL: "0.00",
  totalPnL: "0.00",
  cash: "100000.00",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function getDemoStocks(market?: string, search?: string) {
  return demoStocks.filter((stock) => {
    const matchesMarket = !market || market === "both" || stock.market === market;
    const normalizedSearch = search?.toLowerCase().trim();
    const matchesSearch =
      !normalizedSearch ||
      stock.name.toLowerCase().includes(normalizedSearch) ||
      stock.symbol.toLowerCase().includes(normalizedSearch);

    return matchesMarket && matchesSearch;
  });
}

export function getDemoIPOs(market?: string, search?: string) {
  return demoIPOs.filter((ipo) => {
    const matchesMarket = !market || market === "both" || ipo.market === market;
    const normalizedSearch = search?.toLowerCase().trim();
    const matchesSearch =
      !normalizedSearch || ipo.name.toLowerCase().includes(normalizedSearch);

    return matchesMarket && matchesSearch;
  });
}

export function getDemoPriceHistory(stockId: string, days = 30) {
  const stock = demoStocks.find((item) => item.id === stockId || item.symbol === stockId);
  const basePrice = Number(stock?.currentPrice || 100);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    const movement = Math.sin(index / 3) * basePrice * 0.015;
    const close = basePrice + movement;

    return {
      date: date.toISOString().slice(0, 10),
      open: close * 0.99,
      high: close * 1.02,
      low: close * 0.98,
      close,
      volume: 1000000 + index * 25000,
    };
  });
}
