import StoryDetailPresenter from './story-detail-presenter';
import * as StoryModel from '../../data/story-model';
import Map from '../../utils/map';

import * as BookmarkDB from '../../data/bookmark-db';

import { getCachedStoryById, putCachedStory } from '../../data/offline-db';

function normalizeStoryObject(s) {
  if (!s || typeof s !== 'object') return null;

  const title =
    s.name ||
    s.title ||
    s.storyTitle ||
    (s.user && (s.user.name || s.user.fullname)) ||
    (s.createdBy && (s.createdBy.name || s.createdBy.username)) ||
    '';

  const reporterName =
    s.name ||
    s.reporterName ||
    (s.user && (s.user.name || s.user.fullname)) ||
    (s.createdBy && (s.createdBy.name || s.createdBy.username)) ||
    '';

  const images = [];
  if (s.photoUrl && typeof s.photoUrl === 'string') images.push(s.photoUrl);
  if (s.photo && typeof s.photo === 'string') images.push(s.photo);
  if (Array.isArray(s.photos)) {
    s.photos.forEach((p) => {
      if (!p) return;
      if (typeof p === 'string') images.push(p);
      else if (typeof p === 'object') {
        if (p.url) images.push(p.url);
        else if (p.photoUrl) images.push(p.photoUrl);
        else if (p.src) images.push(p.src);
      }
    });
  }
  if (Array.isArray(s.images)) {
    s.images.forEach((p) => {
      if (!p) return;
      if (typeof p === 'string') images.push(p);
      else if (typeof p === 'object') {
        if (p.url) images.push(p.url);
        else if (p.src) images.push(p.src);
      }
    });
  }

  const latitude =
    typeof s.lat !== 'undefined' ? s.lat : typeof s.latitude !== 'undefined' ? s.latitude : null;
  const longitude =
    typeof s.lon !== 'undefined' ? s.lon : typeof s.longitude !== 'undefined' ? s.longitude : null;

  const createdAt = s.createdAt || s.created_at || s.created || '';

  return {
    id: s.id ?? s._id ?? null,
    title: title || '',
    description: s.description ?? s.body ?? '',
    evidenceImages: images,
    photoUrl: images.length ? images[0] : null,
    createdAt: createdAt || new Date().toISOString(),
    reporterName: reporterName || '',
    lat: latitude !== null ? Number(latitude) : null,
    lon: longitude !== null ? Number(longitude) : null,
    location: {
      latitude: latitude !== null ? Number(latitude) : null,
      longitude: longitude !== null ? Number(longitude) : null,
      placeName:
        latitude !== null && longitude !== null ? `${latitude}, ${longitude}` : (s.placeName ?? ''),
    },
  };
}

export default class StoryDetailPage {
  #presenter = null;
  #id = null;
  #map = null;

  constructor(id) {
    this.#id = id;
  }

