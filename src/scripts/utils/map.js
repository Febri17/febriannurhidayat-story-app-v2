import { map, tileLayer, Icon, icon, marker, popup, latLng } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import CONFIG from '../config';

export default class Map {
  #zoom = 13;
  #map = null;

  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }

  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  static async getPlaceNameByCoordinate(latitude, longitude) {
    try {
      const url = new URL(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json`);
      url.searchParams.set('key', CONFIG.MAP_SERVICE_API_KEY);
      url.searchParams.set('language', 'id');
      url.searchParams.set('limit', '1');
      const res = await fetch(url.toString());
      const json = await res.json();
      const place = json.features[0].place_name.split(', ');
      return [place.at(-2), place.at(-1)].map((n) => n).join(', ');
    } catch (e) {
      return `${latitude}, ${longitude}`;
    }
  }

  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }

    const defaultCenter = [-6.2, 106.816666];

    if (options.locate) {
      try {
        const pos = await Map.getCurrentPosition();
        const coord = [pos.coords.latitude, pos.coords.longitude];
        return new Map(selector, { ...options, center: coord });
      } catch {
        return new Map(selector, { ...options, center: defaultCenter });
      }
    }
    return new Map(selector, { ...options, center: defaultCenter });
  }

  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;
    const tileOsm = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    });
    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      scrollWheelZoom: false,
      layers: [tileOsm],
      ...options,
    });
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(latLng(coordinate), zoomLevel);
  }

  getCenter() {
    const { lat, lng } = this.#map.getCenter();
    return { latitude: lat, longitude: lng };
  }

  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });
    if (popupOptions && popupOptions.content) {
      newMarker.bindPopup(popupOptions.content);
    }
    newMarker.addTo(this.#map);
    return newMarker;
  }

  addMapEventListener(eventName, callback) {
    this.#map.addEventListener(eventName, callback);
  }
}
