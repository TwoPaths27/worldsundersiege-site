(() => {
  const SOUND_PATH = "sounds/mouse-click.mp3";
  const SFX_VOLUME_KEY = "wus-sfx-volume";

  // Open Packs has its own complete sound design. The generic UI click is
  // disabled for the entire page after navigating there.
  window.WUS_UI_CLICKS_ENABLED =
    window.WUS_UI_CLICKS_ENABLED !== false;

  const isOpenPacksPage =
    /(^|\/)open-packs\.html$/i.test(window.location.pathname) ||
    document.body?.classList.contains("open-packs-page");

  if (isOpenPacksPage) {
    window.WUS_UI_CLICKS_ENABLED = false;
    return;
  }

  let audioContext = null;
  let clickBuffer = null;
  let loadPromise = null;
  let fallbackAudio = null;

  function getVolume() {
    const stored = Number(localStorage.getItem(SFX_VOLUME_KEY));
    const percent = Number.isFinite(stored)
      ? Math.max(0, Math.min(100, stored))
      : 100;

    return percent / 100;
  }

  function isClickable(target) {
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
          ".portrait-choice",
          ".news-dot"
        ].join(",")
      )
    );
  }

  async function getContext() {
    if (audioContext) return audioContext;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    audioContext = new AudioContextClass();
    return audioContext;
  }

  async function loadBuffer() {
    if (clickBuffer) return clickBuffer;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        const context = await getContext();
        if (!context) return null;

        const response = await fetch(SOUND_PATH, { cache: "force-cache" });
        if (!response.ok) return null;

        const bytes = await response.arrayBuffer();
        clickBuffer = await context.decodeAudioData(bytes.slice(0));
        return clickBuffer;
      } catch {
        return null;
      }
    })();

    return loadPromise;
  }

  async function playClick() {
    if (window.WUS_UI_CLICKS_ENABLED === false) return;

    const volume = getVolume();
    if (volume <= 0) return;

    try {
      const context = await getContext();
      const buffer = await loadBuffer();

      if (context && buffer) {
        if (context.state === "suspended") {
          await context.resume();
        }

        const source = context.createBufferSource();
        const gain = context.createGain();

        source.buffer = buffer;
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        return;
      }
    } catch {}

    try {
      if (!fallbackAudio) {
        fallbackAudio = new Audio(SOUND_PATH);
        fallbackAudio.preload = "auto";
      }

      fallbackAudio.pause();
      fallbackAudio.currentTime = 0;
      fallbackAudio.volume = volume;
      await fallbackAudio.play();
    } catch {}
  }

  document.addEventListener(
    "pointerdown",
    event => {
      if (
        event.defaultPrevented ||
        (event.button !== undefined && event.button !== 0) ||
        !isClickable(event.target)
      ) {
        return;
      }

      playClick();
    },
    { capture: true }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        (event.key === "Enter" || event.key === " ") &&
        isClickable(document.activeElement)
      ) {
        playClick();
      }
    },
    { capture: true }
  );

  loadBuffer();
})();
