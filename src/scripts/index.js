// src/scripts/index.js
// Styles
import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';

// Utilities
import { setupSkipToContent, transitionHelper } from './utils/index';
import { getAccessToken, removeAccessToken } from './utils/auth';
import Camera from './utils/camera';

// Routes
import { routes } from './routes/routes';
import { getActiveRoute, parseActivePathname } from './routes/url-parser';

// Elements
const content = document.querySelector('#main-content');
const drawerButton = document.querySelector('#drawer-button');
const navigationDrawer = document.querySelector('#navigation-drawer');
const navList = document.getElementById('nav-list');
const skipLink = document.getElementById('skip-link');
const installContainer = document.getElementById('install-container');

let deferredInstallPrompt = null;

let swRegistered = false;

function setupDrawer() {
  if (!drawerButton || !navigationDrawer) return;

  drawerButton.addEventListener('click', () => {
    const expanded = drawerButton.getAttribute('aria-expanded') === 'true';
    drawerButton.setAttribute('aria-expanded', String(!expanded));
    navigationDrawer.classList.toggle('open');
  });

  document.body.addEventListener('click', (event) => {
    if (!navigationDrawer.contains(event.target) && !drawerButton.contains(event.target)) {
      navigationDrawer.classList.remove('open');
      drawerButton.setAttribute('aria-expanded', 'false');
    }
    navigationDrawer.querySelectorAll('a, button').forEach((link) => {
      if (link.contains(event.target)) navigationDrawer.classList.remove('open');
    });
  });
}

function renderNav() {
  const token = getAccessToken();
  const isLogin = !!token;
  const items = [];

  items.push(`<li role="none"><a role="menuitem" href="#/">Beranda</a></li>`);
  items.push(`<li role="none"><a role="menuitem" href="#/about">About</a></li>`);

  if (isLogin) {
    items.push(`<li role="none"><a role="menuitem" href="#/new">Buat Story</a></li>`);
    items.push(
      `<li role="none"><button id="logout-button" class="btn" type="button">Logout</button></li>`,
    );
  } else {
    items.push(`<li role="none"><a role="menuitem" href="#/login">Login</a></li>`);
    items.push(`<li role="none"><a role="menuitem" href="#/register">Register</a></li>`);
  }

  items.push(`<li role="none" id="push-controls"></li>`);

  if (navList) navList.innerHTML = items.join('');

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      if (confirm('Keluar dari akun?')) {
        removeAccessToken();
        renderNav();
        location.hash = '/login';
      }
    });
  }
}

function ensureInstallButton() {
  let btn = document.getElementById('pwa-install-button');
  if (btn) return btn;

  if (installContainer) {
    installContainer.innerHTML = `<button id="pwa-install-button" class="btn btn-outline" hidden>Install App</button>`;
    btn = document.getElementById('pwa-install-button');
    return btn;
  }

  return null;
}

function showInstallButton() {
  const btn = ensureInstallButton();
  if (!btn) return null;
  btn.hidden = false;
  return btn;
}

function hideInstallButton() {
  const btn = document.getElementById('pwa-install-button');
  if (btn) btn.hidden = true;
}

function handleBeforeInstallPromptEvent(e) {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = showInstallButton();
  if (!btn) return;

  const onClick = async () => {
    if (!deferredInstallPrompt) return;
    btn.disabled = true;
    try {
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;
      console.log('beforeinstallprompt: userChoice', result);
    } catch (err) {
      console.warn('beforeinstallprompt prompt error', err);
    } finally {
      // Cleanup
      deferredInstallPrompt = null;
      hideInstallButton();
      btn.disabled = false;
      btn.removeEventListener('click', onClick);
    }
  };

  btn.addEventListener('click', onClick, { once: true });
}

function setupPWAInstallListeners() {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPromptEvent);

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    hideInstallButton();
    deferredInstallPrompt = null;
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker unsupported');
    return null;
  }

  if (swRegistered) {
    return null;
  }

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const found = regs.find(
      (r) => r && r.active && r.scriptURL && r.scriptURL.includes('/sw.bundle.js'),
    );
    if (found) {
      console.log('Service worker already registered (existing):', found);
      swRegistered = true;
      return found;
    }

    const reg = await navigator.serviceWorker.register('/sw.bundle.js', { scope: '/' });
    console.log('Service Worker registered:', reg);
    swRegistered = true;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('controllerchange: new service worker in control — reloading once');
      setTimeout(() => {
        try {
          window.location.reload();
        } catch (e) {
          console.warn('reload failed after controllerchange', e);
        }
      }, 200);
    });

    return reg;
  } catch (err) {
    console.error('SW register failed', err);
    return null;
  }
}

const PUBLIC_ROUTES = ['/login', '/register', '/about'];

async function renderPage() {
  const url = getActiveRoute();
  const parse = parseActivePathname();
  const token = getAccessToken();
  const isLogin = !!token;

  if (!isLogin && !PUBLIC_ROUTES.includes(url)) {
    if (location.hash !== '#/login') {
      location.hash = '/login';
      return;
    }
  }

  if (isLogin && (url === '/login' || url === '/register')) {
    if (location.hash !== '#/') {
      location.hash = '/';
      return;
    }
  }

  const routeEntry = routes[url];

  if (!routeEntry) {
    content.innerHTML = '<section class="container"><h2>404 - Not Found</h2></section>';
    return;
  }

  let pageInstance = null;
  try {
    if (typeof routeEntry === 'function') {
      const id = parse?.id;
      pageInstance = id ? routeEntry(id) : routeEntry();
    } else if (routeEntry && typeof routeEntry.factory === 'function') {
      const id = parse?.id;
      pageInstance = id ? routeEntry.factory(id) : routeEntry.factory();
    } else {
      throw new Error('Route factory not available');
    }
  } catch (err) {
    console.error('create page instance failed', err);
    content.innerHTML =
      '<section class="container"><h2>500 - Internal</h2><p>Gagal membuat halaman.</p></section>';
    return;
  }

  if (!pageInstance || typeof pageInstance.render !== 'function') {
    content.innerHTML = '<section class="container"><h2>404 - Not Found</h2></section>';
    return;
  }

  const transition = transitionHelper({
    updateDOM: async () => {
      content.innerHTML = await pageInstance.render();
      if (typeof pageInstance.afterRender === 'function') await pageInstance.afterRender();
    },
  });

  transition.ready?.catch(() => {});
  transition.updateCallbackDone.then(() => {
    content.querySelector('[tabindex="-1"]')?.focus?.();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupDrawer();
  renderNav();
  setupSkipToContent(skipLink, content);
  await renderPage();

  if ('serviceWorker' in navigator) {
    registerServiceWorker().catch((e) => {
      console.error('registerServiceWorker error', e);
    });
  }

  setupPWAInstallListeners();

  window.addEventListener('hashchange', async () => {
    Camera.stopAllStreams();
    renderNav();
    await renderPage();
  });

  window.addEventListener('beforeunload', () => {
    Camera.stopAllStreams();
  });
});
