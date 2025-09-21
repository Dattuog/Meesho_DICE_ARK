import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';

// Pages
import HomePage from './pages/HomePage';
import OrdersPage from './pages/OrdersPage';
import ReturnFlow from './pages/ReturnFlow';
import RenewedProducts from './pages/RenewedProducts';
import ImpactDashboard from './pages/ImpactDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FlashSaleDiscovery from './pages/FlashSaleDiscovery';
import NotificationManagement from './pages/NotificationManagement';
import NGOOnboarding from './pages/NGOOnboarding';
import NGOStatusTracker from './pages/NGOStatusTracker';
import WalletPage from './pages/WalletPage';
import CreditAnalyticsDashboard from './pages/CreditAnalyticsDashboard';

// Components
import Header from './components/Header';
import Navigation from './components/Navigation';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          
          <main className="pb-20 md:pb-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/return/:orderId/:itemId" element={<ReturnFlow />} />
              <Route path="/renewed" element={<RenewedProducts />} />
              <Route path="/impact" element={<ImpactDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/flash-sales" element={<FlashSaleDiscovery />} />
              <Route path="/notifications" element={<NotificationManagement />} />
              <Route path="/ngo-onboarding" element={<NGOOnboarding />} />
              <Route path="/ngo-status" element={<NGOStatusTracker />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/credit-analytics" element={<CreditAnalyticsDashboard />} />
            </Routes>
          </main>

          <Navigation />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '16px 20px',
              },
              success: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;