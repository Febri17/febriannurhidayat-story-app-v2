export default class RegisterPresenter {
  #view;
  #model;
  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.register({ name, email, password });
      if (!response.ok) {
        this.#view.registeredFailed(response.message || 'Register gagal');
        return;
      }
      this.#view.registeredSuccessfully(response.message || 'User Created');
    } catch (err) {
      this.#view.registeredFailed(err?.message || 'Kesalahan jaringan');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
