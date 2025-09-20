import CONFIG from '../config';
import { getActiveRoute } from '../routes/url-parser';

export function getAccessToken() {
  try {
    const t = localStorage.getItem(CONFIG.ACCESS_TOKEN_KEY);
    if (!t || t === 'null' || t === 'undefined') return null;
    return t;
  } catch (e) {
    return null;
  }
}

export function putAccessToken(token) {
  try {
    localStorage.setItem(CONFIG.ACCESS_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function removeAccessToken() {
  try {
    localStorage.removeItem(CONFIG.ACCESS_TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}

const unauthenticatedRoutesOnly = ['/login', '/register', '/about'];

export function checkUnauthenticatedRouteOnly(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();
  if (unauthenticatedRoutesOnly.includes(url) && isLogin) {
    location.hash = '/';
    return null;
  }
  return page;
}

export function checkAuthenticatedRoute(page) {
  const isLogin = !!getAccessToken();
  if (!isLogin) {
    location.hash = '/login';
    return null;
  }
  return page;
}
