import { storyMapper } from '../../data/api-mapper';

export default class StoryDetailPresenter {
  #storyId;
  #view;
  #model;
  constructor(storyId, { view, model }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#model = model;
  }

  async showStoryDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (err) {
      console.error('map error', err);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showStoryDetail() {
    this.#view.showReportDetailLoading();
    try {
      const res = await this.#model.getStoryById(this.#storyId);
      if (!res || !res.ok) {
        this.#view.populateReportDetailError(res?.message || 'Gagal memuat');
        return;
      }
      const raw = res.story ?? res.data ?? res;
      const mapped = await storyMapper(raw);
      this.#view.populateReportDetailAndInitialMap(res.message || 'OK', mapped);
    } catch (err) {
      console.error('detail error', err);
      this.#view.populateReportDetailError(err?.message || 'Kesalahan jaringan');
    } finally {
      this.#view.hideReportDetailLoading();
    }
  }
}
