/**
 * Stock Market API Service
 * Integrates with multiple stock market data providers for live data
 */

import type { Stock, IPO } from '@shared/schema';

// API Response interfaces
interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface TwelveDataQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: string;
  change: string;
  percent_change: string;
  high: string;
  low: string;
  volume: string;
  previous_close: string;
  market_cap?: string;
}

interface YahooFinanceQuote {
  symbol: string;
  shortName: string;
  exchange: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  marketCap?: number;
}

interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  currency_name: string;
  market_cap?: number;
}

interface PolygonQuote {
  last: {
    price: number;
    change: number;
    change_percent: number;
  };
  day: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previous_close: number;
  };
}

// Stock symbols by market
const INDIAN_STOCKS = [
  'RELIANCE.BSE', 'TCS.BSE', 'HDFCBANK.BSE', 'INFY.BSE', 'ICICIBANK.BSE',
  'HINDUNILVR.BSE', 'ITC.BSE', 'KOTAKBANK.BSE', 'LT.BSE', 'SBIN.BSE',
  'BHARTIARTL.BSE', 'BAJFINANCE.BSE', 'ASIANPAINT.BSE', 'MARUTI.BSE', 'HCLTECH.BSE',
  'AXISBANK.BSE', 'WIPRO.BSE', 'ULTRACEMCO.BSE', 'ONGC.BSE', 'TITAN.BSE',
  'SUNPHARMA.BSE', 'POWERGRID.BSE', 'NESTLEIND.BSE', 'TECHM.BSE', 'NTPC.BSE',
  'TATAMOTORS.BSE', 'BAJAJFINSV.BSE', 'TATACONSUM.BSE', 'JSWSTEEL.BSE', 'HINDALCO.BSE',
  'DIVISLAB.BSE', 'ADANIENT.BSE', 'GRASIM.BSE', 'COALINDIA.BSE', 'DRREDDY.BSE',
  'INDUSINDBK.BSE', 'EICHERMOT.BSE', 'BRITANNIA.BSE', 'SHREECEM.BSE', 'APOLLOHOSP.BSE',
  'CIPLA.BSE', 'HEROMOTOCO.BSE', 'TATASTEEL.BSE', 'UPL.BSE', 'BAJAJ-AUTO.BSE',
  'BPCL.BSE', 'ADANIPORTS.BSE', 'HDFCLIFE.BSE', 'SBILIFE.BSE', 'VEDL.BSE'
];

const INTERNATIONAL_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
  'V', 'XOM', 'WMT', 'JPM', 'PG', 'MA', 'CVX', 'HD', 'PFE', 'ABBV',
  'KO', 'AVGO', 'PEP', 'TMO', 'COST', 'MRK', 'BAC', 'NFLX', 'LLY', 'ACN',
  'DHR', 'NEE', 'VZ', 'ADBE', 'NKE', 'CRM', 'TXN', 'AMD', 'T', 'HON',
  'QCOM', 'UPS', 'RTX', 'LOW', 'SPGI', 'MDT', 'INTU', 'CAT', 'AXP', 'BLK',
  'IBM', 'GS', 'DE', 'EL', 'BKNG', 'ISRG', 'AMT', 'BA', 'GILD', 'MU',
  'ZTS', 'MDLZ', 'SYK', 'CI', 'CVS', 'TJX', 'MMC', 'VRTX', 'MO', 'ADI',
  'WM', 'SO', 'PGR', 'DUK', 'CL', 'TMUS', 'BDX', 'ICE', 'D', 'NOW'
];

export class StockAPIService {
  private alphaVantageKey: string;
  private twelveDataKey: string;
  private polygonKey: string;
  private rapidApiKey: string;

  constructor() {
    // API Keys from environment variables
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY || '';
    this.polygonKey = process.env.POLYGON_API_KEY || '';
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
  }

