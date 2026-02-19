import axios from 'axios';

const API_URL = 'http://localhost:8000';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const getAllInsights = async () => {
  try {
    const response = await axios.get(`${API_URL}/insights/`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Insights API Error:', error);
    throw error;
  }
};

export default {
  getAllInsights,
};
