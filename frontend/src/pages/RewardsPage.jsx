import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Gift,
  RefreshCw,
  Info,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createRewardProgram,
  getRewards,
  updateRewardPoints,
  getRewardsSummary,
} from '../services/rewardsService';


export default function RewardsPage() {
  const navigate = useNavigate();
  
  // State management
  const [rewards, setRewards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Form states
  const [newReward, setNewReward] = useState({
    program_name: '',
    points_balance: 0,
  });
  
  const [pointsUpdate, setPointsUpdate] = useState({
    points_to_add: 0,
  });


  // ============================================
  // FETCH DATA ON COMPONENT MOUNT
  // ============================================
  useEffect(() => {
    fetchRewardsData();
  }, []);


  const fetchRewardsData = async () => {
    try {
      setLoading(true);
      
      // Fetch rewards list and summary in parallel
      const [rewardsData, summaryData] = await Promise.all([
        getRewards(),
        getRewardsSummary(),
      ]);
      
      setRewards(rewardsData);
      setSummary(summaryData);
      
    } catch (error) {
      console.error('Error fetching rewards:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to load rewards data');
      }
    } finally {
      setLoading(false);
    }
  };


  // ============================================
  // CREATE NEW REWARD PROGRAM
  // ============================================
  const handleCreateReward = async (e) => {
    e.preventDefault();
    
    try {
      await createRewardProgram(newReward);
      
      toast.success(`${newReward.program_name} added successfully! 🎉`);
      
      // Reset form and close modal
      setNewReward({ program_name: '', points_balance: 0 });
      setShowAddModal(false);
      
      // Refresh data
      fetchRewardsData();
      
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create reward program';
      toast.error(errorMsg);
    }
  };


  // ============================================
  // UPDATE REWARD POINTS
  // ============================================
  const handleUpdatePoints = async (e) => {
    e.preventDefault();
    
    if (!selectedReward) return;
    
    try {
      await updateRewardPoints(selectedReward.id, pointsUpdate.points_to_add);
      
      const action = pointsUpdate.points_to_add > 0 ? 'added' : 'redeemed';
      toast.success(
        `Successfully ${action} ${Math.abs(pointsUpdate.points_to_add)} points! ✅`
      );
      
      // Reset and close
      setPointsUpdate({ points_to_add: 0 });
      setShowUpdateModal(false);
      setSelectedReward(null);
      
      // Refresh data
      fetchRewardsData();
      
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update points';
      toast.error(errorMsg);
    }
  };


  // ============================================
  // CURRENCY HELPER FUNCTIONS
  // ============================================
  const formatCurrency = (amount, currency) => {
    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
    };
    
    return `${symbols[currency] || ''}${amount.toFixed(2)}`;
  };


  const getConvertedValue = (reward) => {
    switch(selectedCurrency) {
      case 'INR':
        return reward.points_value_inr || 0;
      case 'USD':
        return reward.points_value_usd || 0;
      case 'EUR':
        return reward.points_value_eur || 0;
      default:
        return reward.points_value_usd || 0;
    }
  };


  const getSummaryValue = () => {
    if (!summary) return 0;
    
    switch(selectedCurrency) {
      case 'INR':
        return summary.total_value_inr;
      case 'USD':
        return summary.total_value_usd;
      case 'EUR':
        return summary.total_value_eur;
      default:
        return summary.total_value_usd;
    }
  };


  // ============================================
  // FORMAT TIMESTAMP
  // ============================================
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };


  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }


  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Header - EXACTLY LIKE ACCOUNTDETAIL */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Rewards Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Rewards & Loyalty Programs</h1>
              <p className="text-gray-600 text-sm mt-1">Track and manage your reward points</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white outline-none text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Programs */}
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm">Total Programs</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total_programs}</p>
          </div>

          {/* Total Points */}
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Points</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total_points.toLocaleString()}</p>
          </div>

          {/* Dynamic Currency Value */}
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Total Value ({selectedCurrency})</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(getSummaryValue(), selectedCurrency)}
            </p>
          </div>
        </div>
      )}

      {/* Reward Programs Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Your Reward Programs</h2>
            
            <div className="flex gap-3">
              <button
                onClick={fetchRewardsData}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Add Program
              </button>
            </div>
          </div>

          {/* Rewards List */}
          {rewards.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-600 mb-2">No reward programs yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Start tracking your loyalty points and cashback rewards
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Program
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="border-2 border-gray-200 p-5 rounded-lg hover:border-blue-300 transition-all"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <Award className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {reward.program_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(reward.last_updated)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Points Balance */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                    <p className="text-xs text-gray-600 mb-1">Points Balance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {reward.points_balance.toLocaleString()}
                    </p>
                  </div>

                  {/* Currency Value */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs font-medium text-gray-700">
                        {selectedCurrency} Value
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(getConvertedValue(reward), selectedCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedReward(reward);
                        setPointsUpdate({ points_to_add: 100 });
                        setShowUpdateModal(true);
                      }}
                      className="flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <TrendingUp size={16} />
                      Add
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedReward(reward);
                        setPointsUpdate({ points_to_add: -100 });
                        setShowUpdateModal(true);
                      }}
                      className="flex items-center justify-center gap-1 bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      <TrendingDown size={16} />
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mt-6">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-blue-900 text-sm mb-1">Points Conversion Rate</p>
              <p className="text-xs text-blue-800">
                4 reward points = ₹1 | Currency conversions are updated every 6 hours using live exchange rates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Reward Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Add Reward Program</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={newReward.program_name}
                  onChange={(e) =>
                    setNewReward({ ...newReward, program_name: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., HDFC Rewards, Amazon Pay Points"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Points Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={newReward.points_balance}
                  onChange={(e) =>
                    setNewReward({
                      ...newReward,
                      points_balance: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Value: ₹{(newReward.points_balance * 0.25).toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Program
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Points Modal */}
      {showUpdateModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                Update Points: {selectedReward.program_name}
              </h3>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedReward(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePoints} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedReward.points_balance.toLocaleString()} points
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ≈ {formatCurrency(getConvertedValue(selectedReward), selectedCurrency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to Add/Redeem *
                </label>
                <input
                  type="number"
                  value={pointsUpdate.points_to_add}
                  onChange={(e) =>
                    setPointsUpdate({
                      points_to_add: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter positive to add, negative to redeem"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add, negative to redeem (e.g., -500)
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">New Balance:</p>
                <p className="text-xl font-bold text-blue-600">
                  {(selectedReward.points_balance + pointsUpdate.points_to_add).toLocaleString()}{' '}
                  points
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Update Points
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedReward(null);
                  }}
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
}
