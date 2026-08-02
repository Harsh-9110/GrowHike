import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, RefreshCw, Activity, TrendingUp, Globe } from 'lucide-react';

interface APIHealth {
  alphaVantage: boolean;
  twelveData: boolean;
  yahooFinance: boolean;
  polygon: boolean;
}

interface IPOAPIHealth {
  moneyControl: boolean;
  ipoGrade: boolean;
  chittorgarh: boolean;
}

export default function APIManagement() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: stockAPIHealth, isLoading: stockLoading, refetch: refetchStock } = useQuery<APIHealth>({
    queryKey: ['/api/health/stock-apis'],
    refetchInterval: 30000,
  });

  const { data: ipoAPIHealth, isLoading: ipoLoading, refetch: refetchIPO } = useQuery<IPOAPIHealth>({
    queryKey: ['/api/health/ipo-apis'],
    refetchInterval: 30000,
  });

  const handleRefreshStatus = () => {
    void refetchStock();
    void refetchIPO();
  };

  const handleRefreshData = async (type: 'stocks' | 'ipos' | 'all') => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/refresh-live-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        console.log(`${type} data refreshed successfully`);
      }
    } catch (error) {
      console.error(`Failed to refresh ${type} data:`, error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            API Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage live stock market data APIs</p>
        </div>
        <Button
          onClick={handleRefreshStatus}
          variant="outline" 
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock Market APIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stock Market APIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stockLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stockAPIHealth?.alphaVantage || false)}
                    <span className="font-medium">Alpha Vantage</span>
                  </div>
                  {getStatusBadge(stockAPIHealth?.alphaVantage || false)}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stockAPIHealth?.twelveData || false)}
                    <span className="font-medium">Twelve Data</span>
                  </div>
                  {getStatusBadge(stockAPIHealth?.twelveData || false)}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stockAPIHealth?.yahooFinance || false)}
                    <span className="font-medium">Yahoo Finance</span>
                  </div>
                  {getStatusBadge(stockAPIHealth?.yahooFinance || false)}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stockAPIHealth?.polygon || false)}
                    <span className="font-medium">Polygon.io</span>
                  </div>
                  {getStatusBadge(stockAPIHealth?.polygon || false)}
                </div>
              </div>
            )}
            
            <Separator />
            
            <Button 
              onClick={() => handleRefreshData('stocks')} 
              disabled={refreshing}
              className="w-full"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Stock Data
            </Button>
          </CardContent>
        </Card>

        {/* IPO APIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              IPO Data APIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ipoLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ipoAPIHealth?.moneyControl || false)}
                    <span className="font-medium">MoneyControl</span>
                  </div>
                  {getStatusBadge(ipoAPIHealth?.moneyControl || false)}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ipoAPIHealth?.ipoGrade || false)}
                    <span className="font-medium">IPO Grade</span>
                  </div>
                  {getStatusBadge(ipoAPIHealth?.ipoGrade || false)}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ipoAPIHealth?.chittorgarh || false)}
                    <span className="font-medium">Chittorgarh</span>
                  </div>
                  {getStatusBadge(ipoAPIHealth?.chittorgarh || false)}
                </div>
              </div>
            )}
            
            <Separator />
            
            <Button 
              onClick={() => handleRefreshData('ipos')} 
              disabled={refreshing}
              className="w-full"
              variant="outline"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh IPO Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Refresh All Data */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Data Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => handleRefreshData('all')} 
              disabled={refreshing}
              size="lg"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh All Live Data
            </Button>
            
            <div className="flex-1 text-sm text-muted-foreground flex items-center">
              This will fetch fresh data from all available APIs and update the database.
              Process may take 30-60 seconds depending on API response times.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Stock Data Coverage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- 50+ Indian stocks (NSE/BSE)</li>
                <li>- 80+ International stocks (NASDAQ/NYSE)</li>
                <li>- Real-time price updates</li>
                <li>- Historical price data</li>
                <li>- Market cap and volume data</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">IPO Data Coverage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Upcoming IPO listings</li>
                <li>- Grey Market Premium (GMP)</li>
                <li>- Price range and dates</li>
                <li>- Mainboard and SME IPOs</li>
                <li>- Real-time status updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
