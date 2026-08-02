import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Stock, Portfolio } from "@shared/schema";

interface TradingPanelProps {
  stock: Stock;
  portfolio: Portfolio | undefined;
}

export default function TradingPanel({ stock, portfolio }: TradingPanelProps) {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(1);
  const [priceType, setPriceType] = useState<string>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${orderType === 'buy' ? 'Buy' : 'Sell'} order placed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      // Reset form
      setQuantity(1);
      setLimitPrice('');
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
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = () => {
    const currentPrice = parseFloat(stock.currentPrice || '0');
    const price = priceType === 'market' ? currentPrice : parseFloat(limitPrice);
    
    if (priceType === 'limit' && !limitPrice) {
      toast({
        title: "Error",
        description: "Please enter a limit price",
        variant: "destructive",
      });
      return;
    }

    orderMutation.mutate({
      stockId: stock.id,
      type: orderType,
      orderType: priceType,
      quantity,
      price: price.toString(),
    });
  };

  const totalAmount = quantity * (priceType === 'market' 
    ? parseFloat(stock.currentPrice || '0') 
    : parseFloat(limitPrice || '0')
  );

  const availableCash = parseFloat(portfolio?.cash || '0');
  const currency = stock.currency === 'USD' ? '$' : '₹';

  return (
    <Card>
      <CardHeader>
        <div className="flex space-x-2">
          <Button
            variant={orderType === 'buy' ? 'default' : 'outline'}
            className={`flex-1 ${orderType === 'buy' ? 'bg-green-600 text-white' : ''}`}
            onClick={() => setOrderType('buy')}
            data-testid="order-type-buy"
          >
            Buy
          </Button>
          <Button
            variant={orderType === 'sell' ? 'default' : 'outline'}
            className={`flex-1 ${orderType === 'sell' ? 'bg-red-600 text-white' : ''}`}
            onClick={() => setOrderType('sell')}
            data-testid="order-type-sell"
          >
            Sell
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            data-testid="quantity-input"
          />
        </div>
        
        <div>
          <Label htmlFor="price-type">Order Type</Label>
          <Select value={priceType} onValueChange={setPriceType}>
            <SelectTrigger data-testid="price-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="limit">Limit</SelectItem>
              <SelectItem value="stop_loss">Stop Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {priceType === 'limit' && (
          <div>
            <Label htmlFor="limit-price">Limit Price</Label>
            <Input
              id="limit-price"
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={`${currency}${stock.currentPrice}`}
              step="0.01"
              data-testid="limit-price-input"
            />
          </div>
        )}
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
            <span className="font-medium text-gray-900 dark:text-white" data-testid="total-amount">
              {currency}{totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-600 dark:text-gray-400">Available Cash</span>
            <span className="font-medium text-green-600" data-testid="available-cash">
              {currency}{availableCash.toFixed(2)}
            </span>
          </div>
          
          <Button
            className={`w-full ${orderType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            onClick={handlePlaceOrder}
            disabled={orderMutation.isPending || (orderType === 'buy' && totalAmount > availableCash)}
            data-testid="place-order-button"
          >
            {orderMutation.isPending ? (
              'Placing Order...'
            ) : (
              `Place ${orderType === 'buy' ? 'Buy' : 'Sell'} Order`
            )}
          </Button>
          
          {orderType === 'buy' && totalAmount > availableCash && (
            <p className="text-sm text-red-600 mt-2" data-testid="insufficient-funds-warning">
              Insufficient funds for this order
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
