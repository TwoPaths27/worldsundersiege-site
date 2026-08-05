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
  profileGoldLabel: document.getElementById("profileGoldLabel"),
  portraitGrid: document.getElementById("portraitGrid"),
  portraitPickerStatus: document.getElementById("portraitPickerStatus"),
  portraitUnlockCount: document.getElementById("portraitUnlockCount"),
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
  soundEffectsVolume: document.getElementById("soundEffectsVolume"),
  soundEffectsVolumeValue: document.getElementById("soundEffectsVolumeValue"),
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

let currentSession = null;
let currentProfile = null;
let currentGold = 0;
let selectedPortraitCardId = null;
let unlockedPortraitCardIds = [];
let cloudProfileAvailable = false;

const MENU_MUSIC_ENABLED_KEY = "wus-menu-music-enabled";
const MENU_MUSIC_VOLUME_KEY = "wus-menu-music-volume";
const DEFAULT_MUSIC_VOLUME = 0.17;
const SOUND_EFFECTS_VOLUME_KEY = "wus-sfx-volume";

const menuMusic = new Audio("sounds/menu.mp3");
menuMusic.loop = true;
menuMusic.preload = "auto";
menuMusic.volume = 0;

let musicFadeFrame = null;
let musicStarted = false;

initialize();

async function initialize() {
  await loadPlayer();
  await loadGold();
  initializeMenuMusic();
  initializeSoundEffectsSettings();
  buildNewsDots();
  showNews(0);
  startNewsRotation();
  bindEvents();
}

async function loadPlayer() {
  try {
    currentSession = await getSession();
    if (!currentSession) return;

    currentProfile = await getProfile(currentSession.user.id);
    const username =
      currentProfile?.username ||
      currentSession.user.email ||
      "Player";

    const isDeveloper = DEVELOPER_EMAILS.has(
      String(currentSession.user.email || "").toLowerCase()
    );

    if (elements.developerPanel) {
      elements.developerPanel.hidden = !isDeveloper;
    }

    elements.username.textContent = username;
    elements.modalUsername.textContent = username;

    await loadCloudPortraits();
  } catch (error) {
    console.error("Could not load the player profile:", error);
    elements.username.textContent = "Player";
    elements.modalUsername.textContent = "Player";
    applyPortraitImage(elements.portrait, null);
    applyPortraitImage(elements.modalPortrait, null);
  }
}

async function loadCloudPortraits() {
  if (!currentSession) return;

  elements.portraitPickerStatus.hidden = false;
  elements.portraitPickerStatus.textContent = "Loading unlocked portraits…";
  elements.portraitGrid.hidden = true;

  try {
    const [profileResponse, unlockResponse, cardsResponse] = await Promise.all([
      supabase
        .from("profiles")
        .select("selected_portrait_card_id")
        .eq("user_id", currentSession.user.id)
        .single(),
      supabase
        .from("portrait_unlocks")
        .select("card_id")
        .eq("user_id", currentSession.user.id)
        .order("unlocked_at", { ascending: true }),
      supabase
        .from("player_cards")
        .select("card_id, quantity")
        .eq("user_id", currentSession.user.id)
        .gt("quantity", 0)
    ]);

    if (profileResponse.error) throw profileResponse.error;
    if (unlockResponse.error) throw unlockResponse.error;
    if (cardsResponse.error) throw cardsResponse.error;

    selectedPortraitCardId =
      profileResponse.data?.selected_portrait_card_id || null;

    const unlocked = new Set(
      (unlockResponse.data || []).map(row => row.card_id)
    );

    // Any currently owned card is also immediately usable as a portrait.
    (cardsResponse.data || []).forEach(row => unlocked.add(row.card_id));

    unlockedPortraitCardIds = [...unlocked];
    cloudProfileAvailable = true;

    const selectedCard = findCard(selectedPortraitCardId);
    applyPortraitImage(elements.portrait, selectedCard);
    applyPortraitImage(elements.modalPortrait, selectedCard);
    renderPortraitGrid();
  } catch (error) {
    console.warn("Cloud portraits are unavailable; using local portrait.", error);
    cloudProfileAvailable = false;

    const storedPath = localStorage.getItem("wus-selected-profile-portrait");
    if (storedPath) {
      elements.portrait.src = storedPath;
      elements.modalPortrait.src = storedPath;
    } else {
      applyPortraitImage(elements.portrait, null);
      applyPortraitImage(elements.modalPortrait, null);
    }

    const localUnlocks = readLocalPortraitUnlocks();
    unlockedPortraitCardIds = localUnlocks;
    renderPortraitGrid();
  }
}

