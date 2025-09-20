import LoginPresenter from './login-presenter';
import * as AuthModel from '../../../data/api';
import { putAccessToken } from '../../../utils/auth';

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
      <section class="login-container container">
        <article class="login-form-container">
          <h1 class="login__title">Masuk akun</h1>
          <form id="login-form" class="login-form" aria-label="Form login">
            <div class="form-control">
              <label for="email-input">Email</label>
              <input id="email-input" type="email" required placeholder="nama@email.com">
            </div>
            <div class="form-control">
              <label for="password-input">Password</label>
              <input id="password-input" type="password" required placeholder="password">
            </div>
            <div class="form-buttons">
              <div id="submit-button-container"><button class="btn" type="submit">Masuk</button></div>
              <p>Belum punya akun? <a href="#/register">Daftar</a></p>
            </div>
          </form>
        </article>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({ view: this, model: AuthModel });
    this._setupForm();
  }

  _setupForm() {
    document.getElementById('login-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = {
        email: document.getElementById('email-input').value,
        password: document.getElementById('password-input').value,
      };
      await this.#presenter.getLogin(data);
    });
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="button" disabled><i class="fas fa-spinner loader-button"></i> Masuk...</button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML =
      `<button class="btn" type="submit">Masuk</button>`;
  }

  loginSuccessfully(message, loginResult) {
    const token = loginResult?.token ?? loginResult?.accessToken;
    if (token) putAccessToken(token);
    alert(message || 'Login berhasil');
    location.hash = '/';
  }

  loginFailed(message) {
    alert(message || 'Login gagal');
  }
}
