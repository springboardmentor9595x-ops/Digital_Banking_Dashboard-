import React from 'react';
import { X } from 'lucide-react';

const AddAccountModal = ({ 
  showAddModal, 
  setShowAddModal, 
  newAccount, 
  setNewAccount, 
  handleAddAccount 
}) => {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
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
              onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
              placeholder="e.g., HDFC Bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
            <select
              value={newAccount.account_type}
              onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 bg-white"
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
              onChange={(e) => setNewAccount({ ...newAccount, masked_account: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
              placeholder="e.g., ****1234"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
            <input
              type="text"
              value={newAccount.currency}
              onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value.toUpperCase() })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
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
              onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
            >
              Add Account
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;
