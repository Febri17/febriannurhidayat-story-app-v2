import { convertBlobToBase64 } from '../../utils/index';
import { addOutboxItem } from '../../data/offline-db';

export default class NewPresenter {
  #view;
  #model;
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async postNewStory({ description, photo, lat, lon } = {}) {
    try {
      if (!navigator.onLine) {
        let photoBase64 = null;
        let type = 'image/png';
        if (photo) {
          type = photo.type || 'image/png';
          const b64 = await convertBlobToBase64(photo);
          photoBase64 = b64;
        }
        const payload = {
          payload: {
            description,
            photo: photoBase64 ? { content: photoBase64, type } : null,
            lat,
            lon,
          },
        };
        await addOutboxItem(payload);
        return { queued: true };
      }

      const response = await this.#model.addStory({ description, photo, lat, lon });
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof this.#model.addStoryGuest === 'function') {
            const guest = await this.#model.addStoryGuest({ description, photo, lat, lon });
            return guest;
          }
        }
        return response;
      }
      return response;
    } catch (err) {
      console.error('postNewStory error', err);
      try {
        let photoBase64 = null;
        let type = 'image/png';
        if (photo) {
          type = photo.type || 'image/png';
          const b64 = await convertBlobToBase64(photo);
          photoBase64 = b64;
        }
        const payload = {
          payload: {
            description,
            photo: photoBase64 ? { content: photoBase64, type } : null,
            lat,
            lon,
          },
        };
        await addOutboxItem(payload);
        return { queued: true };
      } catch (e) {
        return { ok: false, message: err?.message || 'Network error' };
      }
    }
  }
}
