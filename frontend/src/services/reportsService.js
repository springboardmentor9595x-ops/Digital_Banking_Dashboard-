// src/services/reportsService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000';   // ← single declaration only

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};


// ============================================
// ALERTS
// ============================================

export const getAlerts = async () => {
  const response = await axios.get(`${API_URL}/alerts/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axios.get(`${API_URL}/alerts/unread/count`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const markAlertAsRead = async (alertId) => {
  const response = await axios.patch(
    `${API_URL}/alerts/${alertId}/read`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const markAllAlertsAsRead = async () => {
  const response = await axios.patch(
    `${API_URL}/alerts/mark-all-read`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const deleteAlert = async (alertId) => {
  await axios.delete(`${API_URL}/alerts/${alertId}`, {
    headers: getAuthHeader(),
  });
};

export const clearAllAlerts = async () => {
  await axios.delete(`${API_URL}/alerts/`, {
    headers: getAuthHeader(),
  });
};

export const generateAlerts = async () => {
  const response = await axios.post(
    `${API_URL}/alerts/generate`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};


// ============================================
// HELPER: triggers browser file download
// ============================================

const triggerDownload = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};


// ============================================
// INSIGHTS EXPORTS
// ============================================

export const downloadInsightsCSV = async (month, year) => {
  const response = await axios.get(
    `${API_URL}/insights/export-csv`,
    {
      headers: getAuthHeader(),
      params: { month, year },
      responseType: 'blob',          // ← axios handles blob cleanly
    }
  );
  triggerDownload(response.data, `monthly_summary_${month}_${year}.csv`);
};

export const downloadInsightsPDF = async (month, year) => {
  const response = await axios.get(
    `${API_URL}/insights/export-pdf`,
    {
      headers: getAuthHeader(),
      params: { month, year },
      responseType: 'blob',
    }
  );
  triggerDownload(response.data, `monthly_summary_${month}_${year}.pdf`);
};


// ============================================
// TRANSACTION EXPORTS (used in AccountTransactionsTable)
// ============================================

export const downloadAccountTransactionsCSV = async (accountId) => {
  const response = await axios.get(
    `${API_URL}/transactions/export/${accountId}/csv`,
    {
      headers: getAuthHeader(),
      responseType: 'blob',
    }
  );
  const date = new Date().toISOString().split('T')[0];
  triggerDownload(response.data, `transactions_${accountId}_${date}.csv`);
};

export const downloadAccountTransactionsPDF = async (accountId) => {
  const response = await axios.get(
    `${API_URL}/transactions/export/${accountId}/pdf`,
    {
      headers: getAuthHeader(),
      responseType: 'blob',
    }
  );
  const date = new Date().toISOString().split('T')[0];
  triggerDownload(response.data, `transactions_${accountId}_${date}.pdf`);
};


// ============================================
// DEFAULT EXPORT (all functions)
// ============================================

export default {
  // Alerts
  getAlerts,
  getUnreadCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  clearAllAlerts,
  generateAlerts,
  // Downloads
  downloadInsightsCSV,
  downloadInsightsPDF,
  downloadAccountTransactionsCSV,
  downloadAccountTransactionsPDF,
};
