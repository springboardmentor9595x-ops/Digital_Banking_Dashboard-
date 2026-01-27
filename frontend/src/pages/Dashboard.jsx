import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { LogOut, Search, Plus, X, Settings } from 'lucide-react'; // ✅ Added Settings icon

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bank_name: '',
    account_type: 'savings',
    masked_account: '',
    currency: 'INR',
    balance: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (err) {
      alert('Session expired. Please login again.');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts', newAccount);
      alert('Account added successfully!');
      setShowAddModal(false);
      setNewAccount({
        bank_name: '',
        account_type: 'savings',
        masked_account: '',
        currency: 'INR',
        balance: 0
      });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to add account: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAccountClick = (accountId) => {
    console.log('Navigating to account:', accountId);
    navigate(`/account/${accountId}`);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  const filteredTransactions = data.transactions.filter(txn => {
    const query = searchQuery.toLowerCase();
    return (
      txn.description?.toLowerCase().includes(query) ||
      txn.category?.toLowerCase().includes(query) ||
      txn.id.toString().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header with Categories Management and Logout */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Digital Banking Dashboard</h1>
            <p className="text-gray-600">Welcome back, {data.user.name}!</p>
          </div>
          
          {/* ✅ NEW: Categories Management + Logout Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/categories-management')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded
                hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              <Settings size={18} />
              Manage Categories
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded
                hover:bg-red-600 active:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Rest of your Dashboard code remains the same... */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
       
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">Total Accounts</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {data.summary.total_accounts || 0}
            </p>
          </div>
         
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Total Balance</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              ₹{(data.summary.total_balance || 0).toFixed(2)}
            </p>
          </div>
         
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Income</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              +₹{(data.summary.total_income || 0).toFixed(2)}
            </p>
          </div>
         
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              -₹{(data.summary.total_expenses || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Your Accounts</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded
                hover:bg-brand-hover active:bg-brand-active transition-colors"
            >
              <Plus size={18} />
              Add Account
            </button>
          </div>
         
          {data.accounts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">No accounts yet</p>
              <p className="text-sm text-gray-500">Click "Add Account" to create your first bank account</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.accounts.map(account => (
                <div
                  key={account.id}
                  onClick={() => handleAccountClick(account.id)}
                  className="border-2 border-gray-200 p-5 rounded-lg hover:shadow-xl
                    hover:border-brand-blue transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{account.bank_name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                        {account.account_type.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      {account.masked_account}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {account.currency} {account.balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-brand-blue font-medium">
                    Click to view details →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Transactions Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Transactions</h2>
         
          {data.transactions.length > 0 && (
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by description, category, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-opacity-20"
              />
            </div>
          )}

          {data.transactions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">No transactions made yet</p>
              <p className="text-sm text-gray-500">Add an account and upload transactions to get started</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-lg">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No matching transactions found</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Merchant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredTransactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">#{txn.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{txn.description || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {txn.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{txn.merchant || 'N/A'}</td>
                        <td className={`px-4 py-3 text-sm font-bold ${
                          txn.txn_type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txn.txn_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            txn.txn_type === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {txn.txn_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(txn.txn_date).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal - Keep existing code */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Add New Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
           
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                <input
                  type="text"
                  value={newAccount.bank_name}
                  onChange={e => setNewAccount({...newAccount, bank_name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-opacity-20"
                  placeholder="e.g., HDFC Bank"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
                <select
                  value={newAccount.account_type}
                  onChange={e => setNewAccount({...newAccount, account_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-opacity-20 bg-white"
                >
                  <option value="savings">Savings</option>
                  <option value="checking">Checking</option>
                  <option value="creditcard">Credit Card</option>
                  <option value="loan">Loan</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Masked Account Number *</label>
                <input
                  type="text"
                  value={newAccount.masked_account}
                  onChange={e => setNewAccount({...newAccount, masked_account: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-opacity-20"
                  placeholder="e.g., ****1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                <input
                  type="text"
                  value={newAccount.currency}
                  onChange={e => setNewAccount({...newAccount, currency: e.target.value.toUpperCase()})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-opacity-20"
                  placeholder="INR"
                  maxLength="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAccount.balance}
                  onChange={e => setNewAccount({...newAccount, balance: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue focus:ring-opacity-20"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-brand-blue text-white py-3 rounded-lg font-semibold
                    hover:bg-brand-hover active:bg-brand-active transition-colors"
                >
                  Add Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold
                    hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
