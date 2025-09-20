import StoryDetailPresenter from './story-detail-presenter';
import * as StoryModel from '../../data/api';
import Map from '../../utils/map';
import { parseActivePathname } from '../../routes/url-parser';
import { generateLoaderAbsoluteTemplate, generateReportDetailErrorTemplate } from '../../templates';

export default class StoryDetailPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div id="story-detail" class="story-detail container"></div>
        <div id="story-detail-loading-container"></div>
        <div id="map-loading-container"></div>
      </section>
    `;
  }

  async afterRender() {
    const id = parseActivePathname().id;
    this.#presenter = new StoryDetailPresenter(id, { view: this, model: StoryModel });
    await this.#presenter.showStoryDetail();
  }

  showReportDetailLoading() {
    document.getElementById('story-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }
  hideReportDetailLoading() {
    document.getElementById('story-detail-loading-container').innerHTML = '';
  }
  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }
  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  async initialMap() {
    this.#map = await Map.build('#map', { zoom: 15 });
  }

  async populateReportDetailAndInitialMap(message, report) {
    const container = document.getElementById('story-detail');
    container.innerHTML = `
      <div class="story-detail__hero">
        <img src="${report.photoUrl}" class="story-detail__hero-image" alt="${report.name}">
        <h1 class="story-detail__title">${report.name}</h1>
        <div class="story-detail__time">${new Date(report.createdAt).toLocaleString()}</div>
      </div>
      <div class="story-detail__body container">
        <h2>Deskripsi</h2>
        <p>${report.description || '-'}</p>
        ${report.lat && report.lon ? `<h3>Lokasi</h3><div id="map" style="height:300px"></div>` : ''}
      </div>
    `;
    if (report.lat && report.lon) {
      await this.#presenter.showStoryDetailMap();
      if (this.#map) {
        this.#map.changeCamera([report.lat, report.lon], 15);
        this.#map.addMarker(
          [report.lat, report.lon],
          { draggable: false },
          { content: report.name },
        );
      }
    }
  }

  populateReportDetailError(message) {
    document.getElementById('story-detail').innerHTML =
      `<div class="report-detail__error"><h2>Kesalahan</h2><p>${message || 'Gagal memuat detail story'}</p></div>`;
  }
}
