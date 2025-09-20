import { getAllCachedStories } from '../../data/offline-db';
import { reportMapper } from '../../data/api-mapper';

export default class BookmarkPresenter {
  #view;
  #model;
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async initialGalleryAndMap() {
    this.#view.showReportsListLoading();
    try {
      await this.#view.initialMap();
      const cached = await getAllCachedStories();
      const reports = (cached || []).map((r) => ({
        id: r.id,
        title: r.name,
        description: r.description,
        evidenceImages: [r.photoUrl],
        location: { latitude: r.lat, longitude: r.lon, placeName: '' },
        reporterName: r.name,
        createdAt: r.createdAt,
      }));
      this.#view.populateBookmarkedReports('OK', reports);
    } catch (err) {
      console.error('bookmark error', err);
      this.#view.populateBookmarkedReportsError(err?.message || 'Gagal memuat tersimpan');
    } finally {
      this.#view.hideReportsListLoading();
    }
  }
}
