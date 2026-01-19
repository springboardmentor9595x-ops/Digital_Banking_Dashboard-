import axios from 'axios';

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