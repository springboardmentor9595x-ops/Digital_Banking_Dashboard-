import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import AccountTransactionsTable from '../components/Accounts/AccountTransactionsTable';
import AddTransactionsSection from '../components/Accounts/AddTransactionsSection';

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  // ── Core data state (unchanged) ────────────────────────────────────────────
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Edit account state (unchanged) ────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bank_name: '',
    account_type: 'savings',
    masked_account: '',
    currency: 'INR',
    balance: 0,
  });

  // ── Edit transaction state (unchanged, modal stays here) ──────────────────
  const [editingTxn, setEditingTxn] = useState(null);
  const [showEditTxnModal, setShowEditTxnModal] = useState(false);
  const [editTxnForm, setEditTxnForm] = useState({
    description: '',
    category: '',
    merchant: '',
    amount: 0,
    currency: 'INR',
    txn_type: 'debit',
    txn_date: '',
  });

  // ── Bootstrap (unchanged) ─────────────────────────────────────────────────
  useEffect(() => {
    if (accountId && accountId !== 'undefined') {
      loadAllData();
    } else {
      toast.error('Invalid account ID');
      navigate('/dashboard');
    }
  }, [accountId]);

  // ── Data loader (unchanged) ───────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      const accountRes = await api.get(`/accounts/${accountId}`);
      setAccount(accountRes.data);
      setEditForm({
        bank_name: accountRes.data.bank_name,
        account_type: accountRes.data.account_type,
        masked_account: accountRes.data.masked_account,
        currency: accountRes.data.currency,
        balance: accountRes.data.balance,
      });

      const txnRes = await api.get(`/transactions/?account_id=${accountId}`);
      setTransactions(txnRes.data);

      try {
        const statsRes = await api.get(`/transactions/summary/${accountId}`);
        setStats(statsRes.data);
      } catch {
        setStats(null);
      }
    } catch (err) {
      console.error('Error loading account:', err);
      toast.error('Failed to load account details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Account update (unchanged) ────────────────────────────────────────────
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editForm.bank_name.trim())      { toast.error('Bank name is required');      return; }
    if (!editForm.masked_account.trim()) { toast.error('Account number is required'); return; }
    if (editForm.balance < 0)            { toast.error('Balance cannot be negative'); return; }

    try {
      await api.put(`/accounts/${accountId}`, {
        bank_name:      editForm.bank_name,
        account_type:   editForm.account_type,
        masked_account: editForm.masked_account,
        currency:       editForm.currency,
        balance:        parseFloat(editForm.balance),
      });
      toast.success('Account updated successfully! ');
      setIsEditing(false);
      loadAllData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.detail || 'Failed to update account');
    }
  };

  // ── Transaction edit/delete (unchanged, passed as props to table) ─────────
  const handleEditTransaction = (txn) => {
    setEditingTxn(txn);
    setEditTxnForm({
      description: txn.description || '',
      category:    txn.category    || '',
      merchant:    txn.merchant    || '',
      amount:      txn.amount,
      currency:    txn.currency,
      txn_type:    txn.txn_type,
      txn_date:    new Date(txn.txn_date).toISOString().slice(0, 16),
    });
    setShowEditTxnModal(true);
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!editTxnForm.amount || parseFloat(editTxnForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await api.put(`/transactions/${editingTxn.id}`, {
        description: editTxnForm.description || null,
        category:    editTxnForm.category    || null,
        merchant:    editTxnForm.merchant    || null,
        amount:      parseFloat(editTxnForm.amount),
        currency:    editTxnForm.currency,
        txn_type:    editTxnForm.txn_type,
        txn_date:    editTxnForm.txn_date,
      });
      toast.success('Transaction updated successfully! ');
      setShowEditTxnModal(false);
      setEditingTxn(null);
      loadAllData();
    } catch (err) {
      console.error('Update transaction error:', err.response?.data);
      toast.error(err.response?.data?.detail || 'Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${txnId}`);
      toast.success('Transaction deleted successfully');
      loadAllData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete transaction');
    }
  };

  // ── Loading & error guards (unchanged) ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4"></div>
          <p className="text-xl text-red-600 mb-4">Account not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Account Info Card — identical to original */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={editForm.bank_name}
                    onChange={e => setEditForm({...editForm, bank_name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
                  <select
                    value={editForm.account_type}
                    onChange={e => setEditForm({...editForm, account_type: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="loan">Loan</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masked Account *</label>
                  <input
                    type="text"
                    value={editForm.masked_account}
                    onChange={e => setEditForm({...editForm, masked_account: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <input
                    type="text"
                    value={editForm.currency}
                    onChange={e => setEditForm({...editForm, currency: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Balance *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.balance}
                    onChange={e => setEditForm({...editForm, balance: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
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

      {/* ── Stats Cards — identical to original ─────────────────────────────── */}
      {stats && (
        <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-800">{stats.transaction_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Total Income</p>
            <p className="text-2xl font-bold text-green-600">+₹{stats.total_income.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-gray-600 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">-₹{stats.total_expenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm">Net Flow</p>
            <p className={`text-2xl font-bold ${stats.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.net_flow >= 0 ? '+' : ''}₹{stats.net_flow.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* ── Add Transactions — replaces the old inline section ──────────────── */}
      <div className="max-w-7xl mx-auto">
        <AddTransactionsSection
          accountId={parseInt(accountId)}
          onRefreshData={loadAllData}
        />
      </div>

      {/* ── Transactions Table — replaces old inline table ───────────────────── */}
      <div className="max-w-7xl mx-auto">
        <AccountTransactionsTable
          accountId={parseInt(accountId)}
          transactions={transactions}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </div>

      {/* ── Edit Transaction Modal — identical to original, stays in parent ─── */}
      {showEditTxnModal && editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                Edit Transaction #{editingTxn.id}
              </h3>
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
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editTxnForm.category}
                  onChange={e => setEditTxnForm({...editTxnForm, category: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
                <input
                  type="text"
                  value={editTxnForm.merchant}
                  onChange={e => setEditTxnForm({...editTxnForm, merchant: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={editTxnForm.currency}
                    onChange={e => setEditTxnForm({...editTxnForm, currency: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength="3"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={editTxnForm.txn_type}
                  onChange={e => setEditTxnForm({...editTxnForm, txn_type: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white outline-none"
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
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-medium"
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
