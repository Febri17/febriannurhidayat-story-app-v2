export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <h1 class="about-title">Tentang Aplikasi Story App</h1>

        <div class="about-content">
          <p>
            Story App adalah aplikasi contoh untuk submission mata kuliah Web Intermediate.
            Aplikasi ini memungkinkan pengguna membuat story bergambar disertai lokasi,
            melihat daftar story, serta membaca detailnya.
          </p>

          <h2>Fitur utama</h2>
          <ul>
            <li>Registrasi & login user</li>
            <li>Upload foto story (maks 1MB)</li>
            <li>Menampilkan stories pengguna dan detailnya</li>
            <li>Peta interaktif untuk memilih lokasi (Leaflet)</li>
          </ul>

          <h2>Cara penggunaan singkat</h2>
          <ol>
            <li>Daftar akun terlebih dahulu melalui menu Register.</li>
            <li>Masuk dengan akun Anda melalui menu Login.</li>
            <li>Pada halaman utama, klik Buat Story untuk menambahkan postingan baru.</li>
          </ol>

          <p class="about-note">Catatan: Beberapa fitur (mis. push notification) memerlukan konfigurasi khusus di environment.</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // nothing
  }
}
