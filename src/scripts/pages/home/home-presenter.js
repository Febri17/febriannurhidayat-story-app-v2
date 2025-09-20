import { storyMapper } from '../../data/api-mapper';

export default class HomePresenter {
  #view;
  #model;
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async initialLoad({ page = 1, size = 10, location = 0 } = {}) {
    this.#view.showLoading();
    try {
      let response = await this.#model.getAllStories({ page, size, location });
      if (!response.ok && response.status === 401) {
        try {
          const guestRes = await this.#model.getAllStoriesGuest({ page, size, location });
          response = guestRes;
        } catch (err) {}
      }
      if (!response.ok) {
        this.#view.populateStoriesListError(response.message || 'Gagal memuat stories');
        return;
      }
      const list = response.listStory || response.list || [];
      const stories = await Promise.all(list.map(storyMapper));
      this.#view.populateStoriesList(response.message, stories);
    } catch (err) {
      console.error('initialLoad error', err);
      this.#view.populateStoriesListError(err?.message || 'Kesalahan jaringan');
    } finally {
      this.#view.hideLoading();
    }
  }
}
