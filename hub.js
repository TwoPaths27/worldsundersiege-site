import { supabase } from "./supabase-config.js";
import { getSession, getProfile } from "./auth-common.js";

const DEVELOPER_EMAILS = new Set(['worldsundersiege@gmail.com']);

const newsArticles = [
  {
    category: "Website Update",
    title: "The official homepage is here",
    summary: "The Worlds Under Siege website now includes its account system and the beginnings of a dedicated logged-in game hub."
  },
  {
    category: "Card Database",
    title: "Lore expansion underway",
    summary: "Encyclopedia-style histories and legends continue to be added throughout the Battle of Ages card set."
  },
  {
    category: "Development Roadmap",
    title: "Deck Builder and Open Packs continue to grow",
    summary: "Deck construction, card purchasing, pack-opening effects, mobile layouts, and collection tools are actively being developed."
  },
  {
    category: "Player Accounts",
    title: "Cloud profiles are being introduced",
    summary: "Player accounts will eventually keep Gold, collections, decks, onboarding progress, and profile portraits available across devices."
  },
  {
    category: "Online Play",
    title: "The battlefield is taking shape",
    summary: "Public matchmaking, private games, and campaign battles will launch from the Play menu as each mode becomes ready."
  }
];

const elements = {
  username: document.getElementById("playerUsername"),
  gold: document.getElementById("playerGold"),
  portrait: document.getElementById("profilePortrait"),
  modalPortrait: document.getElementById("profileModalPortrait"),
  modalUsername: document.getElementById("profileModalUsername"),
  profileButton: document.getElementById("profileButton"),
  settingsButton: document.getElementById("settingsButton"),
  logoutButton: document.getElementById("logoutButton"),
  playButton: document.getElementById("playMenuButton"),
  playDrawer: document.getElementById("playDrawer"),
  playDrawerBackdrop: document.getElementById("playDrawerBackdrop"),
  closePlayDrawer: document.getElementById("closePlayDrawer"),
  profileModal: document.getElementById("profileModal"),
  settingsModal: document.getElementById("settingsModal"),
  musicEnabled: document.getElementById("musicEnabled"),
  musicVolume: document.getElementById("musicVolume"),
  musicVolumeValue: document.getElementById("musicVolumeValue"),
  newsCategory: document.getElementById("newsCategory"),
  newsTitle: document.getElementById("newsTitle"),
  newsSummary: document.getElementById("newsSummary"),
  developerPanel: document.getElementById("developerPanel"),
  newsDots: document.getElementById("newsDots"),
  previousNews: document.getElementById("previousNews"),
  nextNews: document.getElementById("nextNews")
};

let newsIndex = 0;
let newsTimer = null;

const MENU_MUSIC_ENABLED_KEY = "wus-menu-music-enabled";
const MENU_MUSIC_VOLUME_KEY = "wus-menu-music-volume";
const DEFAULT_MUSIC_VOLUME = 0.22;

const menuMusic = new Audio("sounds/menu.mp3");
menuMusic.loop = true;
menuMusic.preload = "auto";
menuMusic.volume = 0;

let musicFadeFrame = null;
let musicStarted = false;

initialize();

async function initialize() {
  await loadPlayer();
  loadGold();
  initializeMenuMusic();
  buildNewsDots();
  showNews(0);
  startNewsRotation();
  bindEvents();
}

async function loadPlayer() {
  try {
    const session = await getSession();
    if (!session) return;

    const profile = await getProfile(session.user.id);
    const username = profile?.username || session.user.email || "Player";

    const isDeveloper = DEVELOPER_EMAILS.has(
      String(session.user.email || "").toLowerCase()
    );
    if (elements.developerPanel) {
      elements.developerPanel.hidden = !isDeveloper;
    }
    elements.username.textContent = username;
    elements.modalUsername.textContent = username;

    // Phase 1 uses the logo as a temporary portrait.
    // A card-tile path will replace this after cloud collections are connected.
    const storedPortrait = localStorage.getItem("wus-selected-profile-portrait");
    if (storedPortrait) {
      elements.portrait.src = storedPortrait;
      elements.modalPortrait.src = storedPortrait;
    }
  } catch (error) {
    console.error("Could not load the player profile:", error);
    elements.username.textContent = "Player";
    elements.modalUsername.textContent = "Player";
  }
}

