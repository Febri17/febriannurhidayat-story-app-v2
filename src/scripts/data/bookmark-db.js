const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'bookmarks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function withStore(mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let result;
    try {
      result = callback(store);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = (e) => reject(e.target.error);
  });
}

export async function addBookmark(storyObj) {
  if (!storyObj || !storyObj.id) throw new Error('Invalid story object, id missing');
  const obj = {
    ...storyObj,
    savedAt: new Date().toISOString(),
  };
  return withStore('readwrite', (store) => {
    const req = store.put(obj);
    return obj;
  });
}

export async function getBookmarkById(id) {
  if (!id) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = (e) => resolve(e.target.result || null);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllBookmarks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteBookmark(id) {
  if (!id) return false;
  return withStore('readwrite', (store) => {
    store.delete(id);
    return true;
  });
}

export async function isBookmarked(id) {
  const r = await getBookmarkById(id);
  return !!r;
}
