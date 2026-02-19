import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Receipt, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const BillsPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    biller_name: '',
    amount_due: '',
    due_date: '',
    auto_pay: false,
  });

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchBills();
  }, []);

  // ============================================
  // FETCH BILLS - GET /bills/
  // ============================================
  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bills/');
      console.log(' Fetched bills:', response.data);
      setBills(response.data);
    } catch (error) {
      console.error(' Error fetching bills:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to load bills');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CREATE BILL - POST /bills/
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.biller_name.trim()) {
      toast.error('Biller name is required');
      return;
    }

    if (!formData.amount_due || parseFloat(formData.amount_due) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.due_date) {
      toast.error('Due date is required');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.due_date);
    const todayDate = new Date(today);
    if (selectedDate < todayDate) {
      toast.error('Due date cannot be in the past');
      return;
    }

    try {
      const payload = {
        biller_name: formData.biller_name.trim(),
        amount_due: parseFloat(formData.amount_due),
        due_date: formData.due_date,
        auto_pay: formData.auto_pay,
      };

      console.log(' Creating bill:', payload);
      
      await api.post('/bills/', payload);
      
      console.log(' Bill created successfully');
      toast.success(`Bill for ${payload.biller_name} added successfully! 💰`);
      
      setShowModal(false);
      setFormData({
        biller_name: '',
        amount_due: '',
        due_date: '',
        auto_pay: false,
      });
      
      fetchBills();
    } catch (error) {
      console.error(' Error creating bill:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to add bill';
      toast.error(errorMsg);
    }
  };

  // ============================================
  // UPDATE BILL STATUS - PUT /bills/{bill_id}
  // ============================================
  const handleStatusUpdate = async (billId, newStatus) => {
    try {
      console.log(` Updating bill ${billId} to status: ${newStatus}`);
      
      // FIXED: Use PUT /bills/{bill_id} with status in payload
      const response = await api.put(`/bills/${billId}`, { 
        status: newStatus 
      });
      
      console.log(' Bill status updated:', response.data);
      toast.success('Bill marked as paid! ');
      
      // Refresh the bills list
      await fetchBills();
    } catch (error) {
      console.error(' Error updating bill status:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to update bill status';
      toast.error(errorMsg);
    }
  };

  // ============================================
  // DELETE BILL - DELETE /bills/{bill_id}
  // ============================================
  const handleDelete = async (billId, billerName) => {
    if (!window.confirm(`Are you sure you want to delete the bill for ${billerName}?`)) {
      return;
    }

    try {
      console.log(` Deleting bill ${billId}`);
      
      await api.delete(`/bills/${billId}`);
      
      console.log(' Bill deleted successfully');
      toast.success('Bill deleted successfully ');
      
      // Remove from local state immediately
      setBills(prevBills => prevBills.filter(b => b.id !== billId));
    } catch (error) {
      console.error(' Error deleting bill:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to delete bill';
      toast.error(errorMsg);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStatusBadge = (status) => {
    const badges = {
      upcoming: {
        icon: <Clock className="w-4 h-4" />,
        class: 'bg-yellow-100 text-yellow-700',
        label: 'Upcoming',
      },
      paid: {
        icon: <CheckCircle className="w-4 h-4" />,
        class: 'bg-green-100 text-green-700',
        label: 'Paid',
      },
      overdue: {
        icon: <AlertCircle className="w-4 h-4" />,
        class: 'bg-red-100 text-red-700',
        label: 'Overdue',
      },
    };

    const badge = badges[status] || badges.upcoming;

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Categorize bills
  const upcomingBills = bills.filter((b) => b.status === 'upcoming' && getDaysRemaining(b.due_date) > 0);
  const overdueBills = bills.filter((b) => b.status === 'overdue' || (b.status === 'upcoming' && getDaysRemaining(b.due_date) <= 0));
  const paidBills = bills.filter((b) => b.status === 'paid');

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading bills...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Bills Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Bills Management</h1>
              <p className="text-gray-600 text-sm mt-1">Track and manage your recurring bills</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Add Bill
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Upcoming Bills</p>
          <p className="text-2xl font-bold text-gray-800">{upcomingBills.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Overdue Bills</p>
          <p className="text-2xl font-bold text-red-600">{overdueBills.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Paid Bills</p>
          <p className="text-2xl font-bold text-green-600">{paidBills.length}</p>
        </div>
      </div>

      {/* Bills List */}
      <div className="max-w-7xl mx-auto">
        {bills.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No bills yet</p>
            <p className="text-gray-500 mb-6 text-sm">Start by adding your first bill</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Add First Bill
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Bills */}
            {overdueBills.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-red-600 mb-4"> Overdue Bills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overdueBills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={handleDelete}
                      getDaysRemaining={getDaysRemaining}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Bills */}
            {upcomingBills.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4"> Upcoming Bills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingBills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={handleDelete}
                      getDaysRemaining={getDaysRemaining}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paid Bills */}
            {paidBills.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4"> Paid Bills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paidBills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={handleDelete}
                      getDaysRemaining={getDaysRemaining}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Add New Bill</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biller Name *
                </label>
                <input
                  type="text"
                  value={formData.biller_name}
                  onChange={(e) => setFormData({ ...formData, biller_name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Electricity, Netflix, Airtel"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount_due}
                  onChange={(e) => setFormData({ ...formData, amount_due: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="500.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  min={today}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select today or any future date
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_pay"
                  checked={formData.auto_pay}
                  onChange={(e) => setFormData({ ...formData, auto_pay: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="auto_pay" className="text-sm text-gray-700 cursor-pointer">
                  Enable Auto-Pay
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Bill
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

// ============================================
// BILL CARD COMPONENT
// ============================================
const BillCard = ({ bill, onStatusUpdate, onDelete, getDaysRemaining, getStatusBadge }) => {
  const daysRemaining = getDaysRemaining(bill.due_date);
  const isOverdue = daysRemaining < 0;
  const isDueSoon = daysRemaining >= 0 && daysRemaining <= 3;

  return (
    <div
      className={`border-2 rounded-lg p-5 transition-all ${
        isOverdue
          ? 'border-red-300 bg-red-50'
          : isDueSoon
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{bill.biller_name}</h3>
          {bill.auto_pay && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
               Auto-Pay
            </span>
          )}
        </div>
        {getStatusBadge(bill.status)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount</span>
          <span className="font-semibold text-gray-800">₹{bill.amount_due.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Due Date</span>
          <span className="font-medium text-gray-800">
            {new Date(bill.due_date).toLocaleDateString('en-IN')}
          </span>
        </div>
        {(bill.status === 'upcoming' || bill.status === 'overdue') && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Days Remaining</span>
            <span
              className={`font-semibold ${
                isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-green-600'
              }`}
            >
              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {bill.status !== 'paid' && (
          <button
            onClick={() => onStatusUpdate(bill.id, 'paid')}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Mark as Paid
          </button>
        )}
        <button
          onClick={() => onDelete(bill.id, bill.biller_name)}
          className="px-4 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default BillsPage;
