import { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chart, registerables } from 'chart.js';
import type { Stock } from "@shared/schema";

Chart.register(...registerables);

interface StockChartProps {
  stock: Stock;
  liveDataEnabled?: boolean;
}

export default function StockChart({ stock, liveDataEnabled = true }: StockChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch price history
  const { data: priceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/stocks', stock.id, 'history', liveDataEnabled],
    queryFn: async () => {
      const params = new URLSearchParams({ days: '30' });
      if (liveDataEnabled) params.append('live', 'true');
      
      const response = await fetch(`/api/stocks/${stock.id}/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch price history');
      return response.json();
    },
    enabled: !!stock.id,
    refetchInterval: liveDataEnabled ? 60000 : false, // Refresh every minute for live data
  });

  useEffect(() => {
    if (chartRef.current && (priceHistory.length > 0 || stock)) {
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Use actual price history if available, otherwise create sample data
      let labels: string[] = [];
      let data: number[] = [];

      if (priceHistory.length > 0) {
        labels = priceHistory.map((item: any) => 
          new Date(item.timestamp).toLocaleDateString()
        );
        data = priceHistory.map((item: any) => parseFloat(item.close));
      } else {
        // Generate sample intraday data
        const currentPrice = parseFloat(stock.currentPrice || '0');
        const baseTime = new Date();
        baseTime.setHours(9, 30, 0, 0); // Market opening time

        for (let i = 0; i < 13; i++) {
          const time = new Date(baseTime);
          time.setMinutes(time.getMinutes() + i * 30);
          labels.push(time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
          }));
          
          // Create realistic price variation around current price
          const variation = (Math.random() - 0.5) * (currentPrice * 0.02);
          data.push(currentPrice + variation);
        }
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Price',
            data,
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#22C55E',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const currency = stock.currency === 'USD' ? '$' : '₹';
                  return `Price: ${currency}${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                color: 'rgba(156, 163, 175, 0.2)'
              },
              ticks: {
                color: '#6B7280',
                callback: function(value) {
                  const currency = stock.currency === 'USD' ? '$' : '₹';
                  return `${currency}${(value as number).toFixed(0)}`;
                }
              }
            },
            x: {
              grid: {
                color: 'rgba(156, 163, 175, 0.2)'
              },
              ticks: {
                color: '#6B7280',
                maxTicksLimit: 8
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stock, priceHistory]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex space-x-2">
            <Button variant="default" size="sm" className="bg-green-600 text-white" data-testid="timeframe-1d">1D</Button>
            <Button variant="ghost" size="sm" data-testid="timeframe-1w">1W</Button>
            <Button variant="ghost" size="sm" data-testid="timeframe-1m">1M</Button>
            <Button variant="ghost" size="sm" data-testid="timeframe-1y">1Y</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-96">
        <canvas ref={chartRef} className="w-full h-full" data-testid="stock-chart" />
      </CardContent>
    </Card>
  );
}
