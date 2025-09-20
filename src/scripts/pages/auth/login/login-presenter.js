export default class LoginPresenter {
  #view;
  #model;
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.login({ email, password });
      if (!response.ok) {
        this.#view.loginFailed(response.message || 'Login gagal');
        return;
      }
      const loginResult = response.loginResult ?? response.data ?? response;
      this.#view.loginSuccessfully(response.message || 'success', loginResult);
    } catch (err) {
      this.#view.loginFailed(err?.message || 'Kesalahan jaringan');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
