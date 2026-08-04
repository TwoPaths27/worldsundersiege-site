import { supabase } from "./supabase-config.js";
import { getSession, getProfile } from "./auth-common.js";

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
  playMenu: document.getElementById("playMenu"),
  profileModal: document.getElementById("profileModal"),
  settingsModal: document.getElementById("settingsModal"),
  newsCategory: document.getElementById("newsCategory"),
  newsTitle: document.getElementById("newsTitle"),
  newsSummary: document.getElementById("newsSummary"),
  newsDots: document.getElementById("newsDots"),
  previousNews: document.getElementById("previousNews"),
  nextNews: document.getElementById("nextNews")
};

let newsIndex = 0;
let newsTimer = null;

initialize();

async function initialize() {
  await loadPlayer();
  loadGold();
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
  elements.playButton.addEventListener("click", () => {
    const open = elements.playButton.getAttribute("aria-expanded") === "true";
    elements.playButton.setAttribute("aria-expanded", String(!open));
    elements.playMenu.hidden = open;
  });

  elements.profileButton.addEventListener("click", () => openModal(elements.profileModal));
  elements.settingsButton.addEventListener("click", () => openModal(elements.settingsModal));

  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".hub-modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAllModals();
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