function loadGold() {
  const update = () => {
    const gold = window.WUSCollection?.load?.().gold ?? 0;
    elements.gold.textContent = Number(gold).toLocaleString();
  };

  update();
  window.addEventListener("wus-player-data-changed", update);
  window.addEventListener("storage", update);
}

function bindEvents() {
  elements.playButton.addEventListener("click", openPlayDrawer);
  elements.closePlayDrawer.addEventListener("click", closePlayDrawer);
  elements.playDrawerBackdrop.addEventListener("click", closePlayDrawer);

  elements.profileButton.addEventListener("click", () => openModal(elements.profileModal));
  elements.settingsButton.addEventListener("click", () => openModal(elements.settingsModal));

  elements.musicEnabled.addEventListener("change", () => {
    localStorage.setItem(MENU_MUSIC_ENABLED_KEY, String(elements.musicEnabled.checked));

    if (elements.musicEnabled.checked) {
      startMenuMusic();
    } else {
      fadeMenuMusicTo(0, 500, () => menuMusic.pause());
    }
  });

  elements.musicVolume.addEventListener("input", () => {
    const value = Number(elements.musicVolume.value);
    localStorage.setItem(MENU_MUSIC_VOLUME_KEY, String(value));
    elements.musicVolumeValue.textContent = `${value}%`;

    if (elements.musicEnabled.checked && !menuMusic.paused) {
      fadeMenuMusicTo(value / 100, 120);
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".hub-modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closePlayDrawer();
      closeAllModals();
    }
  });

  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener("click", event => {
      const href = link.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        link.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();

      let navigated = false;
      const navigate = () => {
        if (navigated) return;
        navigated = true;
        window.location.assign(href);
      };

      // The timeout guarantees navigation even if requestAnimationFrame is
      // suspended while restoring the page from browser history.
      window.setTimeout(navigate, 420);

      try {
        fadeMenuMusicTo(0, 280, navigate);
      } catch {
        navigate();
      }
    });
  });

  elements.logoutButton.addEventListener("click", async () => {
    elements.logoutButton.disabled = true;
    elements.logoutButton.textContent = "Logging Out…";
    await supabase.auth.signOut();
    window.location.replace("login.html");
  });

  elements.previousNews.addEventListener("click", () => showNews(newsIndex - 1));
  elements.nextNews.addEventListener("click", () => showNews(newsIndex + 1));

  const newsPanel = document.querySelector(".news-panel");
  newsPanel.addEventListener("mouseenter", stopNewsRotation);
  newsPanel.addEventListener("mouseleave", startNewsRotation);
  newsPanel.addEventListener("focusin", stopNewsRotation);
  newsPanel.addEventListener("focusout", startNewsRotation);
}

function initializeMenuMusic() {
  const storedEnabled = localStorage.getItem(MENU_MUSIC_ENABLED_KEY);
  const storedVolume = Number(localStorage.getItem(MENU_MUSIC_VOLUME_KEY));

  const enabled = storedEnabled === null ? true : storedEnabled === "true";
  const volumePercent = Number.isFinite(storedVolume) && storedVolume >= 0
    ? Math.min(100, storedVolume)
    : Math.round(DEFAULT_MUSIC_VOLUME * 100);

  elements.musicEnabled.checked = enabled;
  elements.musicVolume.value = String(volumePercent);
  elements.musicVolumeValue.textContent = `${volumePercent}%`;

  const attemptStart = () => {
    if (elements.musicEnabled.checked) startMenuMusic();
  };

  document.addEventListener("pointerdown", attemptStart, { once: true });
  document.addEventListener("keydown", attemptStart, { once: true });

  // Try immediately in case the browser allows playback because of an earlier interaction.
  attemptStart();

  window.addEventListener("pageshow", () => {
    document.body.classList.remove(
      "play-drawer-open",
      "modal-open",
      "starter-modal-open"
    );

    if (elements.playDrawer) {
      elements.playDrawer.classList.remove("open");
      elements.playDrawer.hidden = true;
    }

    if (elements.playDrawerBackdrop) {
      elements.playDrawerBackdrop.classList.remove("open");
      elements.playDrawerBackdrop.hidden = true;
    }

    document.querySelectorAll(".hub-modal").forEach(modal => {
      modal.hidden = true;
    });

    if (elements.playButton) {
      elements.playButton.setAttribute("aria-expanded", "false");
    }

    if (elements.musicEnabled.checked) startMenuMusic();
  });

  window.addEventListener("pagehide", () => {
    menuMusic.pause();
  });
}

