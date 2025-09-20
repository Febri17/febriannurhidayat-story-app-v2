import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_BY_ID: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  NOTIFICATIONS_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

function _getToken() {
  try {
    const token = localStorage.getItem(CONFIG.ACCESS_TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  } catch {
    return null;
  }
}

async function _handleResponse(res) {
  const json = await res.json().catch(() => null);
  return { ...json, ok: res.ok, status: res.status };
}

export async function register({ name, email, password }) {
  try {
    const res = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function login({ email, password }) {
  try {
    const res = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function addStory({ description, photo, lat, lon } = {}) {
  try {
    const form = new FormData();
    if (typeof description !== 'undefined') form.append('description', description);
    if (photo) {
      const filename = photo.name || `photo-${Date.now()}.png`;
      form.append('photo', photo, filename);
    }
    if (typeof lat !== 'undefined') form.append('lat', String(lat));
    if (typeof lon !== 'undefined') form.append('lon', String(lon));

    const headers = {};
    const token = _getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(ENDPOINTS.STORIES, {
      method: 'POST',
      headers,
      body: form,
    });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function addStoryGuest({ description, photo, lat, lon } = {}) {
  try {
    const form = new FormData();
    if (typeof description !== 'undefined') form.append('description', description);
    if (photo) {
      const filename = photo.name || `photo-${Date.now()}.png`;
      form.append('photo', photo, filename);
    }
    if (typeof lat !== 'undefined') form.append('lat', String(lat));
    if (typeof lon !== 'undefined') form.append('lon', String(lon));

    const res = await fetch(`${ENDPOINTS.STORIES}/guest`, {
      method: 'POST',
      body: form,
    });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function getAllStories({ page = 1, size = 10, location = 0 } = {}) {
  try {
    const url = new URL(ENDPOINTS.STORIES);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
    url.searchParams.set('location', String(location));
    const headers = {};
    const token = _getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url.toString(), { headers });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function getAllStoriesGuest({ page = 1, size = 10, location = 0 } = {}) {
  try {
    const url = new URL(ENDPOINTS.STORIES);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
    url.searchParams.set('location', String(location));
    const res = await fetch(url.toString());
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function getStoryById(id) {
  try {
    const headers = {};
    const token = _getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${ENDPOINTS.STORIES}/${id}`, { headers });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function subscribePushNotification(payload) {
  try {
    const token = _getToken();
    const res = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}

export async function unsubscribePushNotification({ endpoint } = {}) {
  try {
    const token = _getToken();
    const res = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ endpoint }),
    });
    return _handleResponse(res);
  } catch (e) {
    return { ok: false, error: true, message: e.message || 'Network error' };
  }
}
