import axios from 'axios';
import { toast } from 'react-toastify';  // Notification library

// ==========================================
// STEP 1: Create Axios Instance
// ==========================================
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// ==========================================
// STEP 2: Add Token to Every Request
// ==========================================
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==========================================
// STEP 3: Export API Functions
// ==========================================

// LOGIN
export const login = (email, password) => {
  return API.post('/auth/login', { email, password });
};

// REGISTER
export const register = (name, email, password, phone, kycStatus) => {
  return API.post('/auth/register', { name, email, password, phone, kycStatus });
};

// DASHBOARD
export const getDashboard = () => {
  return API.get('/dashboard/overview');
};

// ACCOUNTS
export const getAccounts = () => {
  return API.get('/accounts');
};

// TRANSACTIONS
export const getTransactions = () => {
  return API.get('/transactions');
};

// CREATE ACCOUNT
export const createAccount = (accountData) => {
  return API.post('/accounts', accountData);
};

// Delete ACCOUNT
export const deleteAccount = (accountId) => {
  return API.delete(`/accounts/${accountId}`);
};

// CREATE TRANSACTION
export const createTransaction = (data) => {
  return API.post('/transactions/', data);
};


// UPDATE TRANSACTION CATEGORY
export const updateTransactionCategory = (transactionId, category) => {
  return API.put(`/transactions/${transactionId}`, {
    category,
  });
};
// DELETE TRANSACTION
export const deleteTransaction = (transactionId) => {
  return API.delete(`/transactions/${transactionId}`);
};

//  UPLOAD TRANSACTIONS VIA CSV
export const uploadTransactionsCSV = (accountId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return API.post(`/transactions/upload-csv/${accountId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


//  Global error handling (optional)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Something went wrong';

    toast.error(message);
    return Promise.reject(error);
  }
);

export default API;