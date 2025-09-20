import {
  generateLoader,
  generateBookmarksListEmpty,
  generateBookmarkItemTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter';
import * as BookmarkDB from '../../data/bookmark-db';

export default class BookmarkPage {
  #presenter = null;

  async render() {
    return `
      <section class="container">
        <h1 class="section-title">Story Tersimpan</h1>

        <div id="bookmark-list-container">
          <div id="bookmark-list-loading">${generateLoader()}</div>
          <div id="bookmark-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({ view: this, model: BookmarkDB });

    await this.#presenter.loadBookmarks();
  }

  showLoading() {
    const loadingEl = document.getElementById('bookmark-list-loading');
    if (loadingEl) loadingEl.innerHTML = generateLoader();
  }

  hideLoading() {
    const loadingEl = document.getElementById('bookmark-list-loading');
    if (loadingEl) loadingEl.innerHTML = '';
  }

  showEmpty() {
    const listEl = document.getElementById('bookmark-list');
    const loadingEl = document.getElementById('bookmark-list-loading');
    if (loadingEl) loadingEl.innerHTML = '';
    if (listEl) listEl.innerHTML = generateBookmarksListEmpty();
  }

  showError(message) {
    const listEl = document.getElementById('bookmark-list');
    const loadingEl = document.getElementById('bookmark-list-loading');
    if (loadingEl) loadingEl.innerHTML = '';
    if (listEl)
      listEl.innerHTML = `<div class="stories-error"><h2>Gagal memuat</h2><p>${message || 'Kesalahan'}</p></div>`;
  }

  renderBookmarks(bookmarks = []) {
    const listEl = document.getElementById('bookmark-list');
    const loadingEl = document.getElementById('bookmark-list-loading');

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      if (loadingEl) loadingEl.innerHTML = '';
      if (listEl) listEl.innerHTML = generateBookmarksListEmpty();
      return;
    }

    const html = bookmarks.map((b) => generateBookmarkItemTemplate(b)).join('');
    if (loadingEl) loadingEl.innerHTML = '';
    if (listEl) listEl.innerHTML = `<div class="stories-grid">${html}</div>`;

    listEl.querySelectorAll('.btn-bookmark-delete').forEach((btn) => {
      if (btn._handlerRef) {
        try {
          btn.removeEventListener('click', btn._handlerRef);
        } catch (e) {}
        btn._handlerRef = null;
      }

      const handler = async (ev) => {
        ev.preventDefault();
        const id = btn.dataset.bookmarkId;
        if (!id) return;
        if (!confirm('Hapus story tersimpan ini?')) return;
        try {
          await this.#presenter.deleteBookmark(id);
        } catch (err) {
          console.error('deleteBookmark error', err);
          alert('Gagal menghapus story tersimpan');
        }
      };

      btn.addEventListener('click', handler);
      btn._handlerRef = handler;
    });
  }
}
