import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Gift, ShoppingCart, Calendar, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';

const WalletPage = ({ userId = 'user123' }) => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWalletData();
  }, [userId]);

  const loadWalletData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/v1/credit/wallet/${userId}`);
      
      if (response.data.success) {
        setWalletData(response.data);
      } else {
        setError(response.data.message || 'Failed to load wallet data');
      }
    } catch (error) {
      console.error('Wallet data error:', error);
      setError('Unable to load wallet information');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadWalletData(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ngo_donation_credit':
        return <Gift className="w-5 h-5 text-green-500" />;
      case 'purchase':
        return <ShoppingCart className="w-5 h-5 text-red-500" />;
      case 'refund':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type, amount) => {
    if (amount > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getTransactionDescription = (transaction) => {
    switch (transaction.type) {
      case 'ngo_donation_credit':
        return 'NGO Donation Credit';
      case 'purchase':
        return 'Purchase Payment';
      case 'refund':
        return 'Refund Credit';
      case 'cashback':
        return 'Cashback Credit';
      default:
        return transaction.description || 'Transaction';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-xl h-32 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadWalletData()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Add null check before destructuring
  if (!walletData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-600 mb-4">No wallet data available</p>
          <button
            onClick={() => loadWalletData()}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Load Wallet
          </button>
        </div>
      </div>
    );
  }

  const { wallet, transactions, pagination } = walletData;

  // Additional safety check for wallet object
  if (!wallet) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-600 mb-4">Wallet not found. Creating new wallet...</p>
          <button
            onClick={() => loadWalletData()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Initialize Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your credits and transactions</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Wallet Balance</h2>
              <p className="text-purple-200 text-sm">Available for purchases</p>
            </div>
          </div>
        </div>
        
        <div className="text-4xl font-bold mb-4">
          ₹{parseFloat(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-purple-200 text-sm">Total Earned</p>
            <p className="text-lg font-semibold">
              ₹{parseFloat(wallet.total_credits_earned).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-purple-200 text-sm">Total Spent</p>
            <p className="text-lg font-semibold">
              ₹{parseFloat(wallet.total_spent).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-purple-200 text-sm">NGO Credits</p>
            <p className="text-lg font-semibold">
              ₹{parseFloat(wallet.summary?.total_ngo_credits || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">NGO Donations</p>
              <p className="text-xl font-bold text-gray-900">
                {wallet.summary?.completed_transactions || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Credits from donations</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{parseFloat(wallet.summary?.total_credits || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">All credit transactions</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Debits</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{parseFloat(wallet.summary?.total_debits || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Purchase payments</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <p className="text-sm text-gray-600 mt-1">
                Recent wallet activity
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Last 30 days</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.transaction_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getTransactionDescription(transaction)}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </p>
                        {transaction.order_id && (
                          <p className="text-sm text-gray-500">
                            Order: {transaction.order_id.substring(0, 12)}...
                          </p>
                        )}
                        {transaction.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total > pagination.limit && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {Math.min(pagination.limit, transactions.length)} of {pagination.total} transactions
              </p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;