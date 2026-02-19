import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

// Get all alerts for current user
export const getAlerts = async () => {
  const response = await axios.get(`${API_URL}/alerts/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Mark alert as read
export const markAlertAsRead = async (alertId) => {
  const response = await axios.patch(
    `${API_URL}/alerts/${alertId}/read`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

// Delete alert
export const deleteAlert = async (alertId) => {
  await axios.delete(`${API_URL}/alerts/${alertId}`, {
    headers: getAuthHeader(),
  });
};


// Get unread count
export const getUnreadCount = async () => {
  const response = await axios.get(`${API_URL}/alerts/unread/count`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Generate alerts manually
export const generateAlerts = async () => {
  const response = await axios.post(
    `${API_URL}/alerts/generate`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

export default {
  getAlerts,
  markAlertAsRead,
  deleteAlert,
  getUnreadCount,
  generateAlerts,
};
