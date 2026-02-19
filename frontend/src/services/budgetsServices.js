import axios from 'axios';

const API_URL = 'http://localhost:8000';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const getBudgets = async () => {
  const response = await axios.get(`${API_URL}/budgets/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const createBudget = async (budgetData) => {
  const response = await axios.post(`${API_URL}/budgets/`, budgetData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateBudget = async (budgetId, budgetData) => {
  const response = await axios.put(`${API_URL}/budgets/${budgetId}`, budgetData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const deleteBudget = async (budgetId) => {
  await axios.delete(`${API_URL}/budgets/${budgetId}`, {
    headers: getAuthHeader(),
  });
};

export default {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