async function loadGold() {
  const display = gold => {
    currentGold = Math.max(0, Number(gold) || 0);
    elements.gold.textContent = currentGold.toLocaleString();
    elements.profileGoldLabel.textContent =
      `${currentGold.toLocaleString()} Gold`;
  };

  try {
    if (!currentSession) currentSession = await getSession();

    if (currentSession) {
      const { data, error } = await supabase
        .from("player_wallets")
        .select("gold")
        .eq("user_id", currentSession.user.id)
        .single();

      if (!error && data) {
        display(data.gold);
        window.WUSCollection?.replaceFromCloud?.({
          gold: data.gold,
          cards: window.WUSCollection?.load?.().cards || {}
        });
      } else {
        display(window.WUSCollection?.load?.().gold ?? 0);
      }
    } else {
      display(window.WUSCollection?.load?.().gold ?? 0);
    }
  } catch (error) {
    console.warn("Could not load cloud Gold:", error);
    display(window.WUSCollection?.load?.().gold ?? 0);
  }

  window.addEventListener("wus-player-data-changed", () => {
    const localGold = window.WUSCollection?.load?.().gold;
    if (Number.isFinite(Number(localGold))) display(localGold);
  });

  window.addEventListener("wus-cloud-starter-changed", event => {
    if (event.detail && Number.isFinite(Number(event.detail.gold))) {
      display(event.detail.gold);
    } else {
      loadGold();
    }
  });

  window.addEventListener("storage", event => {
    if (!event.key || event.key.includes("player")) {
      const localGold = window.WUSCollection?.load?.().gold;
      if (Number.isFinite(Number(localGold))) display(localGold);
    }
  });
}

function bindEvents() {
  elements.playButton.addEventListener("click", openPlayDrawer);
  elements.closePlayDrawer.addEventListener("click", closePlayDrawer);
  elements.playDrawerBackdrop.addEventListener("click", closePlayDrawer);

  elements.profileButton.addEventListener("click", async () => {
    openModal(elements.profileModal);
    await loadCloudPortraits();
    await loadGold();
  });
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
    const value = Math.max(
      0,
      Math.min(100, Number(elements.musicVolume.value) || 0)
    );
    localStorage.setItem(MENU_MUSIC_VOLUME_KEY, String(value));
    elements.musicVolumeValue.textContent = `${value}%`;

    if (elements.musicEnabled.checked && !menuMusic.paused) {
      fadeMenuMusicTo(value / 100, 120);
    }
  });

  elements.soundEffectsVolume.addEventListener("input", () => {
    const value = Math.max(
      0,
      Math.min(100, Number(elements.soundEffectsVolume.value) || 0)
    );

    localStorage.setItem(SOUND_EFFECTS_VOLUME_KEY, String(value));
    elements.soundEffectsVolumeValue.textContent = `${value}%`;

    window.dispatchEvent(new CustomEvent("wus-sfx-volume-changed", {
      detail: { value }
    }));
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
      if (!href || href.startsWith("#") || link.target === "_blank") return;

      event.preventDefault();
      fadeMenuMusicTo(0, 350, () => {
        window.location.href = href;
      });
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

function getCardDatabase() {
  return Array.isArray(window.cards)
    ? window.cards
    : (typeof cards !== "undefined" && Array.isArray(cards) ? cards : []);
}

function findCard(cardId) {
  if (!cardId) return null;
  return getCardDatabase().find(card => card.id === cardId) || null;
}

function readLocalPortraitUnlocks() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("wus-unlocked-profile-portraits-v1") || "[]"
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function portraitCandidates(card) {
  if (!card) return ["logo.png"];

  const manifest = new Set(window.WUSTileManifest || []);
  const explicitCommanderTiles = {
    "SD1-001": "BOA-226 King Arthur.jpg",
    "SD1-002": "BOA-227 Dracula.jpg"
  };

  const exactCandidates = [
    explicitCommanderTiles[card.id],
    `${card.id} ${card.name}.jpg`,
    `${card.id} ${card.name}.png`
  ].filter(Boolean);

  const existingTile = exactCandidates.find(file => manifest.has(file));

  return [
    ...(existingTile ? [`tile/${encodeURIComponent(existingTile)}`] : []),
    card.image,
    "logo.png"
  ];
}

function applyPortraitImage(image, card) {
  const candidates = portraitCandidates(card);
  let candidateIndex = 0;

  image.onerror = () => {
    candidateIndex += 1;
    if (candidateIndex < candidates.length) {
      image.src = candidates[candidateIndex];
    } else {
      image.onerror = null;
      image.src = "logo.png";
    }
  };

  image.src = candidates[0];
  image.alt = card ? `${card.name} profile portrait` : "Default profile portrait";
}

function renderPortraitGrid() {
  const cardsById = new Map(
    getCardDatabase().map(card => [card.id, card])
  );

  const availableCards = unlockedPortraitCardIds
    .map(cardId => cardsById.get(cardId))
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));

  elements.portraitUnlockCount.textContent =
    `${availableCards.length.toLocaleString()} unlocked`;

  if (!availableCards.length) {
    elements.portraitPickerStatus.hidden = false;
    elements.portraitPickerStatus.textContent =
      "Portraits unlock when cards are added to your account.";
    elements.portraitGrid.hidden = true;
    elements.portraitGrid.replaceChildren();
    return;
  }

  elements.portraitPickerStatus.hidden = true;
  elements.portraitGrid.hidden = false;
  elements.portraitGrid.replaceChildren(
    ...availableCards.map(createPortraitChoice)
  );
}

