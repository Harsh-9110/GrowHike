import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun, Search, LogOut, User, Radio, Database, RefreshCw } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StockList from "@/components/stock-list";
import StockChart from "@/components/stock-chart";
import TradingPanel from "@/components/trading-panel";
import PortfolioSummary from "@/components/portfolio-summary";
import AIPrediction from "@/components/ai-prediction";
import type { Stock, IPO } from "@shared/schema";

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMarket, setSelectedMarket] = useState<string>('indian');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState<string>('stocks');
  const [liveDataEnabled, setLiveDataEnabled] = useState<boolean>(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Fetch stocks
  const { data: stocks = [], isLoading: stocksLoading, refetch: refetchStocks } = useQuery({
    queryKey: ['/api/stocks', selectedMarket, searchQuery, liveDataEnabled],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMarket !== 'both') params.append('market', selectedMarket);
      if (searchQuery) params.append('search', searchQuery);
      if (liveDataEnabled) params.append('live', 'true');
      
      const response = await fetch(`/api/stocks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: liveDataEnabled ? 30000 : false, // Refresh every 30 seconds for live data
  });

  // Fetch IPOs
  const { data: ipos = [], isLoading: iposLoading, refetch: refetchIPOs } = useQuery({
    queryKey: ['/api/ipos', selectedMarket, searchQuery, liveDataEnabled],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMarket !== 'both') params.append('market', selectedMarket);
      if (searchQuery) params.append('search', searchQuery);
      if (liveDataEnabled) params.append('live', 'true');
      
      const response = await fetch(`/api/ipos?${params}`);
      if (!response.ok) throw new Error('Failed to fetch IPOs');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: liveDataEnabled ? 60000 : false, // Refresh every 60 seconds for live IPO data
  });

  // Fetch portfolio
  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio'],
    enabled: !!user,
  });

  // Seed data mutation (for development)
  const seedDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/seed', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to seed data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ipos'] });
      toast({
        title: "Success",
        description: "Sample data loaded successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load sample data",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const toggleLiveData = () => {
    setLiveDataEnabled(!liveDataEnabled);
    toast({
      title: liveDataEnabled ? "Switched to Cached Data" : "Switched to Live Data",
      description: liveDataEnabled 
        ? "Now showing cached database data" 
        : "Now fetching live data from market APIs",
    });
  };

  const refreshData = async () => {
    await Promise.all([refetchStocks(), refetchIPOs()]);
    toast({
      title: "Data Refreshed",
      description: "Latest market data has been loaded",
    });
  };

  // Auto-select first stock when stocks load
  useEffect(() => {
    if (stocks.length > 0 && !selectedStock) {
      setSelectedStock(stocks[0]);
    }
  }, [stocks, selectedStock]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-600" data-testid="logo">GROW HIKE</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">Smart Trading Platform</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {stocks.length === 0 && (
              <Button
                onClick={() => seedDataMutation.mutate()}
                disabled={seedDataMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="seed-data-button"
              >
                Load Sample Data
              </Button>
            )}
            
            <div className="flex items-center space-x-3">
              <img 
                src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=32&h=32&fit=crop&crop=face"} 
                alt="User Profile" 
                className="w-8 h-8 rounded-full object-cover"
                data-testid="user-avatar"
              />
              <span className="text-gray-700 dark:text-gray-300" data-testid="user-name">
                {(user as any)?.firstName || (user as any)?.email || 'User'}
              </span>
            </div>
            
            {/* Live Data Status */}
            <Button 
              variant={liveDataEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={toggleLiveData}
              className="gap-2"
              data-testid="live-data-toggle"
            >
              {liveDataEnabled ? (
                <Radio className="h-4 w-4 text-green-400 animate-pulse" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {liveDataEnabled ? "LIVE DATA" : "CACHED DATA"}
            </Button>
            
            {/* Refresh Button */}
            <Button variant="outline" size="sm" onClick={refreshData} data-testid="refresh-data">
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
          {/* Market Selection */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant={selectedMarket === 'indian' ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 ${selectedMarket === 'indian' ? 'bg-green-600 text-white' : ''}`}
                onClick={() => setSelectedMarket('indian')}
                data-testid="market-indian"
              >
                Indian
              </Button>
              <Button
                variant={selectedMarket === 'international' ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 ${selectedMarket === 'international' ? 'bg-green-600 text-white' : ''}`}
                onClick={() => setSelectedMarket('international')}
                data-testid="market-international"
              >
                International
              </Button>
              <Button
                variant={selectedMarket === 'both' ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 ${selectedMarket === 'both' ? 'bg-green-600 text-white' : ''}`}
                onClick={() => setSelectedMarket('both')}
                data-testid="market-both"
              >
                Both
              </Button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search stocks, IPOs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
              <TabsTrigger value="stocks" data-testid="tab-stocks">Stocks</TabsTrigger>
              <TabsTrigger value="ipos" data-testid="tab-ipos">IPOs</TabsTrigger>
            </TabsList>

            <TabsContent value="stocks" className="flex-1 overflow-hidden m-0">
              <StockList
                stocks={stocks}
                loading={stocksLoading}
                selectedStock={selectedStock}
                onStockSelect={handleStockSelect}
              />
            </TabsContent>

            <TabsContent value="ipos" className="flex-1 overflow-hidden m-0">
              <div className="overflow-y-auto p-4 space-y-3" data-testid="ipo-list">
                {iposLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading IPOs...</p>
                  </div>
                ) : ipos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No IPOs found</p>
                  </div>
                ) : (
                  ipos.map((ipo: IPO) => (
                    <Card key={ipo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" data-testid={`ipo-${ipo.id}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{ipo.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              INR {ipo.priceRangeLow}-{ipo.priceRangeHigh} - {ipo.openDate ? new Date(ipo.openDate).toLocaleDateString() : 'TBA'}
                            </p>
                            <Badge variant={ipo.type === 'mainboard' ? 'default' : 'secondary'} className="text-xs mt-1">
                              {ipo.type === 'mainboard' ? 'Mainboard IPO' : 'SME IPO'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${parseFloat(ipo.gmp || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              GMP: {parseFloat(ipo.gmp || '0') >= 0 ? '+' : ''}INR {ipo.gmp}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ipo.gmpPercent}% premium</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {selectedStock ? (
            <div className="h-full flex flex-col">
              {/* Stock Header */}
              <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="selected-stock-name">
                      {selectedStock.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400" data-testid="selected-stock-symbol">
                      {selectedStock.symbol} - {selectedStock.exchange}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-gray-900 dark:text-white" data-testid="selected-stock-price">
                      {selectedStock.currency === 'USD' ? '$' : 'INR '}{selectedStock.currentPrice}
                    </p>
                    <p className={`text-lg ${parseFloat(selectedStock.dayChange || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="selected-stock-change">
                      {parseFloat(selectedStock.dayChange || '0') >= 0 ? '+' : ''}{selectedStock.dayChange} ({selectedStock.dayChangePercent}%)
                    </p>
                  </div>
                </div>
                
                {/* Stock Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Open</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="stock-open">
                        {selectedStock.currency === 'USD' ? '$' : 'INR '}{selectedStock.previousClose}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">High</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="stock-high">
                        {selectedStock.currency === 'USD' ? '$' : 'INR '}{selectedStock.dayHigh}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Low</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="stock-low">
                        {selectedStock.currency === 'USD' ? '$' : 'INR '}{selectedStock.dayLow}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Volume</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="stock-volume">
                        {selectedStock.volume ? (selectedStock.volume / 1000000).toFixed(1) + 'M' : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Chart and Trading Interface */}
              <div className="flex-1 flex">
                {/* Chart Area */}
                <div className="flex-1 p-6">
                  <StockChart stock={selectedStock} liveDataEnabled={liveDataEnabled} />
                </div>

                {/* Trading Panel */}
                <div className="w-80 p-6">
                  <div className="space-y-6">
                    <AIPrediction stock={selectedStock} />
                    <TradingPanel stock={selectedStock} portfolio={portfolio as any} />
                    <PortfolioSummary portfolio={portfolio as any} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Stock</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a stock from the sidebar to view details and start trading.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
