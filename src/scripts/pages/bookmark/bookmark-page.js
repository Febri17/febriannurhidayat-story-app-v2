import BookmarkPresenter from './bookmark-presenter';
import Map from '../../utils/map';
import {
  generateLoaderAbsoluteTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
  generateReportItemTemplate,
} from '../../templates';

export default class BookmarkPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Story Tersimpan</h1>
        <div class="reports-list__container">
          <div id="reports-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({ view: this, model: null });
    await this.#presenter.initialGalleryAndMap();
  }

  populateBookmarkedReports(message, reports) {
    if (reports.length <= 0) {
      this.populateBookmarkedReportsListEmpty();
      return;
    }
    const html = reports.reduce(
      (acc, r) =>
        acc.concat(
          generateReportItemTemplate({
            ...r,
            placeNameLocation: r.location?.placeName,
            reporterName: r.reporterName,
          }),
        ),
      '',
    );
    document.getElementById('reports-list').innerHTML = `<div class="reports-list">${html}</div>`;
  }

  populateBookmarkedReportsListEmpty() {
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateBookmarkedReportsError(message) {
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }

  showReportsListLoading() {
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }
  hideReportsListLoading() {
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }

  async initialMap() {
    this.#map = await Map.build('#map', { zoom: 10, locate: true });
  }
  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }
  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }
}