  /**
   * Get live stock quote from Alpha Vantage
   */
  private async getAlphaVantageQuote(symbol: string): Promise<Partial<Stock> | null> {
    if (!this.alphaVantageKey) return null;

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || 'API limit reached');
      }

      const quote: AlphaVantageQuote = data['Global Quote'];
      if (!quote) return null;

      return {
        symbol: quote['01. symbol'],
        currentPrice: quote['05. price'],
        previousClose: quote['08. previous close'],
        dayChange: quote['09. change'],
        dayChangePercent: quote['10. change percent'].replace('%', ''),
        dayHigh: quote['03. high'],
        dayLow: quote['04. low'],
        volume: parseInt(quote['06. volume']),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get live stock quote from Twelve Data
   */
  private async getTwelveDataQuote(symbol: string): Promise<Partial<Stock> | null> {
    if (!this.twelveDataKey) return null;

    try {
      const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${this.twelveDataKey}`;
      const response = await fetch(url);
      const data: TwelveDataQuote = await response.json();

      if ((data as any).status === 'error') {
        throw new Error((data as any).message);
      }

      return {
        symbol: data.symbol,
        name: data.name,
        exchange: data.exchange,
        currency: data.currency,
        currentPrice: data.price,
        dayChange: data.change,
        dayChangePercent: data.percent_change,
        dayHigh: data.high,
        dayLow: data.low,
        volume: data.volume ? parseInt(data.volume) : undefined,
        previousClose: data.previous_close,
        marketCap: data.market_cap,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Twelve Data API error for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get live stock quote from Yahoo Finance (via RapidAPI)
   */
  private async getYahooFinanceQuote(symbol: string): Promise<Partial<Stock> | null> {
    if (!this.rapidApiKey) return null;

    try {
      const url = `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${symbol}`;
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
        }
      });
      const data: YahooFinanceQuote[] = await response.json();

      if (!data || data.length === 0) return null;

      const quote = data[0];
      return {
        symbol: quote.symbol,
        name: quote.shortName,
        exchange: quote.exchange,
        currency: quote.currency,
        currentPrice: quote.regularMarketPrice.toString(),
        dayChange: quote.regularMarketChange.toString(),
        dayChangePercent: (quote.regularMarketChangePercent * 100).toFixed(2),
        dayHigh: quote.regularMarketDayHigh.toString(),
        dayLow: quote.regularMarketDayLow.toString(),
        volume: quote.regularMarketVolume,
        previousClose: quote.regularMarketPreviousClose.toString(),
        marketCap: quote.marketCap?.toString(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get live stock quote from Polygon.io
   */
  private async getPolygonQuote(symbol: string): Promise<Partial<Stock> | null> {
    if (!this.polygonKey) return null;

    try {
      // Get ticker details
      const detailsUrl = `https://api.polygon.io/v3/reference/tickers/${symbol}?apikey=${this.polygonKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      // Get quote data
      const quoteUrl = `https://api.polygon.io/v2/last/nbbo/${symbol}?apikey=${this.polygonKey}`;
      const quoteResponse = await fetch(quoteUrl);
      const quoteData = await quoteResponse.json();

      if (!detailsData.results || !quoteData.results) return null;

      const details: PolygonTickerDetails = detailsData.results;
      const quote = quoteData.results;

      return {
        symbol: details.ticker,
        name: details.name,
        exchange: details.primary_exchange,
        currency: details.currency_name,
        currentPrice: quote.last?.price?.toString(),
        marketCap: details.market_cap?.toString(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Polygon API error for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get stock quote with fallback between providers
   */
  public async getStockQuote(symbol: string): Promise<Partial<Stock> | null> {
    // Try multiple providers in order of preference
    const providers = [
      () => this.getTwelveDataQuote(symbol),
      () => this.getAlphaVantageQuote(symbol),
      () => this.getYahooFinanceQuote(symbol),
      () => this.getPolygonQuote(symbol),
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result) {
          console.log(`Successfully fetched ${symbol} from provider`);
          return result;
        }
      } catch (error) {
        console.warn(`Provider failed for ${symbol}, trying next...`);
        continue;
      }
    }

    console.error(`All providers failed for ${symbol}`);
    return null;
  }

  /**
   * Get multiple stock quotes in batch
   */
  public async getBatchStockQuotes(symbols: string[]): Promise<Partial<Stock>[]> {
    const results: Partial<Stock>[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getStockQuote(symbol));
      
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push({
            id: batch[index],
            ...result.value,
            market: this.getMarketType(batch[index]),
          });
        }
      });

      // Wait between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get all Indian stocks
   */
  public async getIndianStocks(): Promise<Partial<Stock>[]> {
    console.log('Fetching Indian stocks...');
    return this.getBatchStockQuotes(INDIAN_STOCKS);
  }

  /**
   * Get all international stocks
   */
  public async getInternationalStocks(): Promise<Partial<Stock>[]> {
    console.log('Fetching international stocks...');
    return this.getBatchStockQuotes(INTERNATIONAL_STOCKS);
  }

  /**
   * Get all stocks (Indian + International)
   */
  public async getAllStocks(): Promise<Partial<Stock>[]> {
    console.log('Fetching all stocks...');
    const [indianStocks, internationalStocks] = await Promise.all([
      this.getIndianStocks(),
      this.getInternationalStocks(),
    ]);

    return [...indianStocks, ...internationalStocks];
  }

  /**
   * Search stocks by query
   */
  public async searchStocks(query: string, market?: string): Promise<Partial<Stock>[]> {
    const searchTerms = query.toLowerCase();
    let symbols: string[];

    if (market === 'indian') {
      symbols = INDIAN_STOCKS.filter(symbol => 
        symbol.toLowerCase().includes(searchTerms)
      );
    } else if (market === 'international') {
      symbols = INTERNATIONAL_STOCKS.filter(symbol => 
        symbol.toLowerCase().includes(searchTerms)
      );
    } else {
      symbols = [...INDIAN_STOCKS, ...INTERNATIONAL_STOCKS].filter(symbol => 
        symbol.toLowerCase().includes(searchTerms)
      );
    }

    return this.getBatchStockQuotes(symbols.slice(0, 20)); // Limit search results
  }

  /**
   * Get historical price data
   */
  public async getHistoricalData(symbol: string, days: number = 30): Promise<any[]> {
    if (!this.twelveDataKey) return [];

    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&apikey=${this.twelveDataKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data.values?.map((item: any) => ({
        date: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume),
      })) || [];
    } catch (error) {
      console.error(`Historical data error for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get market type based on symbol
   */
  private getMarketType(symbol: string): string {
    return symbol.includes('.BSE') || symbol.includes('.NSE') ? 'indian' : 'international';
  }

  /**
   * Get exchange name based on symbol
   */
  private getExchange(symbol: string): string {
    if (symbol.includes('.BSE')) return 'BSE';
    if (symbol.includes('.NSE')) return 'NSE';
    // Default to NASDAQ for US stocks
    return 'NASDAQ';
  }

  /**
   * Check API health and availability
   */
  public async checkAPIHealth(): Promise<{
    alphaVantage: boolean;
    twelveData: boolean;
    yahooFinance: boolean;
    polygon: boolean;
  }> {
    const results = {
      alphaVantage: false,
      twelveData: false,
      yahooFinance: false,
      polygon: false,
    };

    // Test Alpha Vantage
    if (this.alphaVantageKey) {
      try {
        const result = await this.getAlphaVantageQuote('AAPL');
        results.alphaVantage = !!result;
      } catch (error) {
        results.alphaVantage = false;
      }
    }

    // Test Twelve Data
    if (this.twelveDataKey) {
      try {
        const result = await this.getTwelveDataQuote('AAPL');
        results.twelveData = !!result;
      } catch (error) {
        results.twelveData = false;
      }
    }

    // Test Yahoo Finance
    if (this.rapidApiKey) {
      try {
        const result = await this.getYahooFinanceQuote('AAPL');
        results.yahooFinance = !!result;
      } catch (error) {
        results.yahooFinance = false;
      }
    }

    // Test Polygon
    if (this.polygonKey) {
      try {
        const result = await this.getPolygonQuote('AAPL');
        results.polygon = !!result;
      } catch (error) {
        results.polygon = false;
      }
    }

    return results;
  }
}

// Singleton instance
export const stockAPI = new StockAPIService();