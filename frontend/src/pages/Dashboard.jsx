import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';

// Component Imports
import AlertPopup from '../components/AlertPopup';
import Header from '../components/Dashboard/Header';
import NavigationBar from '../components/Dashboard/NavigationBar';
import StatsCards from '../components/Dashboard/StatsCards';
import AccountsSection from '../components/Dashboard/AccountsSection';
import TransactionsSection from '../components/Dashboard/TransactionsSection';
import AddAccountModal from '../components/Dashboard/AddAccountModal';
import BudgetCharts from '../components/Budgets/BudgetsCharts';

// Service Imports
import { getAlerts, deleteAlert } from '../services/alertService';

export default function Dashboard() {
  const location = useLocation();
  const accountsRef = useRef(null);
  const navigate = useNavigate();

  // State Management
  const [data, setData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  const [newAccount, setNewAccount] = useState({
    bank_name: '',
    account_type: 'savings',
    masked_account: '',
    currency: 'INR',
    balance: 0,
  });

  // Effects
  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
    fetchNotifications();

    if (location.hash === '#accounts' && accountsRef.current) {
      setTimeout(() => {
        accountsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }

    const handleAlertUpdate = () => {
      fetchAlerts();
    };

    window.addEventListener('alertsUpdated', handleAlertUpdate);
    return () => {
      window.removeEventListener('alertsUpdated', handleAlertUpdate);
    };
  }, [location]);

  // Data Fetching Functions
  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
      setNotifications(data);

      if (data.length > 0 && !sessionStorage.getItem('alertsShown')) {
        setShowAlertPopup(true);
        sessionStorage.setItem('alertsShown', 'true');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to load dashboard');
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/alerts');
      setNotifications(res.data);
    } catch (err) {
      console.error('Notifications error:', err);
    }
  };

  // Event Handlers
  const handleDismissAlert = async (alertId) => {
    try {
      await deleteAlert(alertId);
      await fetchAlerts();
      toast.success('Alert dismissed ');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  const handleClosePopup = () => {
    setShowAlertPopup(false);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts', newAccount);
      toast.success('Account added successfully! 🎉');
      setShowAddModal(false);
      setNewAccount({
        bank_name: '',
        account_type: 'savings',
        masked_account: '',
        currency: 'INR',
        balance: 0,
      });
      fetchDashboardData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to add account';
      toast.error(errorMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('alertsShown');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Loading State
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-xl text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Alert Popup */}
      {showAlertPopup && (
        <AlertPopup 
          alerts={alerts} 
          onClose={handleClosePopup} 
          onDismissAlert={handleDismissAlert} 
        />
      )}

      {/* Header Component */}
      <div>
        <Header
          userName={data.user.name}
          userEmail={data.user.email}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          showProfileDropdown={showProfileDropdown}
          setShowProfileDropdown={setShowProfileDropdown}
          handleDismissAlert={handleDismissAlert}
          handleLogout={handleLogout}
        />

        {/* Navigation Bar Component */}
        <NavigationBar accountsRef={accountsRef} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards Component */}
        <StatsCards summary={data.summary} />

        {/* Budget Analytics with Insights Charts */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={24} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Budget Analytics & Insights</h2>
          </div>
          <BudgetCharts />
        </div>

        {/* Accounts Section Component */}
        <AccountsSection
          accounts={data.accounts}
          accountsRef={accountsRef}
          setShowAddModal={setShowAddModal}
        />

        {/* Transactions Section Component */}
        <TransactionsSection transactions={data.transactions} />
      </div>

      {/* Add Account Modal Component */}
      <AddAccountModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        newAccount={newAccount}
        setNewAccount={setNewAccount}
        handleAddAccount={handleAddAccount}
      />
    </div>
  );
}
