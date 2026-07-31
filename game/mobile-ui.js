"use strict";

(() => {
  const mobileQuery = window.matchMedia("(max-width: 900px), (pointer: coarse)");
  const forceDesktop = new URLSearchParams(location.search).get("desktop") === "1";
  if (forceDesktop || !mobileQuery.matches) return;

  document.body.classList.add("mobile-mode");

  const stage = document.querySelector(".battlefield-stage");
  const battlefieldColumn = document.querySelector(".battlefield-column");
  const chatPanel = document.querySelector(".chat-panel");
  const chatMessages = document.querySelector("#chatMessages");
  const chatToggle = document.querySelector("#mobileChatToggle");
  const chatBadge = document.querySelector("#mobileChatBadge");
  const resetViewButton = document.querySelector("#mobileResetView");
  const expandButton = document.querySelector("#mobileExpandCard");
  const cardModal = document.querySelector("#mobileCardModal");
  const cardModalImage = document.querySelector("#mobileCardModalImage");
  const cardModalTitle = document.querySelector("#mobileCardModalTitle");
  const cardModalClose = document.querySelector("#mobileCardModalClose");

  let selectedToken = null;
  let newMessageCount = 0;
  let scale = 1;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let startDistance = 0;
  let startScale = 1;
  let startMidpoint = null;
  const pointers = new Map();

  function setChatOpen(open) {
    if (!chatPanel || !chatToggle) return;
    chatPanel.classList.toggle("mobile-chat-open", open);
    chatToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      newMessageCount = 0;
      updateChatBadge();
      document.querySelector("#chatInput")?.focus({ preventScroll: true });
    }
  }

  function updateChatBadge() {
    if (!chatBadge) return;
    chatBadge.hidden = newMessageCount <= 0;
    chatBadge.textContent = newMessageCount > 9 ? "9+" : String(newMessageCount);
  }

  chatToggle?.addEventListener("click", () => {
    setChatOpen(!chatPanel?.classList.contains("mobile-chat-open"));
  });

  if (chatMessages) {
    const observer = new MutationObserver((records) => {
      const added = records.some((record) => record.addedNodes.length > 0);
      if (!added || chatPanel?.classList.contains("mobile-chat-open")) return;
      newMessageCount += 1;
      updateChatBadge();
    });
    observer.observe(chatMessages, { childList: true });
  }

  function clampCamera() {
    if (!stage || !battlefieldColumn) return;
    const viewport = battlefieldColumn.getBoundingClientRect();
    const width = stage.offsetWidth * scale;
    const height = stage.offsetHeight * scale;
    const margin = 80;

    const minX = Math.min(margin, viewport.width - width - margin);
    const maxX = Math.max(-margin, viewport.width - margin);
    const minY = Math.min(margin, viewport.height - height - margin);
    const maxY = Math.max(-margin, viewport.height - margin);

    x = Math.min(maxX, Math.max(minX, x));
    y = Math.min(maxY, Math.max(minY, y));
  }

  function applyCamera(animate = false) {
    if (!stage) return;
    stage.classList.toggle("mobile-camera-animate", animate);
    stage.style.setProperty("--mobile-camera-x", `${x}px`);
    stage.style.setProperty("--mobile-camera-y", `${y}px`);
    stage.style.setProperty("--mobile-camera-scale", String(scale));
    if (animate) setTimeout(() => stage.classList.remove("mobile-camera-animate"), 280);
    positionExpandButton();
  }

  function fitBoard(animate = false) {
    if (!stage || !battlefieldColumn) return;
    const viewport = battlefieldColumn.getBoundingClientRect();
    const safeWidth = Math.max(320, viewport.width - 24);
    const safeHeight = Math.max(320, viewport.height - 130);
    scale = Math.min(1, safeWidth / stage.offsetWidth, safeHeight / stage.offsetHeight);
    scale = Math.max(0.45, scale);
    x = (viewport.width - stage.offsetWidth * scale) / 2;
    y = Math.max(12, (viewport.height - stage.offsetHeight * scale) / 2 - 12);
    clampCamera();
    applyCamera(animate);
  }

  function pointerDistance() {
    const values = [...pointers.values()];
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  function pointerMidpoint() {
    const values = [...pointers.values()];
    if (values.length < 2) return null;
    return { x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 };
  }

  battlefieldColumn?.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, input, form, .public-zone-modal, .deployment-choice-modal")) return;
    battlefieldColumn.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      startX = event.clientX - x;
      startY = event.clientY - y;
    } else if (pointers.size === 2) {
      startDistance = pointerDistance();
      startScale = scale;
      startMidpoint = pointerMidpoint();
    }
  });

  battlefieldColumn?.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      x = event.clientX - startX;
      y = event.clientY - startY;
    } else if (pointers.size >= 2 && startDistance > 0) {
      const midpoint = pointerMidpoint();
      const nextScale = Math.min(2.8, Math.max(0.45, startScale * pointerDistance() / startDistance));
      if (midpoint && startMidpoint) {
        const localX = (startMidpoint.x - x) / scale;
        const localY = (startMidpoint.y - y) / scale;
        scale = nextScale;
        x = midpoint.x - localX * scale;
        y = midpoint.y - localY * scale;
      }
    }
    clampCamera();
    applyCamera(false);
    event.preventDefault();
  }, { passive: false });

  function endPointer(event) {
    pointers.delete(event.pointerId);
    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      startX = remaining.x - x;
      startY = remaining.y - y;
    }
    startDistance = 0;
    startMidpoint = null;
  }

  battlefieldColumn?.addEventListener("pointerup", endPointer);
  battlefieldColumn?.addEventListener("pointercancel", endPointer);

  battlefieldColumn?.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    fitBoard(true);
  });

  resetViewButton?.addEventListener("click", () => fitBoard(true));

  function getUnitForToken(token) {
    const id = token?.dataset.unitId;
    if (!id || typeof GameState === "undefined") return null;
    return GameState.units?.find((unit) => String(unit.id) === String(id)) || null;
  }

  function positionExpandButton() {
    if (!expandButton || !selectedToken || !document.body.contains(selectedToken)) {
      expandButton?.setAttribute("hidden", "");
      return;
    }
    const rect = selectedToken.getBoundingClientRect();
    expandButton.hidden = false;
    expandButton.style.left = `${rect.left + rect.width / 2}px`;
    expandButton.style.top = `${Math.max(62, rect.top + rect.height / 2)}px`;
  }

  battlefieldColumn?.addEventListener("click", (event) => {
    const token = event.target.closest(".unit-token");
    if (!token) {
      selectedToken = null;
      positionExpandButton();
      return;
    }
    selectedToken = token;
    requestAnimationFrame(positionExpandButton);
  }, true);

  expandButton?.addEventListener("click", () => {
    const unit = getUnitForToken(selectedToken);
    const image = unit?.cardImage || unit?.tileImage;
    if (!unit || !image || !cardModal || !cardModalImage) return;
    cardModalTitle.textContent = unit.name || "Card";
    cardModalImage.src = image;
    cardModalImage.alt = `${unit.name || "Card"} full card artwork`;
    cardModal.hidden = false;
    document.body.classList.add("mobile-card-open");
  });

  function closeCardModal() {
    if (!cardModal) return;
    cardModal.hidden = true;
    document.body.classList.remove("mobile-card-open");
  }
  cardModalClose?.addEventListener("click", closeCardModal);
  cardModal?.querySelector("[data-mobile-card-close]")?.addEventListener("click", closeCardModal);

  window.addEventListener("resize", () => {
    clampCamera();
    applyCamera(false);
  });
  window.addEventListener("orientationchange", () => setTimeout(() => fitBoard(true), 180));

  requestAnimationFrame(() => fitBoard(false));
})();
