import { API_URL } from "../api";


export const getAlerts = async (token) => {
  const res = await fetch(`${API_URL}/alerts/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const uploadProfilePhoto = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/profile/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return res.json();
};

export const getUserProfile = async (token) => {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};
