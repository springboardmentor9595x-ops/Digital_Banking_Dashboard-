import { useState, useEffect } from 'react';
import Header from '../common/Header';
import AccountsList from './AccountsList';
import TransactionsView from './TransactionsView';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('accounts'); // 'accounts' or 'transactions'
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.ACCOUNTS);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      alert('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = (accountId) => {
    setSelectedAccountId(accountId);
    setCurrentView('transactions');
  };

  const handleBackToAccounts = () => {
    setCurrentView('accounts');
    setSelectedAccountId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Modern Digital Banking" showLogout={true} />
      
      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'accounts' ? (
          <AccountsList
            accounts={accounts}
            loading={loading}
            onReload={loadAccounts}
            onViewTransactions={handleViewTransactions}
          />
        ) : (
          <TransactionsView
            accountId={selectedAccountId}
            onBack={handleBackToAccounts}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;