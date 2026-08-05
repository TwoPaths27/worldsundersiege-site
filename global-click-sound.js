(() => {
  const SOUND_PATH = "sounds/mouse-click.mp3";
  const SOUND_EFFECTS_VOLUME_KEY = "wus-sfx-volume";

  function getClickVolume() {
    const stored = Number(localStorage.getItem(SOUND_EFFECTS_VOLUME_KEY));
    const percent = Number.isFinite(stored)
      ? Math.max(0, Math.min(100, stored))
      : 100;

    return percent / 100;
  }

  let audioContext = null;
  let audioBuffer = null;
  let htmlAudioFallback = null;
  let loadingPromise = null;
  let unlocked = false;

  if (localStorage.getItem(SOUND_EFFECTS_VOLUME_KEY) === null) {
    localStorage.setItem(SOUND_EFFECTS_VOLUME_KEY, "100");
  }

  function isValidClick(event) {
    if (event.defaultPrevented) return false;
    if (event.button !== undefined && event.button !== 0) return false;

    const target = event.target;
    if (!(target instanceof Element)) return false;

    // These controls already use dedicated pack-opening/card-reveal sounds.
    if (
      target.closest(
        [
          "#beginButton",
          "#openPackButton",
          "#openBoxButton",
          "#openNextPackButton",
          "#revealAllButton",
          "#starterRevealAllButton",
          ".pack-card",
          ".starter-reveal-card",
          ".box-pack",
          ".pack-wrapper",
          ".booster-pack",
          "[data-pack-index]",
          "[data-card-index]"
        ].join(",")
      )
    ) {
      return false;
    }

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
          ".summary-card",
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
      htmlAudioFallback.volume = getClickVolume();
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
    gain.gain.value = getClickVolume();

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
      audio.volume = getClickVolume();
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
