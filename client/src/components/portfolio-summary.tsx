import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Portfolio } from "@shared/schema";

interface PortfolioSummaryProps {
  portfolio: Portfolio | undefined;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  // Fetch holdings for detailed portfolio view
  const { data: holdings = [] } = useQuery({
    queryKey: ['/api/portfolio/holdings'],
    enabled: !!portfolio,
  });

  if (!portfolio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = parseFloat(portfolio.totalValue || '0');
  const totalInvested = parseFloat(portfolio.totalInvested || '0');
  const dayPnL = parseFloat(portfolio.dayPnL || '0');
  const totalPnL = parseFloat(portfolio.totalPnL || '0');
  const cash = parseFloat(portfolio.cash || '0');

  // Calculate portfolio value including cash
  const totalPortfolioValue = totalValue + cash;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Portfolio
          {totalPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="portfolio-total-value">
            INR {totalPortfolioValue.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Invested</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="portfolio-invested">
            INR {totalInvested.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Available Cash</span>
          <span className="text-sm font-medium text-green-600" data-testid="portfolio-cash">
            INR {cash.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Day's P&L</span>
          <span className={`text-sm font-medium ${dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="portfolio-day-pnl">
            {dayPnL >= 0 ? '+' : ''}INR {dayPnL.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total P&L</span>
          <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="portfolio-total-pnl">
            {totalPnL >= 0 ? '+' : ''}INR {totalPnL.toLocaleString()}
          </span>
        </div>

        {(holdings as any[]).length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Holdings ({(holdings as any[]).length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(holdings as any[]).slice(0, 3).map((holding: any) => (
                <div key={holding.id} className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {holding.stock?.symbol || 'Unknown'} ({holding.quantity})
                  </span>
                  <span className={`font-medium ${parseFloat(holding.pnl || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(holding.pnl || '0') >= 0 ? '+' : ''}INR {parseFloat(holding.pnl || '0').toFixed(0)}
                  </span>
                </div>
              ))}
              {(holdings as any[]).length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{(holdings as any[]).length - 3} more holdings
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