function getTargetMusicVolume() {
  return Math.max(0, Math.min(1, Number(elements.musicVolume.value) / 100));
}

function startMenuMusic() {
  const targetVolume = getTargetMusicVolume();

  menuMusic.play()
    .then(() => {
      musicStarted = true;
      fadeMenuMusicTo(targetVolume, 1800);
    })
    .catch(() => {
      // Browser will allow playback after the next user gesture.
    });
}

function fadeMenuMusicTo(target, duration = 600, onComplete = null) {
  if (musicFadeFrame) {
    window.cancelAnimationFrame(musicFadeFrame);
    musicFadeFrame = null;
  }

  const startVolume = menuMusic.volume;
  const clampedTarget = Math.max(0, Math.min(1, target));
  const startTime = performance.now();

  const step = now => {
    const progress = duration <= 0 ? 1 : Math.min(1, (now - startTime) / duration);
    menuMusic.volume = Math.max(
      0,
      Math.min(
        1,
        startVolume + (clampedTarget - startVolume) * progress
      )
    );

    if (progress < 1) {
      musicFadeFrame = window.requestAnimationFrame(step);
    } else {
      musicFadeFrame = null;
      onComplete?.();
    }
  };

  musicFadeFrame = window.requestAnimationFrame(step);
}

function openPlayDrawer() {
  elements.playButton.setAttribute("aria-expanded", "true");
  elements.playDrawer.hidden = false;
  elements.playDrawerBackdrop.hidden = false;
  document.body.classList.add("play-drawer-open");
  window.requestAnimationFrame(() => {
    elements.playDrawer.classList.add("open");
    elements.playDrawerBackdrop.classList.add("open");
  });
  elements.closePlayDrawer.focus();
}

function closePlayDrawer() {
  if (!elements.playDrawer || elements.playDrawer.hidden) return;
  elements.playButton.setAttribute("aria-expanded", "false");
  elements.playDrawer.classList.remove("open");
  elements.playDrawerBackdrop.classList.remove("open");
  document.body.classList.remove("play-drawer-open");
  window.setTimeout(() => {
    elements.playDrawer.hidden = true;
    elements.playDrawerBackdrop.hidden = true;
  }, 220);
}

function openModal(modal) {
  closeAllModals();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modal.querySelector("button, a")?.focus();
}

function closeAllModals() {
  document.querySelectorAll(".hub-modal").forEach(modal => {
    modal.hidden = true;
  });
  document.body.style.overflow = "";
}

function buildNewsDots() {
  elements.newsDots.innerHTML = "";
  newsArticles.forEach((article, index) => {
    const button = document.createElement("button");
    button.className = "news-dot";
    button.type = "button";
    button.setAttribute("aria-label", `Show article ${index + 1}: ${article.title}`);
    button.addEventListener("click", () => showNews(index));
    elements.newsDots.appendChild(button);
  });
}

function showNews(index) {
  newsIndex = (index + newsArticles.length) % newsArticles.length;
  const article = newsArticles[newsIndex];

  elements.newsCategory.textContent = article.category;
  elements.newsTitle.textContent = article.title;
  elements.newsSummary.textContent = article.summary;

  [...elements.newsDots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === newsIndex);
    dot.setAttribute("aria-current", dotIndex === newsIndex ? "true" : "false");
  });
}

function startNewsRotation() {
  stopNewsRotation();
  newsTimer = window.setInterval(() => showNews(newsIndex + 1), 6500);
}

function stopNewsRotation() {
  if (newsTimer) window.clearInterval(newsTimer);
  newsTimer = null;
}
