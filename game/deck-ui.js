"use strict";

/* Worlds Under Siege — V19.9.2 Deck & Draw UI */

let pendingDrawAnimation = null;
let drawAnimationTimer = null;
let resolvedCardBackUrl = null;

const CARD_BACK_CANDIDATES = [
  "../card-back.png",
  "./card-back.png",
  "../assets/card-back.png",
  "./assets/card-back.png",
  "/card-back.png"
];

function resolveCardBackImage() {
  if (resolvedCardBackUrl) return Promise.resolve(resolvedCardBackUrl);

  return new Promise((resolve) => {
    let index = 0;

    const tryNext = () => {
      if (index >= CARD_BACK_CANDIDATES.length) {
        console.warn("[Card Back] card-back.png could not be loaded from any known location.", CARD_BACK_CANDIDATES);
        document.documentElement.style.removeProperty("--wus-card-back-image");
        resolve(null);
        return;
      }

      const candidate = CARD_BACK_CANDIDATES[index++];
      const image = new Image();
      image.onload = () => {
        resolvedCardBackUrl = new URL(candidate, document.baseURI).href;
        document.documentElement.style.setProperty("--wus-card-back-image", `url("${resolvedCardBackUrl}")`);
        console.info("[Card Back] Loaded:", resolvedCardBackUrl);
        resolve(resolvedCardBackUrl);
      };
      image.onerror = tryNext;
      image.src = candidate;
    };

    tryNext();
  });
}

resolveCardBackImage();

function queueDrawAnimation(card, playerId) {
  pendingDrawAnimation = { card, playerId, queuedAt: Date.now() };
}

function renderPendingDrawAnimation() {
  if (!pendingDrawAnimation || !elements?.handDock) return;
  const { card, playerId } = pendingDrawAnimation;
  pendingDrawAnimation = null;

  document.querySelector(".draw-card-animation")?.remove();
  if (drawAnimationTimer) window.clearTimeout(drawAnimationTimer);

  const source = document.querySelector(`#${playerId === 1 ? "player" : "enemy"}DeckZone`);
  const target = elements.handDock;
  if (!source || !target) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const cardNode = document.createElement("div");
  cardNode.className = "draw-card-animation";
  cardNode.setAttribute("aria-hidden", "true");
  cardNode.style.setProperty("--draw-start-x", `${sourceRect.left + sourceRect.width / 2}px`);
  cardNode.style.setProperty("--draw-start-y", `${sourceRect.top + sourceRect.height / 2}px`);
  cardNode.style.setProperty("--draw-end-x", `${targetRect.left + targetRect.width / 2}px`);
  cardNode.style.setProperty("--draw-end-y", `${targetRect.top + 18}px`);

  if (resolvedCardBackUrl) {
    cardNode.style.backgroundImage = `url("${resolvedCardBackUrl}")`;
  } else {
    cardNode.style.backgroundImage = "var(--wus-card-back-image, linear-gradient(145deg, #282f3d, #0f131b))";
    resolveCardBackImage().then((url) => {
      if (url && cardNode.isConnected) cardNode.style.backgroundImage = `url("${url}")`;
    });
  }
  cardNode.classList.add("draw-card-animation--art", "draw-card-animation--back");

  document.body.appendChild(cardNode);
  window.requestAnimationFrame(() => cardNode.classList.add("is-drawing"));
  drawAnimationTimer = window.setTimeout(() => cardNode.remove(), 700);
}

window.queueDrawAnimation = queueDrawAnimation;
window.renderPendingDrawAnimation = renderPendingDrawAnimation;
window.resolveCardBackImage = resolveCardBackImage;
