import React from 'react';
import { X, AlertTriangle, IndianRupee, TrendingDown, BellRing } from 'lucide-react';

const AlertPopup = ({ alerts, onClose, onDismissAlert }) => {
  // Filter for only unread alerts to display in the initial login popup
  const activeAlerts = alerts.filter(a => !a.read_status);
  
  if (activeAlerts.length === 0) return null;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_balance': return <div className="p-2 bg-orange-100 rounded-lg"><IndianRupee className="w-5 h-5 text-orange-600" /></div>;
      case 'budget_exceeded': return <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>;
      case 'bill_due': return <div className="p-2 bg-blue-100 rounded-lg"><BellRing className="w-5 h-5 text-blue-600" /></div>;
      default: return <div className="p-2 bg-gray-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-gray-600" /></div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Financial Insights</h3>
            <p className="text-xs text-gray-500">You have {activeAlerts.length} new items requiring attention</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-gray-50/50">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              {getAlertIcon(alert.alert_type)}
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                  {alert.message}
                </p>
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Mark as Read
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;