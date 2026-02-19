import React from 'react';

const StatsCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
        <p className="text-gray-600 text-sm font-medium">Total Accounts</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">{summary.total_accounts || 0}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
        <p className="text-gray-600 text-sm font-medium">Total Balance</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">₹{(summary.total_balance || 0).toFixed(2)}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
        <p className="text-gray-600 text-sm font-medium">Total Income</p>
        <p className="text-2xl font-bold text-green-600 mt-2">+₹{(summary.total_income || 0).toFixed(2)}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-shadow">
        <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
        <p className="text-2xl font-bold text-red-600 mt-2">-₹{(summary.total_expenses || 0).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default StatsCards;
