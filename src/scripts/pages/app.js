import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateSubscribeButtonTemplate,
  generateUnauthenticatedNavigationListTemplate,
  generateUnsubscribeButtonTemplate,
} from '../templates';
import { isServiceWorkerAvailable, setupSkipToContent, transitionHelper } from '../utils/index';
import { getAccessToken, removeAccessToken } from '../utils/auth';
import { routes } from '../routes/routes';
import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from '../utils/notification-helper';
import { processOutbox } from '../utils/offline-sync';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#setupDrawer();
    window.addEventListener('online', async () => {
      try {
        const res = await processOutbox();
        if (res && res.processed > 0) {
          console.log('Processed outbox items:', res.processed);
        }
      } catch (e) {}
    });
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#drawerNavigation.children.namedItem('navlist-main');
    const navList = this.#drawerNavigation.children.namedItem('navlist');

    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML = generateAuthenticatedNavigationListTemplate();

    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', (event) => {
      event.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        removeAccessToken();
        location.hash = '/login';
      }
    });
  }

  async #setupPushNotification() {
    if (!isServiceWorkerAvailable()) return;
    const pushNotificationTools = document.getElementById('push-notification-tools');
    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushNotificationTools &&
        (pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate());
      document.getElementById('unsubscribe-button')?.addEventListener('click', () => {
        unsubscribe().finally(() => this.#setupPushNotification());
      });
      return;
    }

    pushNotificationTools && (pushNotificationTools.innerHTML = generateSubscribeButtonTemplate());
    document.getElementById('subscribe-button')?.addEventListener('click', () => {
      subscribe().finally(() => this.#setupPushNotification());
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];
    if (!route) {
      this.#content.innerHTML = '<section class="container"><h2>404 - Not Found</h2></section>';
      return;
    }
    const page = route();
    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        page.afterRender && page.afterRender();
      },
    });

    transition.ready.catch(() => {});
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();
      if (isServiceWorkerAvailable()) this.#setupPushNotification();
    });
  }
}
