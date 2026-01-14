import { useState, useEffect } from 'react'; 
import { getDashboard } from './api';
import AddAccountModal from './components/AddAccountModal';

function Dashboard({ onLogout }) {
  // ==========================================
  // STATE VARIABLES
  // ==========================================
  
  const [data, setData] = useState(null);  
  const [loading, setLoading] = useState(true);  

  // NEW STATES (from Code 2)
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

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-500 text-sm mb-1">Total Income</p>
            <p className="text-3xl font-bold text-green-600">
              +{formatMoney(data.summary.total_income)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm mb-1">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600">
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

          <div className="space-y-3">
            {data.accounts.map((account) => (
              <div 
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className={`flex justify-between items-center p-4 rounded-lg cursor-pointer ${
                  selectedAccount?.id === account.id
                    ? 'bg-blue-100 border border-blue-400'
                    : 'bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-semibold">{account.bank_name}</p>
                  <p className="text-sm text-gray-600">
                    {account.account_type} • {account.masked_account || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatMoney(account.balance)}</p>
                  <p className="text-sm text-gray-500">{account.currency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {selectedAccount
                ? `Transactions: ${selectedAccount.bank_name}`
                : 'Recent Transactions'}
            </h2>

            <input
              type="text"
              placeholder="Search by merchant or category..."
              className="border rounded px-3 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions found</p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 10).map((txn) => (
                <div 
                  key={txn.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{txn.description || 'Transaction'}</p>
                    <p className="text-sm text-gray-600">
                      {txn.merchant || txn.category || 'N/A'} • {formatDate(txn.txn_date)}
                    </p>
                  </div>
                  <div>
                    <p className={`font-bold ${
                      txn.txn_type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.txn_type === 'credit' ? '+' : '-'}
                      {formatMoney(txn.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
