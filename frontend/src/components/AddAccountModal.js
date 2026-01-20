import { useState } from 'react';
import { createAccount } from '../api'; 
import { showSuccess, showError } from '../utils/toast';    // Notification library

function AddAccountModal({ isOpen, onClose, onAccountAdded }) {
  const [formData, setFormData] = useState({
    bank_name: '',
    account_type: 'savings',
    balance: 0,
    currency: 'INR',
    masked_account: ''
  });

  if (!isOpen) return null; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAccount(formData);
      showSuccess('Bank account added');
      onAccountAdded();
      onClose();
    } catch (err) {
      // showError(err.response?.data?.detail || 'Failed to add account');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text"
            placeholder="Bank Name"
            required
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, bank_name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Masked Account (****1234)"
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, masked_account: e.target.value })
            }
          />


          <select 
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, account_type: e.target.value })
            }
          >
            <option value="savings">Savings</option>
            <option value="checking">Checking</option>
            <option value="credit_card">Credit Card</option>
          </select>

          <input 
            type="number"
            placeholder="Initial Balance"
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, balance: Number(e.target.value) })
            }
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAccountModal;
