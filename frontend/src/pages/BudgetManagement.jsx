import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  PlusCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import api from '../api/axios';

const BudgetManagement = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    limit_amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  // ============================================
  // FETCH CATEGORIES - GET /categories/
  // ============================================
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await api.get('/categories/');
      console.log('✅ Fetched categories:', response.data);
      
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Personal Care',
        'Other'
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ============================================
  // FETCH ALL BUDGETS - GET /budgets/
  // ============================================
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/budgets/');
      console.log('✅ Fetched budgets (raw):', response.data);
      
      // Backend returns BudgetSummary[] with different field names
      // Map to expected format
      const mappedBudgets = response.data.map(budget => ({
        id: budget.budget_id,  // ← CHANGED: backend uses budget_id
        category: budget.category,
        month: budget.month,
        year: budget.year,
        limit_amount: budget.limit_amount,
        spent_amount: budget.spent_amount,
        remaining: budget.remaining,
        is_over_budget: budget.is_over_budget,
        percentage_used: budget.percentage_used
      }));
      
      console.log('✅ Mapped budgets:', mappedBudgets);
      setBudgets(mappedBudgets);
    } catch (error) {
      console.error('❌ Error fetching budgets:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to load budgets');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CREATE BUDGET - POST /budgets/
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.category.trim()) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.limit_amount || parseFloat(formData.limit_amount) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    if (parseFloat(formData.limit_amount) > 10000000) {
      toast.error('Budget amount cannot exceed ₹1,00,00,000');
      return;
    }

    try {
      const payload = {
        category: formData.category.trim(),
        limit_amount: parseFloat(formData.limit_amount),
        month: parseInt(formData.month),
        year: parseInt(formData.year),
      };

      console.log('📤 Creating budget:', payload);
      
      const response = await api.post('/budgets/', payload);
      
      console.log('✅ Budget created:', response.data);
      toast.success(`Budget for ${formData.category} created successfully! 🎯`);
      
      setIsModalOpen(false);
      setFormData({
        category: '',
        limit_amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      
      await fetchBudgets();
    } catch (error) {
      console.error('❌ Error creating budget:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to create budget';
      toast.error(errorMsg);
    }
  };

  // ============================================
  // DELETE BUDGET - DELETE /budgets/{budget_id}
  // ============================================
  const handleDeleteBudget = async (budgetId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the budget for "${categoryName}"?`)) {
      return;
    }

    try {
      console.log(`🗑️ Deleting budget ID: ${budgetId}`);
      
      await api.delete(`/budgets/${budgetId}`);
      
      console.log(`✅ Budget ${budgetId} deleted successfully`);
      toast.success(`Budget for "${categoryName}" deleted successfully! 🗑️`);
      
      setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
      
    } catch (error) {
      console.error('❌ Error deleting budget:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to delete budget';
      toast.error(errorMsg);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[month - 1];
  };

  // Calculate stats
  const stats = {
    total: budgets.length,
    totalBudget: budgets.reduce((sum, b) => sum + (b?.limit_amount || 0), 0),
    totalSpent: budgets.reduce((sum, b) => sum + (b?.spent_amount || 0), 0),
    overBudget: budgets.filter((b) => b && b.spent_amount > b.limit_amount).length,
  };

  if (loading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Budget Management</h1>
              <p className="text-gray-600 mt-1">Track and manage your spending limits</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-medium"
            >
              <PlusCircle size={18} />
              Create Budget
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Budgets</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Total Budget</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{stats.totalBudget.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm">Total Spent</p>
            <p className="text-2xl font-bold text-orange-600">
              ₹{stats.totalSpent.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-gray-600 text-sm">Over Budget</p>
            <p className="text-2xl font-bold text-red-600">{stats.overBudget}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Your Budgets</h2>

          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No budgets set yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Create your first budget to start tracking your spending
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-medium"
              >
                Create Your First Budget
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                if (!budget || !budget.id) return null;
                
                const percentage = (budget.spent_amount / budget.limit_amount) * 100;
                const isOverBudget = percentage > 100;
                const isWarning = percentage > 80 && percentage <= 100;

                return (
                  <div
                    key={budget.id}
                    className={`border-2 rounded-lg p-5 transition-all ${
                      isOverBudget
                        ? 'border-red-300 bg-red-50'
                        : isWarning
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          {budget.category}
                          {isOverBudget && (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getMonthName(budget.month)} {budget.year}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBudget(budget.id, budget.category)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Spent</span>
                        <span className="font-semibold text-gray-800">
                          ₹{budget.spent_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Budget Limit</span>
                        <span className="font-semibold text-gray-800">
                          ₹{budget.limit_amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isOverBudget
                              ? 'bg-red-500'
                              : isWarning
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span
                          className={`font-medium ${
                            isOverBudget
                              ? 'text-red-600'
                              : isWarning
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {percentage.toFixed(1)}% used
                        </span>
                        {isOverBudget && (
                          <span className="text-red-600 font-semibold">
                            ⚠️ Over by ₹{(budget.spent_amount - budget.limit_amount).toFixed(2)}
                          </span>
                        )}
                        {isWarning && !isOverBudget && (
                          <span className="text-yellow-600 font-semibold">
                            ⚡ Approaching limit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Create New Budget</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 bg-white outline-none"
                  required
                >
                  <option value="">-- Select a category --</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose from predefined categories
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Limit (₹) *
                </label>
                <input
                  type="number"
                  name="limit_amount"
                  value={formData.limit_amount}
                  onChange={handleChange}
                  placeholder="5000.00"
                  step="0.01"
                  min="0.01"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month *
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 bg-white outline-none"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 bg-white outline-none"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-medium"
                >
                  Create Budget
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
