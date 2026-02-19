import React, { useState } from 'react';
import { Search } from 'lucide-react';

const TransactionsSection = ({ transactions }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter((txn) => {
    const query = searchQuery.toLowerCase();
    return (
      txn.description?.toLowerCase().includes(query) ||
      txn.category?.toLowerCase().includes(query) ||
      txn.id.toString().includes(query)
    );
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">All Transactions</h2>

      {transactions.length > 0 && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by description, category, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
          />
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-lg font-medium text-gray-600 mb-2">No transactions made yet</p>
          <p className="text-sm text-gray-500">Add an account and upload transactions to get started</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-lg">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No matching transactions found</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium">#{txn.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{txn.description || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {txn.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{txn.merchant || 'N/A'}</td>
                    <td
                      className={`px-4 py-3 text-sm font-bold ${
                        txn.txn_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {txn.txn_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          txn.txn_type === 'credit'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {txn.txn_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(txn.txn_date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsSection;
