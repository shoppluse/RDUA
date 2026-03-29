const SoundManager = {
  enabled: true,

  setEnabled(value) {
    this.enabled = value;
  },

  beep(freq = 440, duration = 0.05) {
    if (!this.enabled) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.03;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (error) {
      // silently ignore if browser blocks audio context
    }
  }
};
