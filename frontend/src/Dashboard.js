import { useState, useEffect } from 'react'; 
import { getDashboard, deleteAccount, updateTransactionCategory, deleteTransaction} from './api'; // API function to update transaction category 
import { showSuccess, showError, showConfirm } from './utils/toast';   // Notification library

import { CATEGORIES } from './constants/categories';  // Predefined categories

import AddTransactionModal from './components/AddTransactionModal'; // Add Transaction Modal
import CategoryBadge from './components/CategoryBadge';     // Category badge component
import AddAccountModal from './components/AddAccountModal';
import UploadCSVModal from './components/UploadCSVModal'; // Upload CSV Modal


function Dashboard({ onLogout }) {
  // ==========================================
  // STATE VARIABLES
  // ==========================================
  
  const [data, setData] = useState(null);  
  const [loading, setLoading] = useState(true);  
  const [view, setView] = useState('dashboard');  // 'dashboard' | 'account'
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false); // Add Transaction Modal
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false); // Upload CSV Modal

  // ==========================================
  // DELETE ACCOUNT HANDLER
  // ==========================================

  const handleDeleteAccount = async (accountId) => {
  showConfirm('Delete this bank account permanently?', async () => {
    try {
      await deleteAccount(accountId);
      showSuccess('Account deleted');
      loadData(); // refresh dashboard
    } catch (error) {
      console.error(error);
      showError('Failed to delete account');
    }
  });
};

  // ==========================================
  // DELETE TRANSACTION HANDLER
  // ==========================================

  const handleDeleteTransaction = async (transactionId) => {
    showConfirm('Delete this transaction permanently?', async () => {
      try {
        await deleteTransaction(transactionId);
        showSuccess('Transaction deleted');
        loadData(); // refresh dashboard
      } catch (error) {
        console.error(error);
        showError('Failed to delete transaction');
      }
    });
  };

  // ========================================== 
  // CATEGORY UPDATE HANDLER
  // ==========================================
  const handleCategoryChange = async (transactionId, newCategory) => {
    try {
      await updateTransactionCategory(transactionId, newCategory);
      showSuccess('Category updated');
      loadData(); // refresh dashboard
    } catch (error) {
      console.error(error);
      showError('Failed to update category');
    }
  };

  // NEW STATES
  const [selectedAccount, setSelectedAccount] = useState(null);  
  const [searchTerm, setSearchTerm] = useState('');      
  const [isModalOpen, setIsModalOpen] = useState(false);       


  // ==========================================
  // LOAD DATA WHEN COMPONENT MOUNTS
  // ==========================================
  useEffect(() => {
    loadData();
  }, []);  

  const loadData = async () => {
    try {
      const response = await getDashboard();
      setData(response.data);
      if (selectedAccount) {
        const updatedAccount = response.data.accounts.find(
          (acc) => acc.id === selectedAccount.id
        );

        if (updatedAccount) {
          setSelectedAccount(updatedAccount);
        }
      }

    } catch (err) {
      alert('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  const formatMoney = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // ==========================================
  // FILTERED TRANSACTIONS
  // ==========================================
  
  const filteredTransactions = data
    ? data.transactions.filter((txn) => {
        const matchesAccount = selectedAccount
          ? txn.account_id === selectedAccount.id
          : true;

        const search = searchTerm.toLowerCase();
        const matchesSearch =
          txn.merchant?.toLowerCase().includes(search) ||
          txn.category?.toLowerCase().includes(search);

        return matchesAccount && matchesSearch;
      })
    : [];

  // ==========================================
  // LOADING STATE
  // ==========================================
   
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO DATA STATE
  // ==========================================
  
  if (!data || data.accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">

          {/* Icon */}
          <div className="mx-auto mb-6 h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-3xl">
            🏦
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to Your Dashboard
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 mb-8">
            Add your first bank account to get started.
          </p>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              + Add Account
            </button>

            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              Logout
            </button>
          </div>

        </div>
            {/* ADD MODAL HERE */}
                <AddAccountModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onAccountAdded={loadData}
                />
              </div>
    );
  }


  // ==========================================
  // TRANSACTION VIEW
  // ==========================================

  if (view === 'account' && selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setView('dashboard');
              setSelectedAccount(null);
            }}
            className="text-indigo-600 font-medium hover:underline"
            >
            ← Back to Dashboard
          </button>

          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
            Logout
          </button>
        </div>
        

        {/* Account Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold">
            {selectedAccount.bank_name}
          </h1>
          <p className="text-gray-500">
            {selectedAccount.account_type} • {selectedAccount.masked_account}
          </p>
          <p className="text-3xl font-bold mt-4">
            {formatMoney(selectedAccount.balance)}
          </p>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transactions</h2>
            <div className="flex-1"></div>
          <button 
            onClick={() => setIsTxnModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            + Add Transaction
          </button>
          
          <div className="flex flex-col items-end gap-1 min-w-[120px]">
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded "
          >
            Upload CSV
          </button>
        </div>
        </div>

            
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions for this account
            </p>
          ) : (
            filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center p-4 border-b"
              >

                <div className="flex-1">
                  <p className="font-medium">
                    {txn.merchant || txn.description}
                      {txn.description && (
                        <p className="text-xs text-gray-400">
                          {txn.description}
                        </p>
                      )}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                  {formatDate(txn.txn_date)}

                  <CategoryBadge category={txn.category || 'Others'} />

                  <select
                    value={txn.category || 'Others'}
                    onChange={(e) =>
                      handleCategoryChange(txn.id, e.target.value)
                    }
                    className="text-xs border rounded px-1 py-0.5"
                    title="Change category"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </p>
                </div>

              <div className="flex flex-col items-end gap-1 min-w-[120px]">
                  <p
                    className={`font-bold ${
                      txn.txn_type === 'credit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {txn.txn_type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </p>

                  <button
                    onClick={() => handleDeleteTransaction(txn.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
          <AddTransactionModal
            isOpen={isTxnModalOpen}
            onClose={() => setIsTxnModalOpen(false)}
            accountId={selectedAccount.id}
            onTransactionAdded={loadData}
          />
          <UploadCSVModal
            isOpen={isCSVModalOpen}
            onClose={() => setIsCSVModalOpen(false)}
            accountId={selectedAccount.id}
            onUploadSuccess={loadData}
          />


        </div>
      </div>
    </div>
  );
}

  // ==========================================
  // MAIN DASHBOARD VIEW 
  // ==========================================

    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {data.user.name} to your Dashboard! 🏦</h1>
              <p className="text-gray-600">{data.user.email}</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-2xl shadow-lg p-6"
                onClick={() => setSelectedAccount(null)}
            >
              <p className="text-indigo-100 text-sm mb-1 uppercase tracking-wide">
                Total Balance
              </p>
              <p className="text-3xl font-bold">
                {formatMoney(data.summary.total_balance)}
              </p>
              <p className="text-blue-100 text-sm mt-2">
                {data.summary.total_accounts} accounts
              </p>
            </div>

            <div className="bg-green-500 rounded-2xl shadow-md p-6">
              <p className="text-white text-sm mb-1">Total Income</p>
              <p className="text-3xl font-bold text-white">
                +{formatMoney(data.summary.total_income)}
              </p>
            </div>

            <div className="bg-red-500 rounded-lg shadow p-6">
              <p className="text-white text-sm mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-white">
                -{formatMoney(data.summary.total_expenses)}
              </p>
            </div>
          </div>

          {/* Accounts List */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Accounts</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 font-medium"
              >
                + Add Account
              </button>
            </div>

            <div className="space-y-2">
              {data.accounts.map((account) => (
                <div 
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account);
                    setView('account');
                  }}
                  className={`flex justify-between items-center p-4 rounded-lg cursor-pointer ${
                    selectedAccount?.id === account.id
                      ? 'bg-blue-100 border border-blue-400'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold">{account.bank_name}</p>
                    <p className="text-sm text-gray-600">
                      {account.account_type} • {account.masked_account || 'N/A'}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-bold">
                      {formatMoney(account.balance)}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();   
                        handleDeleteAccount(account.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>   
              ))}
            </div>      
          </div>       

          {/* Modal */}
          <AddAccountModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAccountAdded={loadData}
          />


        </div>
      </div>
    );
}

export default Dashboard;
