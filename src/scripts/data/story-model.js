import CONFIG from '../config';
import { getAccessToken } from '../utils/auth';
import { addToOutbox, deleteOutboxItem, putCachedStory, getAllCachedStories } from './offline-db';

async function fetchWithToken(url, options = {}) {
  const token = getAccessToken();
  const headers = options.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

const ENDPOINT = `${CONFIG.BASE_URL}`;

export async function getAllStories({ page = 1, size = 10, location = 0 } = {}) {
  try {
    const url = new URL(`${ENDPOINT}/stories`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
    url.searchParams.set('location', String(location));
    const res = await fetchWithToken(url.toString());
    const json = await res.json();
    try {
      const list = json.listStory || json.list || [];
      await Promise.all(
        list.map(async (s) => {
          const normalized = {
            id: s.id,
            name: s.name,
            description: s.description,
            photoUrl: s.photoUrl,
            createdAt: s.createdAt,
            lat: s.lat,
            lon: s.lon,
          };
          await putCachedStory(normalized);
        }),
      );
    } catch (e) {
      console.warn('getAllStories: cache store failed', e);
    }
    return { ...json, ok: res.ok, status: res.status };
  } catch (error) {
    try {
      const cached = await getAllCachedStories();
      if (cached && cached.length) {
        return {
          error: false,
          message: 'Stories (offline cache)',
          listStory: cached,
          ok: true,
          status: 200,
        };
      }
    } catch (e) {}
    return { ok: false, error: true, message: error.message || 'Network error' };
  }
}

export async function getStoryById(id) {
  try {
    const url = `${ENDPOINT}/stories/${id}`;
    const res = await fetchWithToken(url);
    const json = await res.json();
    return { ...json, ok: res.ok, status: res.status };
  } catch (error) {
    return { ok: false, error: true, message: error.message || 'Network error' };
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1];
      resolve({ content: base64, type: blob.type || 'application/octet-stream' });
    };
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, type = 'image/png') {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  const sliceSize = 512;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type });
}

export async function addStory({ description, photo, lat, lon } = {}) {
  try {
    const form = new FormData();
    if (typeof description !== 'undefined') form.append('description', description);
    if (photo) {
      if (photo instanceof Blob || (typeof File !== 'undefined' && photo instanceof File)) {
        const filename = photo.name || `photo-${Date.now()}.png`;
        form.append('photo', photo, filename);
      } else if (photo && photo.content && photo.type) {
        const blob = base64ToBlob(photo.content, photo.type);
        form.append('photo', blob, `photo-${Date.now()}`);
      }
    }
    if (typeof lat !== 'undefined') form.append('lat', lat);
    if (typeof lon !== 'undefined') form.append('lon', lon);

    const res = await fetchWithToken(`${ENDPOINT}/stories`, {
      method: 'POST',
      body: form,
    });

    const json = await res.json();
    if (res.ok && json && !json.error) {
      if (json.listStory || json.story || json.data) {
      }
    }
    return { ...json, ok: res.ok, status: res.status };
  } catch (error) {
    try {
      const photoPayload = photo
        ? photo instanceof Blob || (typeof File !== 'undefined' && photo instanceof File)
          ? await blobToBase64(photo)
          : photo
        : null;

      await addToOutbox({
        asGuest: false,
        payload: {
          description,
          photo: photoPayload,
          lat,
          lon,
        },
      });

      return { ok: false, queued: true, message: 'Queued for sync when online' };
    } catch (e) {
      return { ok: false, error: true, message: error.message || 'Network error' };
    }
  }
}

export async function addStoryGuest({ description, photo, lat, lon } = {}) {
  try {
    const form = new FormData();
    if (typeof description !== 'undefined') form.append('description', description);
    if (photo) {
      if (photo instanceof Blob || (typeof File !== 'undefined' && photo instanceof File)) {
        const filename = photo.name || `photo-${Date.now()}.png`;
        form.append('photo', photo, filename);
      } else if (photo && photo.content && photo.type) {
        const blob = base64ToBlob(photo.content, photo.type);
        form.append('photo', blob, `photo-${Date.now()}`);
      }
    }
    if (typeof lat !== 'undefined') form.append('lat', lat);
    if (typeof lon !== 'undefined') form.append('lon', lon);

    const res = await fetch(`${ENDPOINT}/stories/guest`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    return { ...json, ok: res.ok, status: res.status };
  } catch (error) {
    try {
      const photoPayload = photo
        ? photo instanceof Blob || (typeof File !== 'undefined' && photo instanceof File)
          ? await blobToBase64(photo)
          : photo
        : null;
      await addToOutbox({
        asGuest: true,
        payload: {
          description,
          photo: photoPayload,
          lat,
          lon,
        },
      });
      return { ok: false, queued: true, message: 'Queued for sync as guest when online' };
    } catch (e) {
      return { ok: false, error: true, message: error.message || 'Network error' };
    }
  }
}
