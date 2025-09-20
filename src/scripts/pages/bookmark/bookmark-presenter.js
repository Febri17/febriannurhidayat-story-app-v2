import * as BookmarkDB from '../../data/bookmark-db';

export default class BookmarkPresenter {
  #view;
  #model;

  constructor({ view, model = BookmarkDB }) {
    this.#view = view;
    this.#model = model;
  }

  async loadBookmarks() {
    if (!this.#view) return;
    try {
      if (typeof this.#view.showLoading === 'function') this.#view.showLoading();

      const bookmarks = await this.#model.getAllBookmarks();

      if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
        if (typeof this.#view.showEmpty === 'function') {
          this.#view.showEmpty();
        } else if (typeof this.#view.renderBookmarks === 'function') {
          this.#view.renderBookmarks([]);
        }
        return;
      }

      const sorted = [...bookmarks].sort((a, b) => {
        if (!a.savedAt && !b.savedAt) return 0;
        if (!a.savedAt) return 1;
        if (!b.savedAt) return -1;
        return new Date(b.savedAt) - new Date(a.savedAt);
      });

      if (typeof this.#view.renderBookmarks === 'function') {
        this.#view.renderBookmarks(sorted);
      }
    } catch (err) {
      console.error('BookmarkPresenter.loadBookmarks error', err);
      if (typeof this.#view.showError === 'function') {
        this.#view.showError(err?.message || 'Gagal memuat daftar tersimpan');
      }
    } finally {
      if (typeof this.#view.hideLoading === 'function') this.#view.hideLoading();
    }
  }

  async deleteBookmark(id) {
    try {
      await this.#model.deleteBookmark(id);
      await this.loadBookmarks();
    } catch (err) {
      console.error('BookmarkPresenter.deleteBookmark error', err);
      if (typeof this.#view.showError === 'function') {
        this.#view.showError(err?.message || 'Gagal menghapus tersimpan');
      }
    }
  }
}
