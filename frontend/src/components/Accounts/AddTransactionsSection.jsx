import React, { useState, useEffect } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const AddTransactionsSection = ({ accountId, onRefreshData }) => {
  const [csvFile, setCSVFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    category: '',
    merchant: '',
    amount: '',
    currency: 'INR',
    txn_type: 'debit',
    txn_date: new Date().toISOString().slice(0, 16)
  });
  const [categories, setCategories] = useState([]);

  // ✅ FIX 1: Normalize whatever shape the API returns into a plain array
  useEffect(() => {
    api.get('/categories/')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else if (data && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        // Fallback if endpoint doesn't exist or fails
        setCategories([
          'Food & Dining', 'Groceries', 'Transport',
          'Entertainment', 'Utilities', 'Salary', 'Shopping'
        ]);
      });
  }, []);

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    if (!csvFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);
    setUploading(true);
    try {
      const res = await api.post(`/transactions/upload-csv/${accountId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { transactions_created, errors } = res.data;
      if (transactions_created > 0) {
        toast.success(`Imported ${transactions_created} transaction${transactions_created !== 1 ? 's' : ''}!`);
      }
      if (errors?.length) {
        toast.warn(`${errors.length} row${errors.length > 1 ? 's' : ''} skipped`);
      }
      setCSVFile(null);
      document.getElementById('csvFileInput').value = '';
      onRefreshData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'CSV upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
      toast.error('Valid amount required');
      return;
    }
    try {
      await api.post('/transactions/', {
        account_id: parseInt(accountId),
        description: newTransaction.description || null,
        category: newTransaction.category || null,
        merchant: newTransaction.merchant || null,
        amount: parseFloat(newTransaction.amount),
        currency: newTransaction.currency,
        txn_type: newTransaction.txn_type,
        txn_date: newTransaction.txn_date
      });
      toast.success('Transaction added!');
      setShowAddTxnModal(false);
      setNewTransaction({
        description: '', category: '', merchant: '', amount: '', currency: 'INR',
        txn_type: 'debit', txn_date: new Date().toISOString().slice(0, 16)
      });
      onRefreshData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add transaction');
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Add Transactions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Manual Entry */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:shadow-md transition-all group">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Manual Entry</h3>
            <p className="text-gray-600 mb-6">Add single transactions with category dropdown</p>
            <button
              onClick={() => setShowAddTxnModal(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 shadow-md transition-all"
            >
              Add Transaction
            </button>
          </div>

          {/* CSV Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-green-400 hover:shadow-md transition-all">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center hover:bg-green-200 transition-colors">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 text-center">CSV Bulk Upload</h3>
            <p className="text-gray-600 mb-6 text-center text-sm">Import many transactions at once</p>
            <form onSubmit={handleCSVUpload} className="space-y-4">
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                onChange={(e) => setCSVFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border-2 border-dashed border-gray-200 p-6 rounded-xl text-center"
              />
              <button
                type="submit"
                disabled={!csvFile || uploading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-all"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
              <p className="font-medium mb-1">Required:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">amount</code>,
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono ml-1">txn_type</code>,
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono ml-1">txn_date</code>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTxnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Add Transaction</h3>
              <button
                onClick={() => setShowAddTxnModal(false)}
                className="p-2 -m-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Grocery shopping"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-gray-500 font-normal">(auto if empty)</span>
                </label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Auto-categorize</option>
                  {/* ✅ FIX 2: Guard so .map() only runs on an actual array */}
                  {Array.isArray(categories) && categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Merchant</label>
                <input
                  type="text"
                  value={newTransaction.merchant}
                  onChange={(e) => setNewTransaction({...newTransaction, merchant: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., BigBasket"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <input
                    type="text"
                    value={newTransaction.currency}
                    onChange={(e) => setNewTransaction({...newTransaction, currency: e.target.value.toUpperCase()})}
                    maxLength={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                <select
                  value={newTransaction.txn_type}
                  onChange={(e) => setNewTransaction({...newTransaction, txn_type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="debit">Debit (Expense)</option>
                  <option value="credit">Credit (Income)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input
                  type="datetime-local"
                  value={newTransaction.txn_date}
                  onChange={(e) => setNewTransaction({...newTransaction, txn_date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTxnModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTransactionsSection;
