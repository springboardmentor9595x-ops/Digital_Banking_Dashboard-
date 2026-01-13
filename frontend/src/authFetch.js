import { API_URL } from "./api";

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}
