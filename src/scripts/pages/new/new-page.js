import NewPresenter from './new-presenter';
import * as ApiModel from '../../data/api';
import Camera from '../../utils/camera';
import Map from '../../utils/map';
import { addOutboxItem } from '../../data/offline-db';
import { convertBlobToBase64 } from '../../utils/index';

export default class NewPage {
  #presenter = null;
  #form = null;
  #camera = null;
  #takenDocumentations = [];
  #map = null;

  async render() {
    return `
      <section class="new-report__header">
        <div class="container">
          <h1>Buat Story Baru</h1>
          <p>Unggah foto (maks 1MB) dan deskripsi.</p>
        </div>
      </section>

      <section class="container">
        <form id="new-form" class="new-form">
          <div class="form-control">
            <label for="description-input">Deskripsi</label>
            <textarea id="description-input"></textarea>
          </div>
          <div class="form-control">
            <label for="photo-input">Foto</label>
            <input id="photo-input" type="file" accept="image/*">
            <button id="open-documentations-camera-button" class="btn btn-outline" type="button">Buka Kamera</button>
            <div id="camera-container" hidden>
              <video id="camera-video" autoplay muted playsinline></video>
              <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
            </div>
            <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
          </div>
          <div class="form-control">
            <div id="map" class="new-form__location__map" style="height: 250px"></div>
            <input id="latitude-input" type="number" step="any" disabled placeholder="Latitude">
            <input id="longitude-input" type="number" step="any" disabled placeholder="Longitude">
          </div>
          <div id="submit-button-container"><button class="btn" type="submit">Kirim</button></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({ view: this, model: ApiModel });
    this.#takenDocumentations = [];
    this._setupForm();
    try {
      this.showMapLoading();
      this.#map = await Map.build('#map', { zoom: 14, locate: true });
      const center = this.#map.getCenter();
      this._updateLatLngInput(center.latitude, center.longitude);
      const draggableMarker = this.#map.addMarker([center.latitude, center.longitude], {
        draggable: true,
      });
      draggableMarker.addEventListener('move', (ev) => {
        const c = ev.target.getLatLng();
        this._updateLatLngInput(c.lat, c.lng);
      });
      this.#map.addMapEventListener('click', (ev) => {
        draggableMarker.setLatLng(ev.latlng);
        if (this.#map.changeCamera) this.#map.changeCamera([ev.latlng.lat, ev.latlng.lng]);
      });
    } catch (err) {
      console.warn('initialMap failed', err);
    } finally {
      this.hideMapLoading();
    }
  }

  _setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const description = document.getElementById('description-input').value.trim();
      const files = this.#takenDocumentations.map((p) => p.blob);
      const latVal = document.getElementById('latitude-input').value;
      const lonVal = document.getElementById('longitude-input').value;
      if (!description) {
        alert('Deskripsi wajib diisi');
        return;
      }
      if (!files.length) {
        alert('Tambahkan minimal 1 foto');
        return;
      }
      const payload = {
        description,
        photo: files[0],
        lat: latVal ? parseFloat(latVal) : undefined,
        lon: lonVal ? parseFloat(lonVal) : undefined,
      };
      this.showSubmitLoadingButton();
      try {
        const resp = await this.#presenter.postNewStory(payload);
        // network offline → presenter returns { queued:true } or throws
        if (resp && resp.queued) {
          alert('Anda offline. Story dimasukkan ke antrean dan akan disinkronkan saat online.');
          this.storeSuccessfully('Story ditampung untuk sinkronisasi');
          return;
        }
        const ok = resp && (resp.ok === true || resp.error === false);
        if (ok) this.storeSuccessfully(resp.message || 'Story berhasil dibuat');
        else this.storeFailed(resp?.message || 'Gagal menyimpan story');
      } catch (err) {
        console.error('submit error', err);
        this.storeFailed(err?.message || 'Terjadi kesalahan');
      } finally {
        this.hideSubmitLoadingButton();
      }
    });

    document.getElementById('photo-input').addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (file.size > 1 * 1024 * 1024) {
        alert('File maksimal 1MB');
        return;
      }
      await this._addTakenPicture(file);
      await this._populateTakenPictures();
    });

    const toggleBtn = document.getElementById('open-documentations-camera-button');
    toggleBtn.addEventListener('click', async () => {
      const cameraContainer = document.getElementById('camera-container');
      if (cameraContainer.hasAttribute('hidden')) {
        cameraContainer.removeAttribute('hidden');
        await this._openCameraFlow();
      } else {
        cameraContainer.setAttribute('hidden', '');
        await this._closeCameraFlow();
      }
    });

    document.getElementById('camera-take-button').addEventListener('click', async () => {
      try {
        if (!this.#camera)
          this.#camera = new Camera({ video: document.getElementById('camera-video') });
        const blob = await this.#camera.takePicture();
        if (blob && blob.size <= 1 * 1024 * 1024) {
          await this._addTakenPicture(blob);
          await this._populateTakenPictures();
        } else {
          alert('Gagal mengambil gambar atau ukuran lebih dari 1MB');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal akses kamera');
      }
    });
  }

  async _openCameraFlow() {
    if (!this.#camera)
      this.#camera = new Camera({ video: document.getElementById('camera-video') });
    try {
      await this.#camera.start();
    } catch (err) {
      console.error('camera open', err);
      alert('Gagal akses kamera');
    }
  }
  async _closeCameraFlow() {
    try {
      this.#camera?.stop();
      Camera.stopAllStreams?.();
    } catch (e) {}
  }

  async _addTakenPicture(blob) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.#takenDocumentations = [...this.#takenDocumentations, { id, blob }];
  }

  async _populateTakenPictures() {
    const listEl = document.getElementById('documentations-taken-list');
    if (!listEl) return;
    const html = this.#takenDocumentations
      .map((p, i) => {
        const url = URL.createObjectURL(p.blob);
        return `<li><button type="button" data-id="${p.id}" class="new-form__documentations__outputs-item__delete-btn"><img src="${url}" alt="doc ${i + 1}"></button></li>`;
      })
      .join('');
    listEl.innerHTML = html;
    listEl.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        const id = ev.currentTarget.dataset.id;
        this._removePicture(id);
        this._populateTakenPictures();
      });
    });
  }

  _removePicture(id) {
    this.#takenDocumentations = this.#takenDocumentations.filter((p) => p.id !== id);
  }

  _updateLatLngInput(lat, lng) {
    const li = document.getElementById('latitude-input');
    const lo = document.getElementById('longitude-input');
    if (li) li.value = typeof lat !== 'undefined' ? lat : '';
    if (lo) lo.value = typeof lng !== 'undefined' ? lng : '';
  }

  storeSuccessfully(message) {
    alert(message || 'Story berhasil dibuat');
    this.clearForm();
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message || 'Gagal menyimpan story');
  }

  clearForm() {
    this.#form.reset();
    this.#takenDocumentations = [];
    this._populateTakenPictures();
  }

  showMapLoading() {
    const el = document.getElementById('map-loading-container');
    if (el) el.innerHTML = '<div class="loader loader-absolute"></div>';
  }
  hideMapLoading() {
    const el = document.getElementById('map-loading-container');
    if (el) el.innerHTML = '';
  }
  showSubmitLoadingButton() {
    const c = document.getElementById('submit-button-container');
    if (c) c.innerHTML = `<button class="btn" type="button" disabled>Loading...</button>`;
  }
  hideSubmitLoadingButton() {
    const c = document.getElementById('submit-button-container');
    if (c) c.innerHTML = `<button class="btn" type="submit">Kirim</button>`;
  }
}
