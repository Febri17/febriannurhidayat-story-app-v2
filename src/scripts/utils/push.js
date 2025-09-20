import CONFIG from '../config';
import { urlBase64ToUint8Array } from './index';
import * as StoryAPI from '../data/api';

const SERVICE_WORKER_FILENAME = 'sw.bundle.js';
function resolveServiceWorkerUrl() {
  return new URL(SERVICE_WORKER_FILENAME, location.href).toString();
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker tidak didukung browser ini.');
  }
  const existingRegs = await navigator.serviceWorker.getRegistrations();
  const swUrl = resolveServiceWorkerUrl();
  const existing = existingRegs.find((r) => r && r.active && r.scriptURL === swUrl);
  if (existing) return existing;

  const reg = await navigator.serviceWorker.register(swUrl);
  return reg;
}

export async function askNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notification API tidak didukung.');
  }
  const permission = await Notification.requestPermission();
  return permission;
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

export async function subscribeUser() {
  try {
    const permission = await askNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Izin notifikasi ditolak.');
    }

    const reg = await registerServiceWorker();
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    });

    const payload = {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
    };
    const resp = await StoryAPI.subscribePush(payload);
    if (!resp.ok) {
      throw new Error(resp.message || 'Gagal subscribe di server');
    }

    return subscription;
  } catch (err) {
    throw err;
  }
}

export async function unsubscribeUser() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) throw new Error('Service worker registration tidak ditemukan.');

    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return null;

    const payload = { endpoint: subscription.endpoint };
    const resp = await StoryAPI.unsubscribePush(payload);
    if (!resp.ok) {
      console.warn('Unsubscribe server message:', resp.message);
    }

    const unsub = await subscription.unsubscribe();
    return unsub;
  } catch (err) {
    throw err;
  }
}
