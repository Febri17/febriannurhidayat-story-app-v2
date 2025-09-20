import CONFIG from '../config';
import { putAccessToken, removeAccessToken } from '../utils/auth';

const ENDPOINT = `${CONFIG.BASE_URL}`;

export async function register({ name, email, password }) {
  const response = await fetch(`${ENDPOINT}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const json = await response.json();
  return { ...json, ok: response.ok, status: response.status };
}

export async function login({ email, password }) {
  const response = await fetch(`${ENDPOINT}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await response.json();

  if (response.ok && (json.loginResult?.token || json.data?.accessToken)) {
    const token = json.loginResult?.token ?? json.data?.accessToken;
    putAccessToken(token);
  }

  return { ...json, ok: response.ok, status: response.status };
}

export async function logout() {
  removeAccessToken();
  return true;
}
