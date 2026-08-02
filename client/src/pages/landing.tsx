import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, TrendingUp, Shield, Zap, Brain, Globe, DollarSign } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-600" data-testid="logo">GROW HIKE</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">Smart Trading Platform</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button 
              onClick={handleLogin}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="login-button"
            >
              Enter App
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6" data-testid="hero-title">
            India's Smart Trading Platform
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto" data-testid="hero-description">
            Trade Indian and international stocks with AI-powered predictions, real-time analytics, and risk-free mock trading.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-3"
            data-testid="hero-cta"
          >
            Start Trading Now
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12" data-testid="features-title">
            Why Choose GROW HIKE?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-gray-200 dark:border-gray-700" data-testid="feature-ai">
              <CardContent className="p-6">
                <Brain className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Predictions</h4>
                <p className="text-gray-600 dark:text-gray-400">Advanced machine learning algorithms analyze market trends to provide accurate price predictions.</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700" data-testid="feature-markets">
              <CardContent className="p-6">
                <Globe className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Multi-Market Access</h4>
                <p className="text-gray-600 dark:text-gray-400">Trade across Indian (NSE/BSE) and international markets (NASDAQ/NYSE) from one platform.</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700" data-testid="feature-mock">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Risk-Free Trading</h4>
                <p className="text-gray-600 dark:text-gray-400">Practice with virtual money and build confidence before investing real capital.</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700" data-testid="feature-ipo">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">IPO Analytics</h4>
                <p className="text-gray-600 dark:text-gray-400">Get real-time IPO data with GMP tracking and AI-powered listing predictions.</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700" data-testid="feature-realtime">
              <CardContent className="p-6">
                <Zap className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Real-Time Data</h4>
                <p className="text-gray-600 dark:text-gray-400">Live market data with instant updates and advanced charting tools.</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700" data-testid="feature-portfolio">
              <CardContent className="p-6">
                <DollarSign className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Portfolio Management</h4>
                <p className="text-gray-600 dark:text-gray-400">Track your investments with detailed analytics and performance metrics.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4" data-testid="cta-title">
            Ready to Start Your Trading Journey?
          </h3>
          <p className="text-xl text-green-100 mb-8" data-testid="cta-description">
            Join thousands of traders who trust GROW HIKE for smart investing.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            variant="secondary"
            className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3"
            data-testid="cta-button"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400" data-testid="footer-text">
            © 2025 GROW HIKE. All rights reserved. Your trusted partner in smart trading.
          </p>
        </div>
      </footer>
    </div>
  );
}