function createPortraitChoice(card) {
  const button = document.createElement("button");
  const selected = card.id === selectedPortraitCardId;

  button.type = "button";
  button.className = `portrait-choice${selected ? " selected" : ""}`;
  button.dataset.cardId = card.id;
  button.setAttribute(
    "aria-label",
    selected
      ? `${card.name}, current portrait`
      : `Use ${card.name} as profile portrait`
  );
  button.innerHTML = `
    <span class="portrait-choice-frame">
      <img src="logo.png" alt="">
    </span>
    <strong>${escapeHtml(card.name)}</strong>
    <small>${selected ? "Selected" : card.id}</small>
  `;

  applyPortraitImage(button.querySelector("img"), card);

  button.addEventListener("click", () => selectPortrait(card, button));
  return button;
}

async function selectPortrait(card, button) {
  if (!card || card.id === selectedPortraitCardId) return;

  const previousText = button.querySelector("small")?.textContent;
  button.disabled = true;
  if (button.querySelector("small")) {
    button.querySelector("small").textContent = "Saving…";
  }

  try {
    if (cloudProfileAvailable && currentSession) {
      const { error } = await supabase
        .from("profiles")
        .update({ selected_portrait_card_id: card.id })
        .eq("user_id", currentSession.user.id);

      if (error) throw error;
    }

    selectedPortraitCardId = card.id;

    const chosenPath = portraitCandidates(card)[0];
    localStorage.setItem("wus-selected-profile-portrait", chosenPath);
    localStorage.setItem("wus-selected-profile-card-id", card.id);

    applyPortraitImage(elements.portrait, card);
    applyPortraitImage(elements.modalPortrait, card);
    renderPortraitGrid();

    window.dispatchEvent(new CustomEvent("wus-profile-portrait-changed", {
      detail: { cardId: card.id, name: card.name }
    }));
  } catch (error) {
    console.error("Could not save profile portrait:", error);
    button.disabled = false;
    if (button.querySelector("small")) {
      button.querySelector("small").textContent =
        previousText || card.id;
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initializeSoundEffectsSettings() {
  const storedValue = Number(localStorage.getItem(SOUND_EFFECTS_VOLUME_KEY));
  const value = Number.isFinite(storedValue)
    ? Math.max(0, Math.min(100, storedValue))
    : 100;

  localStorage.setItem(SOUND_EFFECTS_VOLUME_KEY, String(value));
  elements.soundEffectsVolume.value = String(value);
  elements.soundEffectsVolumeValue.textContent = `${value}%`;
}

function initializeMenuMusic() {
  const storedEnabled = localStorage.getItem(MENU_MUSIC_ENABLED_KEY);
  const MUSIC_REDUCTION_MIGRATION_KEY = "wus-menu-volume-reduced-v1";

  if (!localStorage.getItem(MUSIC_REDUCTION_MIGRATION_KEY)) {
    const previousVolume = Number(localStorage.getItem(MENU_MUSIC_VOLUME_KEY));
    const reducedVolume = Number.isFinite(previousVolume)
      ? Math.round(previousVolume * 0.75)
      : Math.round(DEFAULT_MUSIC_VOLUME * 100);

    localStorage.setItem(
      MENU_MUSIC_VOLUME_KEY,
      String(Math.max(0, Math.min(100, reducedVolume)))
    );
    localStorage.setItem(MUSIC_REDUCTION_MIGRATION_KEY, "true");
  }

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
      Math.min(1, startVolume + (clampedTarget - startVolume) * progress)
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
