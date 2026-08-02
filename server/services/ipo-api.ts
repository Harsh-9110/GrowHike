/**
 * IPO Data API Service
 * Fetches live IPO data and Grey Market Premium (GMP) information
 */

import type { IPO } from '@shared/schema';

// IPO Data Response interfaces
interface MoneyControlIPO {
  company_name: string;
  issue_size: string;
  price_band: string;
  open_date: string;
  close_date: string;
  listing_date: string;
  status: string;
  gmp: string;
  gmp_percent: string;
  lot_size: string;
  issue_type: string;
}

interface IPOGradeData {
  companyName: string;
  priceRange: string;
  openDate: string;
  closeDate: string;
  listingDate: string;
  gmp: number;
  gmpPercent: number;
  status: string;
  category: string;
}

interface ChittorgarIPO {
  name: string;
  price_min: number;
  price_max: number;
  open_date: string;
  close_date: string;
  listing_date: string;
  gmp_price: number;
  gmp_percent: number;
  status: string;
  market: string;
}

export class IPOAPIService {
  private rapidApiKey: string;
  private marketDataKey: string;

  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
    this.marketDataKey = process.env.MARKET_DATA_API_KEY || '';
  }

  /**
   * Get IPO data from MoneyControl API
   */
  private async getMoneyControlIPOs(): Promise<Partial<IPO>[]> {
    if (!this.rapidApiKey) return [];

    try {
      const url = 'https://moneycontrol.p.rapidapi.com/ipo/upcoming';
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'moneycontrol.p.rapidapi.com'
        }
      });

      const data: MoneyControlIPO[] = await response.json();
      
      return data.map(ipo => ({
        name: ipo.company_name,
        priceRangeLow: this.extractLowPrice(ipo.price_band),
        priceRangeHigh: this.extractHighPrice(ipo.price_band),
        openDate: new Date(ipo.open_date),
        closeDate: new Date(ipo.close_date),
        listingDate: new Date(ipo.listing_date),
        market: 'indian',
        type: ipo.issue_type === 'SME' ? 'sme' : 'mainboard',
        gmp: ipo.gmp.replace('₹', '').replace(',', ''),
        gmpPercent: ipo.gmp_percent.replace('%', ''),
        status: this.normalizeIPOStatus(ipo.status),
      }));
    } catch (error) {
      console.error('MoneyControl IPO API error:', error);
      return [];
    }
  }

  /**
   * Get IPO data from IPOGrade API
   */
  private async getIPOGradeData(): Promise<Partial<IPO>[]> {
    if (!this.rapidApiKey) return [];

    try {
      const url = 'https://ipo-grade.p.rapidapi.com/ipos/upcoming';
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'ipo-grade.p.rapidapi.com'
        }
      });

      const data: IPOGradeData[] = await response.json();
      
      return data.map(ipo => ({
        name: ipo.companyName,
        priceRangeLow: this.extractLowPrice(ipo.priceRange),
        priceRangeHigh: this.extractHighPrice(ipo.priceRange),
        openDate: new Date(ipo.openDate),
        closeDate: new Date(ipo.closeDate),
        listingDate: new Date(ipo.listingDate),
        market: 'indian',
        type: ipo.category === 'SME' ? 'sme' : 'mainboard',
        gmp: ipo.gmp.toString(),
        gmpPercent: ipo.gmpPercent.toString(),
        status: this.normalizeIPOStatus(ipo.status),
      }));
    } catch (error) {
      console.error('IPOGrade API error:', error);
      return [];
    }
  }

  /**
   * Get IPO data from Chittorgarh API
   */
  private async getChittorgarhIPOs(): Promise<Partial<IPO>[]> {
    try {
      // Using public IPO data endpoint
      const url = 'https://api.chittorgarh.com/ipo/upcoming';
      const response = await fetch(url);
      
      if (!response.ok) return [];
      
      const data: ChittorgarIPO[] = await response.json();
      
      return data.map(ipo => ({
        name: ipo.name,
        priceRangeLow: ipo.price_min.toString(),
        priceRangeHigh: ipo.price_max.toString(),
        openDate: new Date(ipo.open_date),
        closeDate: new Date(ipo.close_date),
        listingDate: new Date(ipo.listing_date),
        market: ipo.market.toLowerCase(),
        type: ipo.market === 'SME' ? 'sme' : 'mainboard',
        gmp: ipo.gmp_price.toString(),
        gmpPercent: ipo.gmp_percent.toString(),
        status: this.normalizeIPOStatus(ipo.status),
      }));
    } catch (error) {
      console.error('Chittorgarh IPO API error:', error);
      return [];
    }
  }

  /**
   * Get current IPO GMP data
   */
  private async getCurrentGMPData(): Promise<{[key: string]: {gmp: string; gmpPercent: string}}> {
    try {
      // Mock GMP data - replace with real API
      const gmpUrl = 'https://api.ipowatch.in/gmp/current';
      const response = await fetch(gmpUrl);
      
      if (!response.ok) return {};
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('GMP data fetch error:', error);
      return {};
    }
  }

  /**
   * Get live IPO data with fallback between providers
   */
  public async getLiveIPOData(): Promise<Partial<IPO>[]> {
    console.log('Fetching live IPO data...');
    
    const providers = [
      () => this.getChittorgarhIPOs(),
      () => this.getMoneyControlIPOs(),
      () => this.getIPOGradeData(),
    ];

    let allIPOs: Partial<IPO>[] = [];

    for (const provider of providers) {
      try {
        const ipos = await provider();
        if (ipos.length > 0) {
          allIPOs = [...allIPOs, ...ipos];
          console.log(`Fetched ${ipos.length} IPOs from provider`);
        }
      } catch (error) {
        console.warn('IPO provider failed, trying next...');
        continue;
      }
    }

    // Remove duplicates based on company name
    const uniqueIPOs = allIPOs.filter((ipo, index, self) => 
      index === self.findIndex(i => i.name === ipo.name)
    );

    // Update with current GMP data
    const gmpData = await this.getCurrentGMPData();
    uniqueIPOs.forEach(ipo => {
      if (ipo.name && gmpData[ipo.name]) {
        ipo.gmp = gmpData[ipo.name].gmp;
        ipo.gmpPercent = gmpData[ipo.name].gmpPercent;
      }
    });

    console.log(`Total unique IPOs fetched: ${uniqueIPOs.length}`);
    return uniqueIPOs;
  }

  /**
   * Get IPOs by market
   */
  public async getIPOsByMarket(market: string): Promise<Partial<IPO>[]> {
    const allIPOs = await this.getLiveIPOData();
    
    if (market === 'both') {
      return allIPOs;
    }
    
    return allIPOs.filter(ipo => ipo.market === market);
  }

  /**
   * Search IPOs by name
   */
  public async searchIPOs(query: string, market?: string): Promise<Partial<IPO>[]> {
    const allIPOs = await this.getLiveIPOData();
    const searchTerm = query.toLowerCase();
    
    let filteredIPOs = allIPOs.filter(ipo => 
      ipo.name?.toLowerCase().includes(searchTerm)
    );

    if (market && market !== 'both') {
      filteredIPOs = filteredIPOs.filter(ipo => ipo.market === market);
    }

    return filteredIPOs;
  }

  /**
   * Get IPO details by company name
   */
  public async getIPODetails(companyName: string): Promise<Partial<IPO> | null> {
    const allIPOs = await this.getLiveIPOData();
    return allIPOs.find(ipo => 
      ipo.name?.toLowerCase() === companyName.toLowerCase()
    ) || null;
  }

  /**
   * Extract low price from price range string
   */
  private extractLowPrice(priceRange: string): string {
    const match = priceRange.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    return match ? match[1].replace(/,/g, '') : '0';
  }

  /**
   * Extract high price from price range string
   */
  private extractHighPrice(priceRange: string): string {
    const matches = priceRange.match(/(\d+(?:,\d+)*(?:\.\d+)?)/g);
    if (matches && matches.length >= 2) {
      return matches[1].replace(/,/g, '');
    }
    return this.extractLowPrice(priceRange);
  }

  /**
   * Normalize IPO status across different APIs
   */
  private normalizeIPOStatus(status: string): string {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('upcoming') || statusLower.includes('announced')) {
      return 'upcoming';
    }
    if (statusLower.includes('open') || statusLower.includes('live')) {
      return 'open';
    }
    if (statusLower.includes('closed') || statusLower.includes('ended')) {
      return 'closed';
    }
    if (statusLower.includes('listed')) {
      return 'listed';
    }
    
    return 'upcoming';
  }

  /**
   * Check IPO API health
   */
  public async checkAPIHealth(): Promise<{
    moneyControl: boolean;
    ipoGrade: boolean;
    chittorgarh: boolean;
  }> {
    const results = {
      moneyControl: false,
      ipoGrade: false,
      chittorgarh: false,
    };

    // Test each provider
    try {
      const moneyControlData = await this.getMoneyControlIPOs();
      results.moneyControl = moneyControlData.length > 0;
    } catch (error) {
      results.moneyControl = false;
    }

    try {
      const ipoGradeData = await this.getIPOGradeData();
      results.ipoGrade = ipoGradeData.length > 0;
    } catch (error) {
      results.ipoGrade = false;
    }

    try {
      const chittorgarhData = await this.getChittorgarhIPOs();
      results.chittorgarh = chittorgarhData.length > 0;
    } catch (error) {
      results.chittorgarh = false;
    }

    return results;
  }
}

// Singleton instance
export const ipoAPI = new IPOAPIService();