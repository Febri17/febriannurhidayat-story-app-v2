export default class Camera {
  #currentStream = null;
  #videoElement = null;
  constructor({ video }) {
    this.#videoElement = video;
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.#currentStream = stream;
      if (this.#videoElement) {
        this.#videoElement.srcObject = stream;
        await this.#videoElement.play().catch(() => {});
      }
      // global tracking
      if (!Array.isArray(window.currentStreams)) window.currentStreams = [];
      window.currentStreams.push(stream);
    } catch (e) {
      console.error('Camera start error', e);
      throw e;
    }
  }

  stop() {
    try {
      if (this.#currentStream) {
        this.#currentStream.getTracks().forEach((t) => t.stop());
        this.#currentStream = null;
      }
      if (this.#videoElement) {
        this.#videoElement.pause();
        this.#videoElement.srcObject = null;
      }
    } catch (e) {}
  }

  static stopAllStreams() {
    if (!Array.isArray(window.currentStreams)) return;
    window.currentStreams.forEach((s) => {
      try {
        s.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    });
    window.currentStreams = [];
  }

  async takePicture() {
    if (!this.#videoElement) return null;
    const width = this.#videoElement.videoWidth || 640;
    const height = this.#videoElement.videoHeight || Math.round((width * 3) / 4);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.#videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });
  }
}
