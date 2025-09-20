export function generateLoader() {
  return `<div class="loader" role="status" aria-live="polite"></div>`;
}

export function generateLoaderAbsoluteTemplate() {
  return `<div class="loader loader-absolute" aria-hidden="true"></div>`;
}

export function generateMainNavigationListTemplate() {
  return `
    <li><a href="#/">Beranda</a></li>
    <li><a href="#/new">Buat Story</a></li>
    <li><a href="#/bookmark">Tersimpan</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li><button id="logout-button" class="logout-button">Logout</button></li>
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li><a href="#/login">Login</a></li>
    <li><a href="#/register">Register</a></li>
  `;
}

export function generateSubscribeButtonTemplate() {
  return `<button id="subscribe-button" class="btn btn-outline">Berlangganan Notif</button>`;
}

export function generateUnsubscribeButtonTemplate() {
  return `<button id="unsubscribe-button" class="btn btn-outline">Berhenti Berlangganan</button>`;
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

export function generateBookmarkItemTemplate({ id, name, description, photoUrl, createdAt }) {
  const shortDesc = description
    ? description.length > 150
      ? description.slice(0, 147) + '...'
      : description
    : '';
  return `
    <article class="story-item story-item--bookmark" data-id="${id}">
      <a href="#/stories/${id}" class="story-link">
        <img class="story-item__image" src="${photoUrl}" alt="Foto story oleh ${name}">
      </a>
      <div class="story-item__body">
        <h2 class="story-item__title">${name}</h2>
        <div class="story-item__meta">${new Date(createdAt).toLocaleString()}</div>
        <p class="story-item__desc">${shortDesc}</p>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <a class="btn" href="#/stories/${id}">Lihat</a>
          <button class="btn btn-outline btn-bookmark-delete" data-bookmark-id="${id}" type="button">Hapus</button>
        </div>
      </div>
    </article>
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

export function generateBookmarksListEmpty() {
  return `
    <div class="stories-empty">
      <h2>Tidak ada story tersimpan</h2>
      <p>Gunakan tombol Simpan di halaman detail story untuk menyimpan story</p>
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
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom:12px;">
          <button id="bookmark-button" class="btn btn-outline" type="button">Simpan</button>
        </div>
        <h2>Deskripsi</h2>
        <p>${description}</p>
        ${lat && lon ? `<h3>Lokasi</h3><div id="map" class="story-detail__map" style="height:300px"></div>` : ''}
      </div>
    </section>
  `;
}
