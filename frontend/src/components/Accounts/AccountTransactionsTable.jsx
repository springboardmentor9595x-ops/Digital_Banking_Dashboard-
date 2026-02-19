import React, { useState, useMemo } from 'react';
import { Search, Download, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadAccountTransactionsCSV, downloadAccountTransactionsPDF } from '../../services/reportsService';

const AccountTransactionsTable = ({ 
  accountId, 
  transactions, 
  onEditTransaction, 
  onDeleteTransaction 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const ITEMS_PER_PAGE = 25;

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter((txn) =>
      txn.id.toString().includes(q) ||
      txn.description?.toLowerCase().includes(q) ||
      txn.category?.toLowerCase().includes(q) ||
      txn.merchant?.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const handleDownload = async (type) => {
    setDownloading(true);
    try {
      if (type === 'csv') await downloadAccountTransactionsCSV(accountId);
      else await downloadAccountTransactionsPDF(accountId);
    } catch (e) {
      // Toast handled by service
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header: Search + Export */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('csv')}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 disabled:opacity-50 transition-colors"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 disabled:opacity-50 transition-colors"
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
        {searchQuery && ` (filtered from ${transactions.length})`}
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          {transactions.length === 0 ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl font-medium mb-2">No transactions yet</p>
              <p className="text-sm">Add some using manual entry or CSV upload above</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl font-medium">No matching transactions</p>
              <p className="text-sm">Try adjusting your search</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.map((txn, index) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-md truncate">
                      {txn.description || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {txn.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {txn.merchant || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      <span className={`${
                        txn.txn_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.txn_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                        txn.txn_type === 'credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {txn.txn_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {new Date(txn.txn_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button
                        onClick={() => onEditTransaction(txn)}
                        className="text-blue-600 hover:text-blue-900 p-1 -m-1 rounded transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(txn.id)}
                        className="text-red-600 hover:text-red-900 p-1 -m-1 rounded transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4 sm:px-0">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountTransactionsTable;
