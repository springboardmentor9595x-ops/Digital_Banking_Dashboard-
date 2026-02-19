import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  CheckCircle,
  TrendingDown,
  CreditCard,
  Calendar,
  RefreshCw,
  Bell,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import api from '../api/axios';

const AlertsCenter = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  // ============================================
  // FETCH ALERTS - GET /alerts/
  // ============================================
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alerts/');
      console.log('Fetched alerts:', response.data);
      setAlerts(response.data);
    } catch (err) {
      console.error(' Error fetching alerts:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to load alerts');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MARK ALERT AS READ - PATCH /alerts/{alert_id}/read
  // ============================================
  const handleMarkAsRead = async (alertId) => {
    try {
      console.log(`Marking alert ${alertId} as read`);
      
      // FIXED: Use /read endpoint (not /mark-read)
      await api.patch(`/alerts/${alertId}/read`);
      
      console.log(`Alert ${alertId} marked as read`);
      toast.success('Alert marked as read ✓');
      
      // Update local state
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === alertId ? { ...alert, read_status: true } : alert
        )
      );
    } catch (err) {
      console.error('Error marking alert as read:', err.response?.data);
      toast.error('Failed to mark alert as read');
    }
  };

  // ============================================
  // DELETE ALERT - DELETE /alerts/{alert_id}
  // ============================================
  const handleDelete = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      console.log(`Deleting alert ${alertId}`);
      
      await api.delete(`/alerts/${alertId}`);
      
      console.log(`Alert ${alertId} deleted`);
      toast.success('Alert deleted successfully ');
      
      // Remove from local state
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error('Error deleting alert:', err.response?.data);
      toast.error('Failed to delete alert');
    }
  };

  // ============================================
  // GENERATE ALERTS - POST /alerts/generate
  // ============================================
  const handleGenerateAlerts = async () => {
    try {
      setLoading(true);
      console.log('Generating new alerts...');
      
      const response = await api.post('/alerts/generate');
      
      console.log('Generated alerts:', response.data);
      toast.success(`Generated ${response.data.alerts_created} new alert(s) `);
      
      await fetchAlerts();
    } catch (err) {
      console.error(' Error generating alerts:', err.response?.data);
      toast.error('Failed to generate alerts');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'low_balance':
        return <CreditCard className="text-orange-600" size={24} />;
      case 'budget_exceeded':
        return <TrendingDown className="text-red-600" size={24} />;
      case 'bill_due':
        return <Calendar className="text-blue-600" size={24} />;
      default:
        return <AlertCircle className="text-gray-600" size={24} />;
    }
  };

  const getBadgeColor = (alertType) => {
    switch (alertType) {
      case 'low_balance':
        return 'bg-orange-100 text-orange-800';
      case 'budget_exceeded':
        return 'bg-red-100 text-red-800';
      case 'bill_due':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBorderColor = (alertType) => {
    switch (alertType) {
      case 'low_balance':
        return 'border-orange-500';
      case 'budget_exceeded':
        return 'border-red-500';
      case 'bill_due':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unread') return !alert.read_status;
    if (filter === 'read') return alert.read_status;
    return true;
  });

  const unreadCount = alerts.filter((alert) => !alert.read_status).length;

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading alerts...</p>
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

        {/* Alert Info Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Alerts Center</h1>
              <p className="text-gray-600 text-sm mt-1">
                Stay on top of your finances with smart notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAlerts}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={handleGenerateAlerts}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <AlertCircle size={18} />
                Generate Alerts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-800">{alerts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-sm">Unread Alerts</p>
          <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Read Alerts</p>
          <p className="text-2xl font-bold text-green-600">{alerts.length - unreadCount}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Alerts</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-2 rounded font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-6 py-2 rounded font-medium transition ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Read ({alerts.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts
          </h2>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {alerts.length === 0 ? (
              <>
                <Bell size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg mb-2">No alerts yet</p>
                <p className="text-sm mb-6">You're all caught up!</p>
                <button
                  onClick={handleGenerateAlerts}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Check for New Alerts
                </button>
              </>
            ) : (
              <>
                <p className="text-lg">No {filter} alerts found</p>
                <p className="text-sm">Try selecting a different filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-2 rounded-lg p-5 transition-all ${getBorderColor(
                  alert.alert_type
                )} ${!alert.read_status ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Alert Icon and Content */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1">
                      {/* Alert Type Badge */}
                      <span
                        className={`inline-block px-3 py-1 rounded text-xs font-semibold mb-2 ${getBadgeColor(
                          alert.alert_type
                        )}`}
                      >
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </span>
                      {/* Alert Message */}
                      <p className="text-gray-900 font-medium mb-2">{alert.message}</p>
                      {/* Timestamp */}
                      <p className="text-sm text-gray-500">
                        {new Date(alert.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!alert.read_status && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                        title="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                      title="Delete alert"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsCenter;
