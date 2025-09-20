import { getAllOutbox, deleteOutboxItem, putCachedStory } from '../data/offline-db';
import * as ApiModel from '../data/api';
import { convertBase64ToBlob } from './index';

export async function processOutbox() {
  try {
    const items = await getAllOutbox();
    if (!items || items.length === 0) return { processed: 0 };

    let processed = 0;
    for (const item of items) {
      const id = item.id;
      const rec = item.payload ?? item;
      const payload = rec.payload ?? rec;
      const asGuest = payload.asGuest ?? false;

      const photo = payload.photo;
      const photoBlob =
        photo && photo.content
          ? convertBase64ToBlob(
              photo.content.replace(/^data:image\/\w+;base64,/, ''),
              photo.type || 'image/png',
            )
          : null;

      const candidate = {
        description: payload.description,
        photo: photoBlob,
        lat: payload.lat,
        lon: payload.lon,
      };

      let response;
      if (asGuest) response = await ApiModel.addStoryGuest(candidate);
      else response = await ApiModel.addStory(candidate);

      if (response && (response.ok || response.error === false)) {
        try {
          const s =
            response.story ?? response.data ?? (response.listStory && response.listStory[0]);
          if (s && s.id) {
            await putCachedStory({
              id: s.id,
              name: s.name,
              description: s.description,
              photoUrl: s.photoUrl,
              createdAt: s.createdAt,
              lat: s.lat,
              lon: s.lon,
            });
          }
        } catch (e) {}
        await deleteOutboxItem(id);
        processed++;
      } else {
        if (response && response.status && response.status >= 400 && response.status < 500) {
          await deleteOutboxItem(id);
        }
      }
    }
    return { processed };
  } catch (err) {
    console.error('processOutbox error', err);
    return { processed: 0, error: err };
  }
}

export async function processOutboxItem(itemId) {
  try {
    const items = await getAllOutbox();
    const item = items.find((i) => i.id === itemId);
    if (!item) return { ok: false, message: 'Item not found' };

    const payload = (item.payload ?? item).payload ?? item.payload ?? item;
    const asGuest = payload.asGuest ?? false;
    const photo = payload.photo;
    const photoBlob =
      photo && photo.content
        ? convertBase64ToBlob(
            photo.content.replace(/^data:image\/\w+;base64,/, ''),
            photo.type || 'image/png',
          )
        : null;

    const candidate = {
      description: payload.description,
      photo: photoBlob,
      lat: payload.lat,
      lon: payload.lon,
    };

    let response;
    if (asGuest) response = await ApiModel.addStoryGuest(candidate);
    else response = await ApiModel.addStory(candidate);

    if (response && (response.ok || response.error === false)) {
      try {
        const s = response.story ?? response.data ?? (response.listStory && response.listStory[0]);
        if (s && s.id) {
          await putCachedStory({
            id: s.id,
            name: s.name,
            description: s.description,
            photoUrl: s.photoUrl,
            createdAt: s.createdAt,
            lat: s.lat,
            lon: s.lon,
          });
        }
      } catch (e) {}
      await deleteOutboxItem(itemId);
      return { ok: true };
    }

    if (response && response.status && response.status >= 400 && response.status < 500) {
      await deleteOutboxItem(itemId);
      return { ok: false, message: response.message || 'Client error - removed' };
    }
    return { ok: false, message: response?.message || 'Not processed' };
  } catch (err) {
    console.error('processOutboxItem error', err);
    return { ok: false, message: err?.message || 'Error' };
  }
}
