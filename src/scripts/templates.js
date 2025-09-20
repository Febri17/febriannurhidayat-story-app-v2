export function generateLoader() {
  return `<div class="loader" role="status" aria-live="polite"></div>`;
}

export function generateLoaderAbsoluteTemplate() {
  return `<div class="loader loader-absolute" aria-hidden="true"></div>`;
}

export function generateMainNavigationListTemplate() {
  return `
    <li role="none"><a role="menuitem" href="#/">Beranda</a></li>
    <li role="none"><a role="menuitem" href="#/new">Buat Story</a></li>
    <li role="none"><a role="menuitem" href="#/bookmark">Tersimpan</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li role="none"><button id="logout-button" class="btn">Keluar</button></li>
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li role="none"><a role="menuitem" href="#/login">Masuk</a></li>
    <li role="none"><a role="menuitem" href="#/register">Daftar</a></li>
  `;
}

export function generateSubscribeButtonTemplate() {
  return `<button id="subscribe-button" class="btn btn-outline" type="button">Berlangganan Notifikasi</button>`;
}
export function generateUnsubscribeButtonTemplate() {
  return `<button id="unsubscribe-button" class="btn btn-outline" type="button">Berhenti Berlangganan</button>`;
}

export function generateStoryItemTemplate({
  id,
  name,
  description,
  photoUrl,
  createdAt,
  lat,
  lon,
}) {
  const shortDesc = description
    ? description.length > 150
      ? description.slice(0, 147) + '...'
      : description
    : '';
  return `
    <article tabindex="0" class="story-item" data-id="${id}">
      <a href="#/stories/${id}" class="story-link">
        <img class="story-item__image" src="${photoUrl}" alt="Foto story oleh ${name}">
        <div class="story-item__body">
          <h2 class="story-item__title">${name}</h2>
          <div class="story-item__meta">${new Date(createdAt).toLocaleString()}</div>
          <p class="story-item__desc">${shortDesc}</p>
          ${lat && lon ? `<div class="story-item__location">Lokasi: ${lat}, ${lon}</div>` : ''}
        </div>
      </a>
    </article>
  `;
}

export function generateReportItemTemplate({
  id,
  title,
  description,
  evidenceImages,
  createdAt,
  location,
  reporterName,
}) {
  const imageUrl =
    evidenceImages && evidenceImages.length > 0
      ? evidenceImages[0]
      : 'images/placeholder-image.png';
  const shortDesc = description
    ? description.length > 150
      ? description.slice(0, 147) + '...'
      : description
    : '';
  const placeName =
    location?.placeName ||
    (typeof location?.latitude !== 'undefined' && typeof location?.longitude !== 'undefined'
      ? `${location.latitude}, ${location.longitude}`
      : '');
  return `
    <article tabindex="0" class="report-item" data-id="${id}">
      <a class="report-item__link" href="#/reports/${id}">
        <img class="report-item__image" src="${imageUrl}" alt="${title || 'Gambar laporan'}">
        <div class="report-item__body">
          <div class="report-item__main">
            <h2 class="report-item__title">${title || '-'}</h2>
            <div class="report-item__more-info">
              <div class="report-item__createdat">Dibuat: ${new Date(createdAt).toLocaleString()}</div>
              <div class="report-item__location">Lokasi: ${placeName || '-'}</div>
              <div class="report-item__author">Pelapor: ${reporterName || 'Anonim'}</div>
            </div>
            <p class="report-item__description">${shortDesc}</p>
            <a class="report-item__read-more btn" href="#/reports/${id}">Lihat Detail</a>
          </div>
        </div>
      </a>
    </article>
  `;
}

export function generateReportsListEmptyTemplate() {
  return `
    <div class="reports-list__empty">
      <h2>Tidak ada laporan tersimpan</h2>
      <p>Belum ada laporan yang Anda simpan.</p>
    </div>
  `;
}

export function generateReportsListErrorTemplate(message = '') {
  return `
    <div class="reports-list__error">
      <h2>Gagal memuat daftar laporan</h2>
      <p>${message || 'Terjadi kesalahan.'}</p>
    </div>
  `;
}

export function generateStoriesListEmpty() {
  return `
    <div class="stories-empty">
      <h2>Tidak ada story</h2>
      <p>Belum ada story yang dapat ditampilkan.</p>
    </div>
  `;
}

export function generateStoryDetailTemplate({ name, description, photoUrl, createdAt, lat, lon }) {
  return `
    <section class="story-detail">
      <div class="story-detail__hero">
        <img src="${photoUrl}" alt="Foto story ${name}" class="story-detail__hero-image" />
        <h1 class="story-detail__title">${name}</h1>
        <div class="story-detail__time">${new Date(createdAt).toLocaleString()}</div>
      </div>
      <div class="story-detail__body container">
        <h2>Deskripsi</h2>
        <p>${description}</p>
        ${
          lat && lon
            ? `<h3>Lokasi</h3><div id="map" class="story-detail__map" style="height:300px"></div>`
            : ''
        }
      </div>
    </section>
  `;
}

export { generateLoader as generateLoaderTemplate };
