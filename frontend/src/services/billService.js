import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

// Get all bills for current user
export const getBills = async () => {
  const response = await axios.get(`${API_URL}/bills/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Create new bill
export const createBill = async (billData) => {
  const response = await axios.post(`${API_URL}/bills/`, billData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Update bill status
export const updateBillStatus = async (billId, status) => {
  const response = await axios.put(
    `${API_URL}/bills/${billId}`,
    { status },
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

// Delete bill
export const deleteBill = async (billId) => {
  await axios.delete(`${API_URL}/bills/${billId}`, {
    headers: getAuthHeader(),
  });
};

export default {
  getBills,
  createBill,
  updateBillStatus,
  deleteBill,
};
