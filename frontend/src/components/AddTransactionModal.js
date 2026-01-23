import { useState } from 'react';
import { createTransaction } from '../api';
import { showSuccess, showError } from '../utils/toast';

function AddTransactionModal({
  isOpen,
  onClose,
  accountId,
  onTransactionAdded,
}) {
    const INITIAL_FORM_STATE = {
    amount: '',
    txn_type: 'debit',
    category: 'Others',
    description: '',
    merchant: '',
    currency: 'INR',
    txn_date: '',
    posted_date: '',
    };
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  if (!isOpen) return null;


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        await createTransaction({
            account_id: accountId,
            amount: Number(formData.amount),
            txn_type: formData.txn_type,
            category: formData.category,
            description: formData.description || null,
            merchant: formData.merchant,
            currency: formData.currency,
            txn_date: formData.txn_date,
            posted_date: formData.posted_date || null,
        });

        showSuccess('Transaction added successfully');

        setFormData(INITIAL_FORM_STATE); // ✅ RESET FORM
        onTransactionAdded();
        onClose();
        } catch (error) {
        showError('Failed to add transaction');
}

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Amount */}
          <input
            type="number"
            step="0.01"
            required
            placeholder="Amount"
            className="w-full border p-2 rounded"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
          />

          {/* Transaction Type */}
          <select
            className="w-full border p-2 rounded"
            value={formData.txn_type}
            onChange={(e) =>
              setFormData({ ...formData, txn_type: e.target.value })
            }
          >
            <option value="debit">Debit (Expense)</option>
            <option value="credit">Credit (Income)</option>
          </select>

          {/* Category */}
          <select
            className="w-full border p-2 rounded"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option>Income</option>
            <option>Food</option>
            <option>Groceries</option>
            <option>Transport</option>
            <option>Bills</option>
            <option>Shopping</option>
            <option>Entertainment</option>
            <option>Others</option>
          </select>

          {/* Description */}
          <input
            type="text"
            placeholder="Description (optional)"
            className="w-full border p-2 rounded"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          {/* Merchant */}
          <input
            type="text"
            required
            placeholder="Merchant"
            className="w-full border p-2 rounded"
            value={formData.merchant}
            onChange={(e) =>
                setFormData({ ...formData, merchant: e.target.value })
            }
            />


          {/* Transaction Date */}
          <label className="block text-sm font-medium mb-1">Transaction Date</label>
          <input
            type="date"
            required
            className="w-full border p-2 rounded"
            value={formData.txn_date}
            onChange={(e) =>
              setFormData({ ...formData, txn_date: e.target.value })
            }
          />

          {/* Posted Date */}
          <label className="block text-sm font-medium mb-1">Posted Date (optional)</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={formData.posted_date}
            onChange={(e) =>
              setFormData({ ...formData, posted_date: e.target.value })
            }
          />

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
            type="button"
            onClick={() => {
                setFormData(INITIAL_FORM_STATE);
                onClose();
            }}
            className="px-4 py-2 text-gray-600"
            >
            Cancel
            </button>


            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
