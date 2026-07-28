"use strict";

/*
 * Worlds Under Siege — V19.9.3 Public Zone Browser
 *
 * Discard and Banish are public information. Clicking either pile opens a
 * read-only card browser, hides the hand dock, and supports mouse, keyboard,
 * and Escape dismissal.
 */

const PublicZoneBrowser = {
  isOpen: false,
  zoneName: null,
  playerId: null,
  handWasHidden: false,
  lastFocusedElement: null,
};

function getPublicZoneCards(playerId, zoneName) {
  const normalized = normalizeZoneName(zoneName);
  if (![ZoneTypes.DISCARD, ZoneTypes.BANISH].includes(normalized)) return [];
  const zone = getZone(normalized, playerId);
  return Array.isArray(zone) ? zone : [];
}

function getPublicZoneTitle(playerId, zoneName) {
  const player = GameState.players?.[playerId];
  const ownerName = player?.name ?? `Player ${playerId}`;
  const label = zoneName === ZoneTypes.BANISH ? "Banish" : "Discard";
  return { ownerName, label, title: `${ownerName} ${label}` };
}

function createPublicZoneCard(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hand-card public-zone-card";
  button.setAttribute("aria-label", `${card.name ?? "Unknown card"}; inspect card`);

  if (card.cardImage) {
    button.classList.add("hand-card--art");
    button.style.backgroundImage =
      `linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.02) 64%), url("${card.cardImage}")`;
    button.style.backgroundPosition = "center";
    button.style.backgroundRepeat = "no-repeat";
    button.style.backgroundSize = "cover";
  }

  const cost = document.createElement("span");
  cost.className = "hand-card__cost";
  cost.textContent = String(card.cost ?? 0);

  const name = document.createElement("strong");
  name.className = "hand-card__name";
  name.textContent = card.name ?? "Unknown card";

  const stats = document.createElement("span");
  stats.className = "hand-card__stats";
  if (typeof isAction === "function" && isAction(card)) {
    button.classList.add("hand-card--action");
    stats.textContent = typeof hasCounterKeyword === "function" && hasCounterKeyword(card)
      ? "ACTION · COUNTER"
      : "ACTION";
  } else if (typeof isEvent === "function" && isEvent(card)) {
    button.classList.add("hand-card--event");
    stats.textContent = "EVENT";
  } else if (typeof isItem === "function" && isItem(card)) {
    stats.textContent = "ITEM";
  } else {
    stats.textContent = `ATK ${card.attack ?? 0} · HP ${card.hp ?? 0} · RNG ${card.range ?? 0} · SPD ${card.speed ?? 0}`;
  }

  button.append(cost, stats, name);
  button.addEventListener("mouseenter", () => renderHandCardPreview(card));
  button.addEventListener("focus", () => renderHandCardPreview(card));
  button.addEventListener("click", () => renderHandCardPreview(card));
  return button;
}

function renderPublicZoneBrowser() {
  const modal = elements.publicZoneModal;
  if (!modal || !PublicZoneBrowser.isOpen) return;

  const cards = getPublicZoneCards(PublicZoneBrowser.playerId, PublicZoneBrowser.zoneName);
  const { ownerName, label, title } = getPublicZoneTitle(
    PublicZoneBrowser.playerId,
    PublicZoneBrowser.zoneName
  );

  elements.publicZoneTitle.textContent = label;
  elements.publicZoneOwner.textContent = ownerName;
  elements.publicZoneCount.textContent = `${cards.length} ${cards.length === 1 ? "card" : "cards"}`;
  elements.publicZoneCards.replaceChildren();
  modal.querySelector(".public-zone-modal__dialog")?.setAttribute("aria-label", title);

  if (cards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "public-zone-modal__empty";
    empty.textContent = `This ${label} pile is empty.`;
    elements.publicZoneCards.appendChild(empty);
    return;
  }

  // Newest card is shown first, matching the visible top of a physical pile.
  for (const card of [...cards].reverse()) {
    elements.publicZoneCards.appendChild(createPublicZoneCard(card));
  }
}

function openPublicZoneBrowser(playerId, zoneName) {
  const normalized = normalizeZoneName(zoneName);
  if (![ZoneTypes.DISCARD, ZoneTypes.BANISH].includes(normalized)) return false;
  if (!GameState.players?.[playerId]) return false;

  PublicZoneBrowser.isOpen = true;
  PublicZoneBrowser.zoneName = normalized;
  PublicZoneBrowser.playerId = playerId;
  PublicZoneBrowser.lastFocusedElement = document.activeElement;
  PublicZoneBrowser.handWasHidden = Boolean(elements.handDock?.hidden);

  if (elements.handDock) elements.handDock.hidden = true;
  elements.publicZoneModal.hidden = false;
  document.body.classList.add("modal-open", "public-zone-browser-open");
  renderPublicZoneBrowser();

  window.requestAnimationFrame(() => elements.closePublicZoneButton?.focus());
  return true;
}

function closePublicZoneBrowser() {
  if (!PublicZoneBrowser.isOpen) return false;

  PublicZoneBrowser.isOpen = false;
  elements.publicZoneModal.hidden = true;
  if (elements.handDock) elements.handDock.hidden = PublicZoneBrowser.handWasHidden;
  document.body.classList.remove("public-zone-browser-open");

  const otherModalOpen = [elements.exitModal, elements.victoryModal, elements.eventChoiceModal]
    .some((modal) => modal && !modal.hidden);
  if (!otherModalOpen) document.body.classList.remove("modal-open");

  const focusTarget = PublicZoneBrowser.lastFocusedElement;
  PublicZoneBrowser.zoneName = null;
  PublicZoneBrowser.playerId = null;
  PublicZoneBrowser.lastFocusedElement = null;
  if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
  return true;
}

function refreshPublicZoneBrowser() {
  if (PublicZoneBrowser.isOpen) renderPublicZoneBrowser();
}

window.PublicZoneBrowser = PublicZoneBrowser;
window.openPublicZoneBrowser = openPublicZoneBrowser;
window.closePublicZoneBrowser = closePublicZoneBrowser;
window.refreshPublicZoneBrowser = refreshPublicZoneBrowser;
