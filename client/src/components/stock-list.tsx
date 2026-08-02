import { Card, CardContent } from "@/components/ui/card";
import type { Stock } from "@shared/schema";

interface StockListProps {
  stocks: Stock[];
  loading: boolean;
  selectedStock: Stock | null;
  onStockSelect: (stock: Stock) => void;
}

export default function StockList({ stocks, loading, selectedStock, onStockSelect }: StockListProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading stocks...</p>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No stocks found</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-4 space-y-3" data-testid="stock-list">
      {stocks.map((stock) => (
        <Card
          key={stock.id}
          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
            selectedStock?.id === stock.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onStockSelect(stock)}
          data-testid={`stock-${stock.id}`}
        >
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{stock.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stock.symbol} - {stock.exchange}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  {stock.currency === 'USD' ? '$' : 'INR '}{stock.currentPrice}
                </p>
                <p className={`text-sm ${parseFloat(stock.dayChangePercent || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(stock.dayChangePercent || '0') >= 0 ? '+' : ''}{stock.dayChangePercent}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