  async render() {
    return `
      <section class="container" id="story-detail-container">
        <div id="story-detail-loading" aria-live="polite"></div>
        <div id="story-detail"></div>
        <div id="map-loading-container"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!this.#id) {
      const m = location.hash.match(/\/stories\/([^\/?#]+)/);
      if (m && m[1]) {
        try {
          this.#id = decodeURIComponent(m[1]);
        } catch (e) {
          this.#id = m[1];
        }
      }
    }

    this.#presenter = new StoryDetailPresenter(this.#id, {
      view: this,
      model: StoryModel,
    });

    if (!this.#id) {
      this.populateReportDetailError('ID story tidak ditemukan. Periksa URL.');
      return;
    }

    await this.#presenter.showStoryDetail();
    if (typeof this.#presenter.getCommentsList === 'function') {
      this.#presenter.getCommentsList();
    }

    try {
      await this._setupBookmarkControls();
    } catch (err) {
      console.warn('Bookmark controls init failed', err);
    }
  }

  showReportDetailLoading() {
    const el = document.getElementById('story-detail-loading');
    if (el) el.innerHTML = `<div class="loader loader-absolute" aria-hidden="true"></div>`;
  }

  hideReportDetailLoading() {
    const el = document.getElementById('story-detail-loading');
    if (el) el.innerHTML = '';
  }

  showMapLoading() {
    const el = document.getElementById('map-loading-container');
    if (el) el.innerHTML = `<div class="loader loader-absolute" aria-hidden="true"></div>`;
  }

  hideMapLoading() {
    const el = document.getElementById('map-loading-container');
    if (el) el.innerHTML = '';
  }

  async initialMap() {
    try {
      this.#map = await Map.build('#map', { zoom: 15, locate: false });
    } catch (error) {
      console.error('initialMap failed', error);
      this.#map = null;
      throw error;
    }
  }

  async populateReportDetailAndInitialMap(message, report) {
    let resolvedReport = null;

    if (report && typeof report === 'object' && (report.id || report.title || report.description)) {
      resolvedReport = {
        id: report.id ?? report.reportId ?? this.#id,
        title: report.title ?? report.name ?? '',
        description: report.description ?? report.body ?? '',
        evidenceImages: Array.isArray(report.evidenceImages)
          ? report.evidenceImages
          : report.evidenceImages
            ? [report.evidenceImages]
            : report.photoUrl
              ? [report.photoUrl]
              : [],
        createdAt: report.createdAt ?? report.created_at ?? '',
        reporterName: report.reporterName ?? report.reporter ?? '',
        lat:
          typeof report.lat !== 'undefined'
            ? report.lat
            : typeof report.latitude !== 'undefined'
              ? report.latitude
              : null,
        lon:
          typeof report.lon !== 'undefined'
            ? report.lon
            : typeof report.longitude !== 'undefined'
              ? report.longitude
              : null,
        location: report.location ?? {
          latitude:
            typeof report.lat !== 'undefined'
              ? report.lat
              : typeof report.latitude !== 'undefined'
                ? report.latitude
                : null,
          longitude:
            typeof report.lon !== 'undefined'
              ? report.lon
              : typeof report.longitude !== 'undefined'
                ? report.longitude
                : null,
          placeName: report.location?.placeName ?? '',
        },
      };
    } else {
      try {
        const resp = await StoryModel.getStoryById(this.#id);
        if (resp && resp.ok) {
          const s = resp.story ?? resp.data ?? resp;
          resolvedReport = normalizeStoryObject(s);
        }
      } catch (err) {
        console.warn('Fallback getStoryById failed', err);
      }
    }

    if (!resolvedReport) {
      try {
        const cached = await getCachedStoryById(this.#id);
        if (cached) {
          resolvedReport = {
            id: cached.id,
            title: cached.title ?? cached.name ?? '',
            description: cached.description ?? '',
            evidenceImages: cached.photoUrl ? [cached.photoUrl] : (cached.evidenceImages ?? []),
            createdAt: cached.createdAt ?? '',
            reporterName: cached.reporterName ?? cached.name ?? '',
            lat: typeof cached.lat !== 'undefined' ? cached.lat : (cached.latitude ?? null),
            lon: typeof cached.lon !== 'undefined' ? cached.lon : (cached.longitude ?? null),
            location: cached.location ?? {
              latitude: cached.lat ?? null,
              longitude: cached.lon ?? null,
            },
          };
        }
      } catch (e) {
        console.warn('getCachedStoryById failed', e);
      }
    }

    if (!resolvedReport) {
      resolvedReport = {
        id: this.#id,
        title: '',
        description: '',
        evidenceImages: [],
        createdAt: '',
        reporterName: '',
        lat: null,
        lon: null,
        location: { latitude: null, longitude: null, placeName: '' },
      };
    }

    if (!Array.isArray(resolvedReport.evidenceImages))
      resolvedReport.evidenceImages = resolvedReport.evidenceImages
        ? [resolvedReport.evidenceImages]
        : [];

    const container = document.getElementById('story-detail');
    if (!container) return;

    const title = resolvedReport.title || '-';
    const createdAt = resolvedReport.createdAt || new Date().toISOString();
    const description = resolvedReport.description || '-';

    const imagesHtml =
      Array.isArray(resolvedReport.evidenceImages) && resolvedReport.evidenceImages.length > 0
        ? resolvedReport.evidenceImages
            .map((img) => `<img class="report-detail__image" src="${img}" alt="${title}">`)
            .join('')
        : `<img class="report-detail__image" src="images/placeholder-image.png" alt="No image">`;

    container.innerHTML = `
      <div class="report-detail__header">
        <h1 class="report-detail__title">${title}</h1>
        <div class="report-detail__more-info">
          <div class="report-detail__createdat">${new Date(createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div class="container">
        <div class="report-detail__images__container">
          <div id="images" class="report-detail__images">${imagesHtml}</div>
        </div>
      </div>

      <div class="container">
        <div class="report-detail__body">
          <div class="report-detail__body__description__container">
            <h2 class="report-detail__description__title">Deskripsi</h2>
            <div class="report-detail__description__body">${description}</div>
          </div>

          <div class="report-detail__body__map__container">
            <h2 class="report-detail__map__title">Peta Lokasi</h2>
            <div class="report-detail__map__container">
              <div id="map" class="report-detail__map" aria-hidden="false" style="min-height:300px;"></div>
              <div id="map-loading-container"></div>
            </div>
          </div>

          <div class="report-detail__body__actions__container" style="margin-top:20px;">
            <div id="bookmark-controls"></div>
          </div>
        </div>
      </div>
    `;

    try {
      if (this.#presenter && typeof this.#presenter.showStoryDetailMap === 'function') {
        await this.#presenter.showStoryDetailMap();
      } else {
        await this.initialMap();
      }
    } catch (err) {
      console.warn('Map init failed:', err);
    }

    try {
      const latVal = resolvedReport.lat ?? resolvedReport.location?.latitude;
      const lonVal = resolvedReport.lon ?? resolvedReport.location?.longitude;
      if (
        this.#map &&
        typeof latVal === 'number' &&
        typeof lonVal === 'number' &&
        !Number.isNaN(latVal)
      ) {
        const coord = [latVal, lonVal];
        if (typeof this.#map.changeCamera === 'function') this.#map.changeCamera(coord, 15);
        if (typeof this.#map.addMarker === 'function')
          this.#map.addMarker(coord, { draggable: false }, { content: resolvedReport.title || '' });
      }
    } catch (err) {
      console.warn('Adding marker failed', err);
    }
  }

  populateReportDetailError(message) {
    const container = document.getElementById('story-detail');
    if (!container) return;
    container.innerHTML = `
      <div class="report-detail__error">
        <h2>Kesalahan</h2>
        <p>${message || 'Gagal memuat detail story'}</p>
      </div>
    `;
  }

  populateReportDetailComments(message, comments) {
    let el = document.getElementById('story-detail-comments');
    if (!el) {
      el = document.createElement('div');
      el.id = 'story-detail-comments';
      el.className = 'story-detail__comments__container container';
      document.getElementById('story-detail-container')?.appendChild(el);
    }

    if (!Array.isArray(comments) || comments.length === 0) {
      el.innerHTML = `<p>Belum ada komentar.</p>`;
      return;
    }

    el.innerHTML = comments
      .map(
        (c) => `
      <article class="report-detail__comment-item">
        <div class="report-detail__comment-item__body">
          <div class="report-detail__comment-item__body__author">${c.name || 'Anonim'}</div>
          <div class="report-detail__comment-item__body__text">${c.body || ''}</div>
        </div>
      </article>
    `,
      )
      .join('');
  }

  async _setupBookmarkControls() {
    const controlsEl = document.getElementById('bookmark-controls');
    if (!controlsEl) return;

    controlsEl.innerHTML = `<div id="bookmark-status"></div><div id="bookmark-actions"></div>`;
    const statusEl = document.getElementById('bookmark-status');
    const actionsEl = document.getElementById('bookmark-actions');

    let canonical = null;
    try {
      const resp = await StoryModel.getStoryById(this.#id);
      if (resp && resp.ok) {
        canonical = normalizeStoryObject(resp.story ?? resp.data ?? resp);
      }
    } catch (err) {
      console.warn('Failed to fetch canonical story for bookmark:', err);
    }

    if (!canonical) {
      canonical = {
        id: this.#id,
        title: document.querySelector('.report-detail__title')?.textContent ?? '',
        description: document.querySelector('.report-detail__description__body')?.textContent ?? '',
        photoUrl: document.querySelector('#images img')?.src ?? null,
        createdAt:
          document.querySelector('.report-detail__createdat')?.textContent ??
          new Date().toISOString(),
        lat: null,
        lon: null,
      };
    }

    let isBookmarked = false;
    try {
      const exists = await BookmarkDB.getBookmarkById(this.#id);
      isBookmarked = !!exists;
    } catch (err) {
      console.warn('Bookmark existence check failed', err);
      isBookmarked = false;
    }

    const renderButtons = () => {
      actionsEl.innerHTML = '';
      if (isBookmarked) {
        statusEl.textContent = 'Story sudah tersimpan (Bookmark)';
        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn btn-outline';
        btnRemove.textContent = 'Hapus Bookmark';
        btnRemove.addEventListener('click', async () => {
          if (!confirm('Hapus story tersimpan ini?')) return;
          btnRemove.disabled = true;
          try {
            await BookmarkDB.deleteBookmark(this.#id);
            isBookmarked = false;
            statusEl.textContent = 'Story dihapus dari penyimpanan.';
            window.dispatchEvent(new Event('bookmarks-updated'));
            renderButtons();
          } catch (err) {
            console.error('deleteBookmark error', err);
            alert('Gagal menghapus bookmark.');
          } finally {
            btnRemove.disabled = false;
          }
        });
        actionsEl.appendChild(btnRemove);
      } else {
        statusEl.textContent = 'Story belum disimpan.';
        const btnSave = document.createElement('button');
        btnSave.className = 'btn';
        btnSave.textContent = 'Simpan ke Bookmark';
        btnSave.addEventListener('click', async () => {
          btnSave.disabled = true;
          try {
            const toStore = {
              id: canonical.id ?? this.#id,
              name: canonical.title ?? canonical.name ?? '',
              description: canonical.description ?? '',
              photoUrl: canonical.photoUrl ?? null,
              createdAt: canonical.createdAt ?? new Date().toISOString(),
              lat:
                typeof canonical.lat === 'number'
                  ? canonical.lat
                  : (canonical.location?.latitude ?? null),
              lon:
                typeof canonical.lon === 'number'
                  ? canonical.lon
                  : (canonical.location?.longitude ?? null),
            };

            await BookmarkDB.addBookmark(toStore);

            try {
              await putCachedStory({
                id: toStore.id,
                title: toStore.name,
                description: toStore.description,
                photoUrl: toStore.photoUrl,
                createdAt: toStore.createdAt,
                lat: toStore.lat,
                lon: toStore.lon,
              });
            } catch (e) {}

            isBookmarked = true;
            statusEl.textContent = 'Story berhasil disimpan.';
            window.dispatchEvent(new Event('bookmarks-updated'));
            renderButtons();
          } catch (err) {
            console.error('addBookmark error', err);
            alert('Gagal menyimpan story.');
          } finally {
            btnSave.disabled = false;
          }
        });
        actionsEl.appendChild(btnSave);
      }
    };

    renderButtons();
  }
}
