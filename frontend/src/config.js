// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  
  // Accounts
  ACCOUNTS: '/accounts',
  ACCOUNT_BY_ID: (id) => `/accounts/${id}`,
  
  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTIONS_BY_ACCOUNT: (accountId) => `/accounts/${accountId}/transactions`,
  TRANSACTION_BY_ID: (id) => `/transactions/${id}`,
  UPDATE_TRANSACTION_CATEGORY: (id) => `/transactions/${id}/category`,
  
  // Categories (will add later)
  CATEGORIES: '/categories',
  CATEGORY_RULES: '/categories/rules',
};