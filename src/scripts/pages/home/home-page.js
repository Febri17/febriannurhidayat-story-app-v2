import {
  generateLoader,
  generateStoryItemTemplate,
  generateStoriesListEmpty,
} from '../../templates';
import HomePresenter from './home-presenter';
import * as ApiModel from '../../data/api';
import { getAllOutbox } from '../../data/offline-db';
import { processOutboxItem } from '../../utils/offline-sync';

export default class HomePage {
  #presenter = null;
  async render() {
    return `
      <section>
        <div class="reports-list__map__container"></div>
      </section>
      <section class="container">
        <h1 class="section-title">Beranda</h1>
        <div id="outbox-list-container"></div>
        <div class="stories-list__container">
          <div id="stories-list" class="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({ view: this, model: ApiModel });
    await this.#presenter.initialLoad();
    await this.loadQueuedItems();
  }

  showLoading() {
    document.getElementById('stories-list-loading-container').innerHTML = generateLoader();
  }
  hideLoading() {
    document.getElementById('stories-list-loading-container').innerHTML = '';
  }

  populateStoriesList(message, stories = []) {
    if (!Array.isArray(stories) || stories.length === 0) {
      document.getElementById('stories-list').innerHTML = generateStoriesListEmpty();
      return;
    }
    const html = stories
      .map((s) =>
        generateStoryItemTemplate({
          id: s.id,
          name: s.name,
          description: s.description,
          photoUrl: s.photoUrl,
          createdAt: s.createdAt,
          lat: s.lat,
          lon: s.lon,
        }),
      )
      .join('');
    document.getElementById('stories-list').innerHTML = `<div class="stories-grid">${html}</div>`;
  }

  populateStoriesListError(message) {
    document.getElementById('stories-list').innerHTML =
      `<div class="stories-error"><h2>Gagal memuat stories</h2><p>${message || 'Terjadi kesalahan.'}</p></div>`;
  }

  async loadQueuedItems() {
    const container = document.getElementById('outbox-list-container');
    if (!container) return;
    try {
      const items = await getAllOutbox();
      if (!items || items.length === 0) {
        container.innerHTML = '';
        return;
      }
      const html = items
        .map((it) => {
          const rec = it.payload ?? it;
          const p = rec.payload ?? rec;
          const desc = p.description || '(tanpa deskripsi)';
          const time = new Date(it.createdAt || Date.now()).toLocaleString();
          return `
          <div class="outbox-item" data-outboxid="${it.id}">
            <div><strong>Pending:</strong> ${desc.length > 80 ? desc.slice(0, 80) + '...' : desc}<div style="font-size:.85rem;color:#666">${time}</div></div>
            <div><button class="btn outbox-retry" data-id="${it.id}">Retry</button></div>
          </div>
        `;
        })
        .join('');
      container.innerHTML = `<h3>Upload tertunda</h3>${html}`;
      container.querySelectorAll('button.outbox-retry').forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
          const id = Number(ev.currentTarget.dataset.id);
          ev.currentTarget.disabled = true;
          ev.currentTarget.textContent = 'Memproses...';
          const res = await processOutboxItem(id);
          if (res && res.ok) {
            alert('Sinkron berhasil.');
            await this.#presenter.initialLoad();
            await this.loadQueuedItems();
          } else {
            alert(res?.message || 'Gagal sinkron. Akan dicoba lagi.');
            ev.currentTarget.disabled = false;
            ev.currentTarget.textContent = 'Retry';
          }
        });
      });
    } catch (e) {
      console.error('loadQueuedItems error', e);
      container.innerHTML = '';
    }
  }
}
