import React, { useState, useEffect } from 'react';
import { getAllInsights } from '../../services/insightsService';
import { getBudgets } from '../../services/budgetsServices';
import { toast } from 'react-toastify';
import { TrendingUp, DollarSign, ShoppingBag, ChevronDown, Calendar, Tag, Download } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { downloadInsightsCSV, downloadInsightsPDF } from '../../services/reportsService';


const BudgetCharts = () => {
  const [insights, setInsights] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchBudgets(); }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllInsights();
      setInsights(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError(error.message);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const data = await getBudgets();
      const filteredBudgets = data.filter(
        (b) => b.month === selectedMonth && b.year === selectedYear
      );
      setBudgets(filteredBudgets);
      const categories = filteredBudgets.map((b) => b.category);
      setAllCategories(categories);
      if (selectedCategories.length === 0 && categories.length > 0) {
        setSelectedCategories(categories);
      } else {
        setSelectedCategories(prev => prev.filter(cat => categories.includes(cat)));
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  // ✅ FIXED: pass selectedMonth + selectedYear, add toast feedback
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      await downloadInsightsCSV(selectedMonth, selectedYear);
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  // ✅ FIXED: pass selectedMonth + selectedYear, add toast feedback
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      await downloadInsightsPDF(selectedMonth, selectedYear);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const selectAllCategories = () => setSelectedCategories(allCategories);
  const deselectAllCategories = () => setSelectedCategories([]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-bold">Error loading insights</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button onClick={fetchData} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  if (!insights) {
    return <div className="text-center py-8 text-gray-500"><p>No insights available</p></div>;
  }

  const filteredBudgets = budgets.filter((b) => selectedCategories.includes(b.category));

  const budgetVsSpendingData = filteredBudgets.map((budget) => ({
    category: budget.category,
    budgetLimit: budget.limit_amount,
    actualSpending: budget.spent_amount,
    isOverBudget: budget.spent_amount > budget.limit_amount,
  }));

  const yearlyTrendData = [{
    month: new Date().toLocaleString('default', { month: 'short' }),
    spending: insights.monthly_cash_flow.total_debits,
    budget: insights.burn_rate,
  }];

  const cashFlowData = [
    { name: 'Income',      amount: insights.monthly_cash_flow.total_credits, fill: '#22c55e' },
    { name: 'Expenses',    amount: insights.monthly_cash_flow.total_debits,  fill: '#ef4444' },
    { name: 'Net Savings', amount: insights.monthly_cash_flow.net_savings,
      fill: insights.monthly_cash_flow.net_savings >= 0 ? '#3b82f6' : '#f97316' },
  ];

  const merchantData = insights.top_merchants.slice(0, 5);

  const months = [
    { value: 1, label: 'January' },  { value: 2, label: 'February' },
    { value: 3, label: 'March' },    { value: 4, label: 'April' },
    { value: 5, label: 'May' },      { value: 6, label: 'June' },
    { value: 7, label: 'July' },     { value: 8, label: 'August' },
    { value: 9, label: 'September' },{ value: 10, label: 'October' },
    { value: 11, label: 'November' },{ value: 12, label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">

      {/* ── Export Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">Export Budget Report</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 disabled:opacity-50 transition-colors font-medium"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 disabled:opacity-50 transition-colors font-medium"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* ── Row 1: Budget vs Spending + Yearly Trend ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRAPH 1: BUDGET VS SPENDING */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Budget vs Spending</h3>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                  <Calendar size={14} className="text-blue-600" />Month
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full appearance-none px-4 py-2.5 pr-10 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                  <Calendar size={14} className="text-purple-600" />Year
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full appearance-none px-4 py-2.5 pr-10 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer transition"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {/* Category Multi-Select */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Tag size={14} className="text-green-600" />Categories
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg text-sm font-medium text-gray-800 hover:from-green-100 hover:to-teal-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs font-bold">
                      {selectedCategories.length}
                    </span>
                    {selectedCategories.length === 0
                      ? 'Select categories'
                      : selectedCategories.length === allCategories.length
                      ? 'All categories selected'
                      : `${selectedCategories.length} of ${allCategories.length} selected`}
                  </span>
                  <ChevronDown className={`text-green-600 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} size={18} />
                </button>

                {showCategoryDropdown && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b border-gray-200 flex gap-2">
                      <button onClick={selectAllCategories} className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                        Select All
                      </button>
                      <button onClick={deselectAllCategories} className="flex-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition">
                        Clear All
                      </button>
                    </div>
                    <div className="p-2">
                      {allCategories.length > 0 ? allCategories.map((category) => (
                        <label key={category} className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-lg cursor-pointer transition group">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">{category}</span>
                        </label>
                      )) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-500">No budgets for this month/year</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {budgetVsSpendingData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={budgetVsSpendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#4b5563' }} angle={-20} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                  <Bar dataKey="budgetLimit" fill="#3b82f6" name="Budget Limit" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="actualSpending" name="Actual Spending" radius={[8, 8, 0, 0]}>
                    {budgetVsSpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isOverBudget ? '#ef4444' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {budgetVsSpendingData.some((b) => b.isOverBudget) && (
                <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-bold text-red-700">
                        {budgetVsSpendingData.filter((b) => b.isOverBudget).length}{' '}
                        {budgetVsSpendingData.filter((b) => b.isOverBudget).length === 1 ? 'category is' : 'categories are'} over budget!
                      </p>
                      <p className="text-xs text-red-600 mt-1">Review your spending in these categories</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No budget data for selected filters</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting different month/year or categories</p>
            </div>
          )}
        </div>

        {/* GRAPH 2: YEARLY SPENDING TREND */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Spending Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={yearlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#4b5563' }} />
              <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
              <Line type="monotone" dataKey="spending" stroke="#8b5cf6" strokeWidth={3} name="Actual Spending" dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
              <Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Burn Rate" dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-5 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">💰 Monthly Burn Rate</p>
                <p className="text-3xl font-bold mt-2">₹{insights.burn_rate.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right bg-white/20 px-4 py-3 rounded-lg backdrop-blur">
                <p className="text-xs font-medium opacity-90">Per Day</p>
                <p className="text-xl font-bold">₹{(insights.burn_rate / 30).toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Cash Flow + Top Merchants ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRAPH 3: MONTHLY CASH FLOW */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Monthly Cash Flow</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4b5563' }} />
              <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {cashFlowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <p className="text-xs text-green-700 font-semibold mb-1">💵 Income</p>
              <p className="text-lg font-bold text-green-600">₹{insights.monthly_cash_flow.total_credits.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
              <p className="text-xs text-red-700 font-semibold mb-1">💸 Expenses</p>
              <p className="text-lg font-bold text-red-600">₹{insights.monthly_cash_flow.total_debits.toLocaleString('en-IN')}</p>
            </div>
            <div className={`p-4 rounded-xl border ${insights.monthly_cash_flow.net_savings >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
              <p className={`text-xs font-semibold mb-1 ${insights.monthly_cash_flow.net_savings >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>💰 Savings</p>
              <p className={`text-lg font-bold ${insights.monthly_cash_flow.net_savings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ₹{insights.monthly_cash_flow.net_savings.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* GRAPH 4: TOP 5 MERCHANTS */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ShoppingBag className="text-indigo-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Top 5 Merchants</h3>
          </div>
          {merchantData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={merchantData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#4b5563' }} />
                  <YAxis dataKey="merchant" type="category" tick={{ fontSize: 12, fill: '#4b5563' }} width={100} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="total_spent" fill="#6366f1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2">
                {merchantData.map((merchant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full text-xs font-bold shadow">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{merchant.merchant}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">₹{merchant.total_spent.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No merchant data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetCharts;
