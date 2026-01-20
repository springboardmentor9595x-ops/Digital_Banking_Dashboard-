import { useState, useEffect } from 'react';
import TransactionForm from './TransactionForm';
import Modal from '../common/Modal';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const TransactionsView = ({ accountId, onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [accountId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.TRANSACTIONS_BY_ACCOUNT(accountId));
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadTransactions();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        Transactions for Account #{accountId}
      </h2>

      {/* No transactions message */}
      {transactions.length === 0 && !showCreateForm && (
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-gray-600">No transactions found.</p>
        </div>
      )}

      {/* Transactions list */}
      <div className="space-y-3 mb-6">
        {transactions.map((txn) => (
          <div key={txn.id} className="bg-white p-4 rounded shadow">
            <p className="font-bold text-lg">{txn.merchant || 'N/A'}</p>
            <p>• <strong>Description:</strong> {txn.description}</p>
            <p>• <strong>Category:</strong> {txn.category}</p>
            <p>• <strong>Amount:</strong> ₹{txn.amount}</p>
            <p>• <strong>Txn. type:</strong> {txn.txn_type}</p>
            <p>• <strong>Txn. date_time:</strong> {new Date(txn.txn_date).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Create transaction form in modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Add New Transaction"
      >
        <TransactionForm
          accountId={accountId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </section>
  );
};

export default TransactionsView;