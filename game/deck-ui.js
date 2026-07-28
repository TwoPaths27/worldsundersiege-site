"use strict";

/* Worlds Under Siege — V19.9.2 Deck & Draw UI */

let pendingDrawAnimation = null;
let drawAnimationTimer = null;

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

  cardNode.style.backgroundImage = 'url("../card-back.png")';
  cardNode.classList.add("draw-card-animation--art", "draw-card-animation--back");

  document.body.appendChild(cardNode);
  window.requestAnimationFrame(() => cardNode.classList.add("is-drawing"));
  drawAnimationTimer = window.setTimeout(() => cardNode.remove(), 700);
}

window.queueDrawAnimation = queueDrawAnimation;
window.renderPendingDrawAnimation = renderPendingDrawAnimation;
