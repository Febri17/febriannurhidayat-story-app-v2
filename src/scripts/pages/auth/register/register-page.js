import RegisterPresenter from './register-presenter';
import * as Api from '../../../data/api';

export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="register-container container">
        <div class="register-form-container">
          <h1>Daftar akun</h1>
          <form id="register-form" class="register-form" aria-label="Form register">
            <div class="form-control">
              <label for="name-input">Nama lengkap</label>
              <input id="name-input" type="text" required placeholder="Nama lengkap">
            </div>
            <div class="form-control">
              <label for="email-input">Email</label>
              <input id="email-input" type="email" required placeholder="email">
            </div>
            <div class="form-control">
              <label for="password-input">Password</label>
              <input id="password-input" type="password" required placeholder="min 8 karakter">
            </div>
            <div id="submit-button-container"><button class="btn" type="submit">Daftar</button></div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({ view: this, model: Api });
    this._setupForm();
  }

  _setupForm() {
    document.getElementById('register-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = {
        name: document.getElementById('name-input').value,
        email: document.getElementById('email-input').value,
        password: document.getElementById('password-input').value,
      };
      await this.#presenter.getRegistered(data);
    });
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML =
      `<button class="btn" type="button" disabled>Daftar...</button>`;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML =
      `<button class="btn" type="submit">Daftar</button>`;
  }

  registeredSuccessfully(message) {
    alert(message || 'Pendaftaran berhasil');
    location.hash = '/login';
  }

  registeredFailed(message) {
    alert(message || 'Pendaftaran gagal');
  }
}
