import { useEffect, useState } from "react";
import axios from "axios";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const res = await axios.get("http://127.0.0.1:8000/alerts/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAlerts(res.data);
  };

  const markRead = async (id) => {
    await axios.put(
      `http://127.0.0.1:8000/alerts/${id}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchAlerts();
  };

  const unreadCount = alerts.filter(a => !a.read_status).length;

  return (
    <div className="p-8 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Alerts
        </h1>

        {unreadCount > 0 && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-500">No alerts available</p>
      ) : (
        alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border shadow-sm flex justify-between items-center ${
              alert.read_status
                ? "bg-gray-50"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div>
              <p className="font-medium">{alert.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>

            {!alert.read_status && (
              <button
                onClick={() => markRead(alert.id)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md"
              >
                Mark as Read
              </button>
            )}
          </div>
        ))
      )}

    </div>
  );
}
