import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Upload, Search, Edit2, Save, X, Plus } from 'lucide-react';

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  // State management
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit account state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bank_name: '',
    account_type: 'savings',
    masked_account: '',
    currency: 'INR',
    balance: 0
  });

  // CSV upload state
  const [csvFile, setCSVFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ NEW: Manual transaction state
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    category: '',
    merchant: '',
    amount: 0,
    currency: 'INR',
    txn_type: 'debit',
    txn_date: new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
  });

  // ✅ NEW: Edit transaction state
  const [editingTxn, setEditingTxn] = useState(null);
  const [showEditTxnModal, setShowEditTxnModal] = useState(false);
  const [editTxnForm, setEditTxnForm] = useState({
    description: '',
    category: '',
    merchant: '',
    amount: 0,
    currency: 'INR',
    txn_type: 'debit',
    txn_date: ''
  });

  useEffect(() => {
    if (accountId && accountId !== 'undefined') {
      loadAllData();
    } else {
      alert('Invalid account ID');
      navigate('/dashboard');
    }
  }, [accountId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load account details
      const accountRes = await api.get(`/accounts/${accountId}`);
      setAccount(accountRes.data);
      setEditForm({
        bank_name: accountRes.data.bank_name,
        account_type: accountRes.data.account_type,
        masked_account: accountRes.data.masked_account,
        currency: accountRes.data.currency,
        balance: accountRes.data.balance
      });

      // Load transactions for this account
      const txnRes = await api.get(`/transactions/?account_id=${accountId}`);
      setTransactions(txnRes.data);

      // Load stats/summary
      try {
        const statsRes = await api.get(`/transactions/summary/${accountId}`);
        setStats(statsRes.data);
      } catch (err) {
        console.log('No stats available yet');
        setStats(null);
      }
    } catch (err) {
      console.error('Error loading account:', err);
      alert('Failed to load account details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/accounts/${accountId}`, {
        bank_name: editForm.bank_name,
        account_type: editForm.account_type,
        masked_account: editForm.masked_account,
        currency: editForm.currency,
        balance: parseFloat(editForm.balance)
      });
      alert('Account updated successfully!');
      setIsEditing(false);
      loadAllData();
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    setUploading(true);
    try {
      const res = await api.post(`/transactions/upload-csv/${accountId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      let message = `Success! ${res.data.transactions_created} transactions imported.`;
      if (res.data.errors && res.data.errors.length > 0) {
        message += ` ${res.data.errors.length} rows had errors (check console for details).`;
        console.warn('CSV Upload Errors:', res.data.errors);
      }

      alert(message);
      setCSVFile(null);
      document.getElementById('csvFileInput').value = '';
      loadAllData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Upload failed';
      alert(`CSV Upload Error: ${errorMsg}`);
      console.error('Upload error:', err.response?.data);
    } finally {
      setUploading(false);
    }
  };

  // ✅ NEW: Handle manual transaction creation
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        account_id: parseInt(accountId),
        description: newTransaction.description || null,
        category: newTransaction.category || null, // Empty = auto-categorize
        merchant: newTransaction.merchant || null,
        amount: parseFloat(newTransaction.amount),
        currency: newTransaction.currency,
        txn_type: newTransaction.txn_type,
        txn_date: newTransaction.txn_date
      };

      await api.post('/transactions/', payload);
      alert('Transaction added successfully!');
      setShowAddTxnModal(false);
      setNewTransaction({
        description: '',
        category: '',
        merchant: '',
        amount: 0,
        currency: 'INR',
        txn_type: 'debit',
        txn_date: new Date().toISOString().slice(0, 16)
      });
      loadAllData(); // Refresh data
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to add transaction';
      alert(`Error: ${errorMsg}`);
      console.error('Add transaction error:', err.response?.data);
    }
  };

  // ✅ NEW: Open edit transaction modal
  const handleEditTransaction = (txn) => {
    setEditingTxn(txn);
    setEditTxnForm({
      description: txn.description || '',
      category: txn.category || '',
      merchant: txn.merchant || '',
      amount: txn.amount,
      currency: txn.currency,
      txn_type: txn.txn_type,
      txn_date: new Date(txn.txn_date).toISOString().slice(0, 16)
    });
    setShowEditTxnModal(true);
  };

  // ✅ NEW: Handle transaction update
  const handleUpdateTransaction = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        description: editTxnForm.description || null,
        category: editTxnForm.category || null,
        merchant: editTxnForm.merchant || null,
        amount: parseFloat(editTxnForm.amount),
        currency: editTxnForm.currency,
        txn_type: editTxnForm.txn_type,
        txn_date: editTxnForm.txn_date
      };

      await api.put(`/transactions/${editingTxn.id}`, payload);
      alert('Transaction updated successfully!');
      setShowEditTxnModal(false);
      setEditingTxn(null);
      loadAllData(); // Refresh data
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update transaction';
      alert(`Error: ${errorMsg}`);
      console.error('Update transaction error:', err.response?.data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading account details...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">Account not found</div>
      </div>
    );
  }

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(txn => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      txn.id.toString().includes(query) ||
      txn.description?.toLowerCase().includes(query) ||
      txn.category?.toLowerCase().includes(query) ||
      txn.merchant?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Account Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{account.bank_name}</h1>
              <p className="text-gray-600 text-sm uppercase mt-1">
                {account.account_type.replace('_', ' ')} • {account.masked_account}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              {isEditing ? <X size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'Cancel' : 'Edit Account'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateAccount} className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bank_name}
                    onChange={e => setEditForm({...editForm, bank_name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    value={editForm.account_type}
                    onChange={e => setEditForm({...editForm, account_type: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="creditcard">Credit Card</option>
                    <option value="loan">Loan</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masked Account</label>
                  <input
                    type="text"
                    value={editForm.masked_account}
                    onChange={e => setEditForm({...editForm, masked_account: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={editForm.currency}
                    onChange={e => setEditForm({...editForm, currency: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    maxLength="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.balance}
                    onChange={e => setEditForm({...editForm, balance: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
              >
                <Save size={18} className="inline mr-2" />
                Save Changes
              </button>
            </form>
          ) : (
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Currency</p>
                <p className="text-lg font-semibold text-gray-800">{account.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-800">
                  {account.currency} {account.balance.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-800">{stats.transaction_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Income</p>
            <p className="text-2xl font-bold text-green-600">+₹{stats.total_income.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">-₹{stats.total_expenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Net Flow</p>
            <p className={`text-2xl font-bold ${stats.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.net_flow >= 0 ? '+' : ''}₹{stats.net_flow.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* ✅ NEW: Add Transactions Section with Manual Entry and CSV Upload */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add Transactions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Entry */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <Plus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">Manual Entry</h3>
            <p className="text-sm text-gray-500 mb-4">Add a single transaction manually</p>
            <button
              onClick={() => setShowAddTxnModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Add Transaction
            </button>
          </div>

          {/* CSV Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2 text-center">CSV Upload</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">Bulk import transactions</p>
            
            <form onSubmit={handleCSVUpload} className="space-y-3">
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                onChange={(e) => setCSVFile(e.target.files[0])}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="submit"
                disabled={!csvFile || uploading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>

            <div className="mt-4 text-xs text-gray-500">
              <p className="font-medium mb-1">Required columns:</p>
              <code className="bg-gray-100 px-1 rounded">amount</code>,{' '}
              <code className="bg-gray-100 px-1 rounded">txn_type</code>,{' '}
              <code className="bg-gray-100 px-1 rounded">txn_date</code>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {transactions.length === 0 ? 'No transactions yet. Add some above!' : 'No matching transactions found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600">#{txn.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{txn.description || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {txn.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{txn.merchant || 'N/A'}</td>
                    <td className={`px-4 py-3 text-sm font-bold ${txn.txn_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.txn_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        txn.txn_type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {txn.txn_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(txn.txn_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEditTransaction(txn)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        <Edit2 size={16} className="inline mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ NEW: Add Transaction Modal */}
      {showAddTxnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Add New Transaction</h3>
              <button
                onClick={() => setShowAddTxnModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Coffee at Starbucks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-gray-500 text-xs">(leave empty to auto-categorize)</span>
                </label>
                <input
                  type="text"
                  value={newTransaction.category}
                  onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Food & Dining"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                <input
                  type="text"
                  value={newTransaction.merchant}
                  onChange={e => setNewTransaction({...newTransaction, merchant: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Starbucks"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <input
                    type="text"
                    value={newTransaction.currency}
                    onChange={e => setNewTransaction({...newTransaction, currency: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    maxLength="3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
                <select
                  value={newTransaction.txn_type}
                  onChange={e => setNewTransaction({...newTransaction, txn_type: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="debit">Debit (Expense)</option>
                  <option value="credit">Credit (Income)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
                <input
                  type="datetime-local"
                  value={newTransaction.txn_date}
                  onChange={e => setNewTransaction({...newTransaction, txn_date: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTxnModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NEW: Edit Transaction Modal */}
      {showEditTxnModal && editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Edit Transaction #{editingTxn.id}</h3>
              <button
                onClick={() => setShowEditTxnModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editTxnForm.description}
                  onChange={e => setEditTxnForm({...editTxnForm, description: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editTxnForm.category}
                  onChange={e => setEditTxnForm({...editTxnForm, category: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                <input
                  type="text"
                  value={editTxnForm.merchant}
                  onChange={e => setEditTxnForm({...editTxnForm, merchant: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editTxnForm.amount}
                    onChange={e => setEditTxnForm({...editTxnForm, amount: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={editTxnForm.currency}
                    onChange={e => setEditTxnForm({...editTxnForm, currency: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    maxLength="3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={editTxnForm.txn_type}
                  onChange={e => setEditTxnForm({...editTxnForm, txn_type: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="debit">Debit (Expense)</option>
                  <option value="credit">Credit (Income)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                <input
                  type="datetime-local"
                  value={editTxnForm.txn_date}
                  onChange={e => setEditTxnForm({...editTxnForm, txn_date: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Update Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditTxnModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
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
