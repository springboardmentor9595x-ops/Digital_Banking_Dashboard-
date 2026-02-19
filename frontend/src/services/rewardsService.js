import api from '../api/axios';

export const createRewardProgram = async (programData) => {
  const response = await api.post('/rewards/', programData);
  return response.data;
};

export const getRewards = async () => {
  const response = await api.get('/rewards/');
  return response.data;
};

export const getRewardById = async (rewardId) => {
  const response = await api.get(`/rewards/${rewardId}`);
  return response.data;
};

export const updateRewardPoints = async (rewardId, pointsToAdd) => {
  const response = await api.patch(`/rewards/${rewardId}/points`, {
    points_to_add: pointsToAdd,
  });
  return response.data;
};

export const getRewardsSummary = async () => {
  const response = await api.get('/rewards/summary/stats');
  return response.data;
};

export default {
  createRewardProgram,
  getRewards,
  getRewardById,
  updateRewardPoints,
  getRewardsSummary,
};
