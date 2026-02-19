import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const AccountsSection = ({ accounts, accountsRef, setShowAddModal }) => {
  const navigate = useNavigate();

  const handleAccountClick = (accountId) => {
    navigate(`/account/${accountId}`);
  };

  return (
    <div ref={accountsRef} id="accounts" className="bg-white p-6 rounded-xl shadow-lg scroll-mt-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Your Accounts</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-lg font-medium text-gray-600 mb-2">No accounts yet</p>
          <p className="text-sm text-gray-500">Click "Add Account" to create your first bank account</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountClick(account.id)}
              className="border-2 border-gray-200 p-5 rounded-xl hover:shadow-xl hover:border-blue-600 transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50"
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
              <div className="mt-3 text-xs text-blue-600 font-medium">Click to view details →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountsSection;
