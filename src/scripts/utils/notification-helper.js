import { convertBase64ToUint8Array } from './index';
import CONFIG from '../config';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api';

export function isNotificationAvailable() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }
  if (isNotificationGranted()) return true;
  const status = await Notification.requestPermission();
  if (status === 'denied') {
    alert('Izin notifikasi ditolak.');
    return false;
  }
  if (status === 'default') {
    alert('Izin notifikasi ditutup atau diabaikan.');
    return false;
  }
  return true;
}

export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!(await requestNotificationPermission())) return;
  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Sudah berlangganan push notification.');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());
    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });
    if (!response.ok) {
      alert('Langganan gagal.');
      await pushSubscription.unsubscribe();
      return;
    }
    alert('Berhasil berlangganan notifikasi.');
  } catch (err) {
    console.error('subscribe error', err);
    alert('Langganan gagal.');
  }
}

export async function unsubscribe() {
  try {
    const pushSubscription = await getPushSubscription();
    if (!pushSubscription) {
      alert('Belum berlangganan sebelumnya.');
      return;
    }
    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });
    if (!response.ok) {
      alert('Gagal berhenti berlangganan.');
      return;
    }
    const unsubscribed = await pushSubscription.unsubscribe();
    if (!unsubscribed) {
      alert('Gagal berhenti berlangganan pada client.');
      return;
    }
    alert('Berhasil berhenti berlangganan notifikasi.');
  } catch (err) {
    console.error('unsubscribe error', err);
    alert('Gagal berhenti berlangganan.');
  }
}
