import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, Gift, Settings, Download, 
  Calendar, Filter, RefreshCw, AlertCircle 
} from 'lucide-react';
import api from '../services/api';

const CreditAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
    loadConfiguration();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/api/v1/credit/analytics?period=${selectedPeriod}`);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Analytics loading error:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async () => {
    try {
      const response = await api.get('/api/v1/credit/config');
      if (response.data.success) {
        setConfig(response.data.configuration);
      }
    } catch (error) {
      console.error('Config loading error:', error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setLoading(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => `${parseFloat(value).toFixed(1)}%`;

  // Color scheme for charts
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const trends = analytics?.trends || [];
  const recentTransactions = analytics?.recentTransactions || [];

  // Prepare chart data
  const trendsChartData = trends.map(trend => ({
    month: trend.month_year,
    credits: parseFloat(trend.total_credits_issued || 0),
    savings: parseFloat(trend.total_seller_savings || 0),
    transactions: parseInt(trend.total_transactions || 0)
  }));

  // Category breakdown data for pie chart
  const categoryData = [];
  if (trends.length > 0 && trends[0].category_breakdown) {
    const breakdown = trends[0].category_breakdown;
    Object.keys(breakdown).forEach(category => {
      categoryData.push({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: parseFloat(breakdown[category].totalCredits || 0),
        transactions: breakdown[category].transactions || 0
      });
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Management Analytics</h1>
          <p className="text-gray-600 mt-1">NGO donation credit system performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
          >
            <option value="current_month">Current Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
          </select>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <Settings className="w-4 h-4" />
            <span>Config</span>
          </button>
          <button
            onClick={loadAnalytics}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Credits Issued</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary.total_credits_issued || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-4">
            <p className="text-purple-200 text-sm">
              {summary.total_transactions || 0} transactions
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Total Seller Savings</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary.total_seller_savings || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
          <div className="mt-4">
            <p className="text-green-200 text-sm">
              {formatPercentage(summary.seller_savings_rate || 0)} savings rate
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Platform Savings</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary.total_platform_savings || 0)}
              </p>
            </div>
            <Gift className="w-8 h-8 text-blue-200" />
          </div>
          <div className="mt-4">
            <p className="text-blue-200 text-sm">
              Cost efficiency: {formatPercentage(summary.cost_efficiency_ratio * 100 || 0)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm">Avg Credit Amount</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary.average_credit_amount || 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
          <div className="mt-4">
            <p className="text-orange-200 text-sm">
              Per donation credit
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Credits vs Savings Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credits vs Seller Savings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="credits"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.6}
                name="Credits Issued"
              />
              <Area
                type="monotone"
                dataKey="savings"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Seller Savings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Volume Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                name="Transactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credits by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {recentTransactions.slice(0, 8).map((transaction, index) => (
              <div key={transaction.transaction_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(transaction.buyer_credit_amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.product_category} • Saved: {formatCurrency(transaction.seller_savings)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-green-600">
                    +{formatPercentage(transaction.seller_savings_percentage)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && config && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Credit Configuration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Credit Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer Credit %:</span>
                  <span className="font-medium">{config.creditConfig.buyerCreditPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Credit %:</span>
                  <span className="font-medium">{config.creditConfig.maxCreditPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Credit:</span>
                  <span className="font-medium">₹{config.creditConfig.minCreditAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Credit:</span>
                  <span className="font-medium">₹{config.creditConfig.maxCreditAmount}</span>
                </div>
              </div>
            </div>

            {/* Cost Sharing */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Cost Sharing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller Share:</span>
                  <span className="font-medium">{config.costSharingConfig.seller}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Meesho Share:</span>
                  <span className="font-medium">{config.costSharingConfig.meesho}%</span>
                </div>
              </div>
            </div>

            {/* Cost Factors Example */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Cost Factors (Fashion)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Reverse Logistics:</span>
                  <span className="font-medium">{config.costFactors.reverseLogistics.fashion.base}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Warehouse:</span>
                  <span className="font-medium">{config.costFactors.warehouseProcessing.fashion}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Write-off Risk:</span>
                  <span className="font-medium">{config.costFactors.productWriteOff.fashion}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditAnalyticsDashboard;