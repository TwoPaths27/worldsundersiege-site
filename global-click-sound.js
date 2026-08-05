(() => {
  const SOUND_PATH = "sounds/mouse-click.mp3";
  const CLICK_VOLUME = 0.45;

  let audioContext = null;
  let audioBuffer = null;
  let htmlAudioFallback = null;
  let loadingPromise = null;
  let unlocked = false;

  function isValidClick(event) {
    if (event.defaultPrevented) return false;
    if (event.button !== undefined && event.button !== 0) return false;

    const target = event.target;
    if (!(target instanceof Element)) return false;

    return Boolean(
      target.closest(
        [
          "button",
          "a[href]",
          "input[type='button']",
          "input[type='submit']",
          "input[type='checkbox']",
          "input[type='radio']",
          "select",
          "summary",
          "[role='button']",
          "[tabindex]:not([tabindex='-1'])",
          ".card",
          ".pack-card",
          ".summary-card",
          ".starter-reveal-card",
          ".starter-deck-product",
          ".portrait-choice",
          ".news-dot"
        ].join(",")
      )
    );
  }

  async function createAudioContext() {
    if (audioContext) return audioContext;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    audioContext = new AudioContextClass();
    return audioContext;
  }

  async function loadClickBuffer() {
    if (audioBuffer) return audioBuffer;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      try {
        const context = await createAudioContext();
        if (!context) return null;

        const response = await fetch(SOUND_PATH, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Click sound returned HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
        return audioBuffer;
      } catch (error) {
        console.warn("Could not preload mouse-click.mp3:", error);
        return null;
      }
    })();

    return loadingPromise;
  }

  function getFallbackAudio() {
    if (!htmlAudioFallback) {
      htmlAudioFallback = new Audio(SOUND_PATH);
      htmlAudioFallback.preload = "auto";
      htmlAudioFallback.volume = CLICK_VOLUME;
    }

    return htmlAudioFallback;
  }

  async function unlockAudio() {
    try {
      const context = await createAudioContext();

      if (context?.state === "suspended") {
        await context.resume();
      }

      await loadClickBuffer();
      unlocked = true;
    } catch {
      unlocked = false;
    }
  }

  async function playWithWebAudio() {
    const context = await createAudioContext();
    const buffer = await loadClickBuffer();

    if (!context || !buffer) return false;

    if (context.state === "suspended") {
      await context.resume();
    }

    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = buffer;
    gain.gain.value = CLICK_VOLUME;

    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);

    return true;
  }

  async function playFallback() {
    const audio = getFallbackAudio();

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = CLICK_VOLUME;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  async function playClickSound() {
    try {
      if (await playWithWebAudio()) return;
    } catch {}

    await playFallback();
  }

  document.addEventListener(
    "pointerdown",
    async event => {
      if (!unlocked) {
        await unlockAudio();
      }

      if (!isValidClick(event)) return;
      playClickSound();
    },
    { capture: true }
  );

  document.addEventListener(
    "keydown",
    async event => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const active = document.activeElement;
      if (!(active instanceof Element)) return;

      if (!isValidClick({
        target: active,
        defaultPrevented: false,
        button: 0
      })) {
        return;
      }

      if (!unlocked) {
        await unlockAudio();
      }

      playClickSound();
    },
    { capture: true }
  );

  window.addEventListener("pageshow", () => {
    loadClickBuffer();
  });
})();
