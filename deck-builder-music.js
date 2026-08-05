(() => {
  const MUSIC_PATH = "sounds/Deck-Builder.mp3";
  const ENABLED_KEY = "wus-menu-music-enabled";
  const VOLUME_KEY = "wus-menu-music-volume";
  const DEFAULT_VOLUME = 0.136;
  const DECK_BUILDER_VOLUME_MULTIPLIER = 0.68;

  const music = new Audio(MUSIC_PATH);
  music.loop = true;
  music.preload = "auto";

  function configuredVolume() {
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    if (Number.isFinite(stored)) {
      return Math.max(
        0,
        Math.min(1, (stored / 100) * DECK_BUILDER_VOLUME_MULTIPLIER)
      );
    }
    return DEFAULT_VOLUME;
  }

  function musicEnabled() {
    return localStorage.getItem(ENABLED_KEY) !== "false";
  }

  async function startMusic() {
    if (!musicEnabled()) return;
    music.volume = configuredVolume();

    try {
      await music.play();
      removeUnlockListeners();
    } catch {
      // Browsers may require one user interaction before audio starts.
    }
  }

  function removeUnlockListeners() {
    document.removeEventListener("pointerdown", startMusic, true);
    document.removeEventListener("keydown", startMusic, true);
  }

  window.addEventListener("wus-menu-volume-changed", event => {
    const value = Number(event.detail?.value);
    if (Number.isFinite(value)) {
      music.volume = Math.max(
        0,
        Math.min(1, (value / 100) * DECK_BUILDER_VOLUME_MULTIPLIER)
      );
    }
  });

  window.addEventListener("storage", event => {
    if (event.key === VOLUME_KEY) {
      music.volume = configuredVolume();
    }

    if (event.key === ENABLED_KEY) {
      if (musicEnabled()) startMusic();
      else music.pause();
    }
  });

  window.addEventListener("pagehide", () => {
    music.pause();
    music.currentTime = 0;
  });

  document.addEventListener("pointerdown", startMusic, true);
  document.addEventListener("keydown", startMusic, true);
  startMusic();
})();
