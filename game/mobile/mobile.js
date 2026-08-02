(() => {
  "use strict";

  const state = {
    scale: 0.72,
    x: 0,
    y: 0,
    minScale: 0.38,
    maxScale: 2.8,
    pointers: new Map(),
    startDistance: 0,
    startScale: 0.72,
    startCenter: null,
    startX: 0,
    startY: 0,
    unread: 0,
    chatOpen: false,
    inspectOpen: false,
    zonesOpen: false,
    lastTappedToken: null,
    camera: null,
    stage: null,
    initialized: false,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function setBootstrapStatus(message, kind = "loading") {
    let panel = $("#mobileBootstrapStatus");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "mobileBootstrapStatus";
      panel.className = "mobile-bootstrap-status";
      panel.innerHTML = '<strong>Worlds Under Siege</strong><span></span>';
      document.body.appendChild(panel);
    }
    panel.dataset.kind = kind;
    panel.querySelector("span").textContent = message;
    panel.hidden = false;
  }

  function hideBootstrapStatus() {
    const panel = $("#mobileBootstrapStatus");
    if (!panel) return;
    panel.classList.add("is-leaving");
    setTimeout(() => panel.remove(), 260);
  }

  function createButton(label, title, extra = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mobile-button ${extra}`.trim();
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    return button;
  }

  function applyTransform(stage = state.stage) {
    if (!stage) return;
    stage.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
  }

  function centerBoard(camera = state.camera, stage = state.stage, scale = null) {
    if (!camera || !stage) return;
    if (Number.isFinite(scale)) {
      state.scale = Math.max(state.minScale, Math.min(state.maxScale, scale));
    }
    const sw = stage.scrollWidth || stage.offsetWidth || 1080;
    const sh = stage.scrollHeight || stage.offsetHeight || 900;
    state.x = (camera.clientWidth - sw * state.scale) / 2;
    state.y = (camera.clientHeight - sh * state.scale) / 2;
    applyTransform(stage);
  }

  function fitBoard(camera = state.camera, stage = state.stage) {
    if (!camera || !stage) return;
    const sw = stage.scrollWidth || stage.offsetWidth || 1080;
    const sh = stage.scrollHeight || stage.offsetHeight || 900;
    const fit = Math.min(camera.clientWidth / sw, camera.clientHeight / sh);
    centerBoard(camera, stage, Math.max(state.minScale, Math.min(0.95, fit * 1.04)));
  }

  function distance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function midpoint(a, b) {
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  }

  function installCamera(stage) {
    if (stage.parentElement?.classList.contains("mobile-camera")) {
      state.camera = stage.parentElement;
      state.stage = stage;
      return stage.parentElement;
    }

    const camera = document.createElement("div");
    camera.className = "mobile-camera";
    stage.parentNode.insertBefore(camera, stage);
    camera.appendChild(stage);
    state.camera = camera;
    state.stage = stage;

    camera.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button, input, textarea, select, .unit-token, .battlefield-cell, .stronghold, .game-zone")) return;
      camera.setPointerCapture?.(event.pointerId);
      state.pointers.set(event.pointerId, event);
      state.startX = state.x;
      state.startY = state.y;
      if (state.pointers.size === 2) {
        const [a, b] = [...state.pointers.values()];
        state.startDistance = distance(a, b);
        state.startScale = state.scale;
        state.startCenter = midpoint(a, b);
      }
    });

    camera.addEventListener("pointermove", (event) => {
      if (!state.pointers.has(event.pointerId)) return;
      const previous = state.pointers.get(event.pointerId);
      state.pointers.set(event.pointerId, event);

      if (state.pointers.size === 1) {
        state.x += event.clientX - previous.clientX;
        state.y += event.clientY - previous.clientY;
      } else if (state.pointers.size >= 2) {
        const [a, b] = [...state.pointers.values()];
        const newDistance = distance(a, b);
        const center = midpoint(a, b);
        const nextScale = Math.max(
          state.minScale,
          Math.min(state.maxScale, state.startScale * (newDistance / Math.max(1, state.startDistance)))
        );
        const localX = (state.startCenter.x - state.startX) / Math.max(0.001, state.startScale);
        const localY = (state.startCenter.y - state.startY) / Math.max(0.001, state.startScale);
        state.scale = nextScale;
        state.x = center.x - localX * nextScale;
        state.y = center.y - localY * nextScale;
      }
      applyTransform(stage);
      event.preventDefault();
    }, { passive: false });

    const endPointer = (event) => state.pointers.delete(event.pointerId);
    camera.addEventListener("pointerup", endPointer);
    camera.addEventListener("pointercancel", endPointer);

    let lastTap = 0;
    camera.addEventListener("click", (event) => {
      if (event.target !== camera && !event.target.classList.contains("battlefield-stage")) return;
      const now = Date.now();
      if (now - lastTap < 330) fitBoard(camera, stage);
      lastTap = now;
    });

    window.addEventListener("resize", () => fitBoard(camera, stage), { passive: true });
    requestAnimationFrame(() => fitBoard(camera, stage));
    return camera;
  }

  function makeDrawer(side, title, kind) {
    const drawer = document.createElement("aside");
    drawer.className = `mobile-drawer mobile-drawer--${side}`;
    drawer.dataset.drawer = kind;
    drawer.innerHTML = `<div class="mobile-drawer__header"><h2>${title}</h2><button type="button" class="mobile-button" data-close-drawer>×</button></div>`;
    document.body.appendChild(drawer);
    drawer.querySelector("[data-close-drawer]").addEventListener("click", closeDrawers);
    return drawer;
  }

  function closeDrawers() {
    $$(".mobile-drawer.is-open").forEach(el => el.classList.remove("is-open"));
    $(".mobile-backdrop")?.remove();
    state.chatOpen = false;
    state.inspectOpen = false;
    state.zonesOpen = false;
  }

  function openDrawer(drawer, kind) {
    if (drawer.classList.contains("is-open")) {
      closeDrawers();
      return;
    }
    closeDrawers();
    const backdrop = document.createElement("div");
    backdrop.className = "mobile-backdrop";
    backdrop.addEventListener("click", closeDrawers);
    document.body.appendChild(backdrop);
    drawer.classList.add("is-open");
    state.chatOpen = kind === "chat";
    state.inspectOpen = kind === "inspect";
    state.zonesOpen = kind === "zones";
  }

  function imageFromElement(element) {
    return element?.dataset?.cardImage
      || element?.dataset?.image
      || element?.querySelector("img")?.src
      || element?.style?.backgroundImage?.match(/url\(["']?(.*?)["']?\)/)?.[1]
      || null;
  }

  function showCardArt(source) {
    const imageUrl = imageFromElement(source);
    if (!imageUrl) return;
    const modal = document.createElement("div");
    modal.className = "mobile-card-modal";
    modal.innerHTML = `<button class="mobile-card-modal__close" type="button" aria-label="Close">×</button><img alt="Expanded card">`;
    modal.querySelector("img").src = imageUrl;
    modal.querySelector("button").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  function installExpandPrompt() {
    let pressTimer = null;
    document.addEventListener("pointerdown", (event) => {
      const source = event.target.closest(".unit-token, .hand-card, .public-zone-card, .zone-browser-card");
      if (!source) return;
      state.lastTappedToken = source;
      pressTimer = setTimeout(() => showCardArt(source), 520);
    }, true);

    document.addEventListener("pointerup", () => {
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
    }, true);
    document.addEventListener("pointercancel", () => {
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
    }, true);

    document.addEventListener("click", (event) => {
      const token = event.target.closest(".unit-token");
      if (!token) return;
      state.lastTappedToken = token;
      $(".mobile-expand-prompt")?.remove();
      const prompt = document.createElement("button");
      prompt.type = "button";
      prompt.className = "mobile-expand-prompt";
      prompt.textContent = "Expand";
      prompt.addEventListener("click", (e) => {
        e.stopPropagation();
        showCardArt(state.lastTappedToken);
        prompt.remove();
      });
      document.body.appendChild(prompt);
      setTimeout(() => prompt.remove(), 2600);
    }, true);
  }

  function createZoneDrawer() {
    const drawer = makeDrawer("right", "Zones", "zones");
    const grid = document.createElement("div");
    grid.className = "mobile-zone-grid";
    const zoneSpecs = [
      ["Deck", "#playerDeckZone"],
      ["Discard", "#playerDiscardZone"],
      ["Banish", "#playerBanishZone"],
      ["Event", "#playerEventZone"],
      ["Army 1", "#playerArmy1"],
      ["Army 2", "#playerArmy2"],
      ["Army 3", "#playerArmy3"],
      ["Enemy Discard", "#enemyDiscardZone"],
      ["Enemy Banish", "#enemyBanishZone"],
    ];
    zoneSpecs.forEach(([label, selector]) => {
      const button = createButton(label, `Open ${label}`);
      button.addEventListener("click", () => {
        closeDrawers();
        $(selector)?.click();
      });
      grid.appendChild(button);
    });
    drawer.appendChild(grid);
    return drawer;
  }

  async function waitForSharedGame(timeoutMs = 12000) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      const stage = $(".battlefield-stage");
      const battlefield = $("#battlefield");
      const lobby = $("#pregameLobbyModal");
      const hand = $("#handDock");
      if (stage && battlefield && lobby && hand) return true;
      await delay(100);
    }
    return false;
  }

  function installStartupWatchdog() {
    const lobby = $("#pregameLobbyModal");
    if (!lobby) return;
    const observer = new MutationObserver(() => {
      if (!lobby.hidden) {
        document.body.classList.add("mobile-dialog-open");
      } else {
        document.body.classList.remove("mobile-dialog-open");
        setTimeout(() => fitBoard(), 120);
      }
    });
    observer.observe(lobby, { attributes: true, attributeFilter: ["hidden"] });
  }

  async function initializeMobile() {
    if (new URLSearchParams(location.search).get("desktop") === "1") {
      location.replace("../" + location.search.replace(/([?&])desktop=1(&|$)/, "$1").replace(/[?&]$/, ""));
      return;
    }

    setBootstrapStatus("Loading shared game engine…");
    const ready = await waitForSharedGame();
    if (!ready) throw new Error("Timed out while waiting for the shared game interface.");

    const stage = $(".battlefield-stage");
    const desktopSidePanels = $$(".game-layout > .side-panel");
    document.body.classList.add("mobile-battle");

    setBootstrapStatus("Preparing touch controls…");
    const camera = installCamera(stage);

    const toolbar = document.createElement("nav");
    toolbar.className = "mobile-toolbar";
    const home = createButton("✕", "Exit Match");
    const title = document.createElement("div");
    title.className = "mobile-toolbar__title";
    title.textContent = "Worlds Under Siege";
    const inspectButton = createButton("Unit", "Open selected unit and card preview");
    const zonesButton = createButton("Zones", "Open zones");
    const centerButton = createButton("◎", "Center Board");
    const chatButton = createButton("Chat", "Open Chat");
    const badge = document.createElement("span");
    badge.className = "mobile-unread";
    badge.hidden = true;
    chatButton.appendChild(badge);
    toolbar.append(home, title, inspectButton, zonesButton, centerButton, chatButton);
    document.body.appendChild(toolbar);

    const chatDrawer = makeDrawer("left", "Game Chat", "chat");
    const inspectDrawer = makeDrawer("right", "Unit & Card", "inspect");
    const zonesDrawer = createZoneDrawer();

    const chatPanel = desktopSidePanels[0]?.querySelector(".chat-panel");
    const selectedPanel = desktopSidePanels[0]?.querySelector(".panel-card:first-child");
    const previewPanel = desktopSidePanels[1]?.querySelector(".panel-card:first-child");
    if (chatPanel) chatDrawer.appendChild(chatPanel);
    if (selectedPanel) inspectDrawer.appendChild(selectedPanel);
    if (previewPanel) inspectDrawer.appendChild(previewPanel);

    home.addEventListener("click", () => $("#exitGameButton")?.click());
    centerButton.addEventListener("click", () => fitBoard(camera, stage));
    inspectButton.addEventListener("click", () => openDrawer(inspectDrawer, "inspect"));
    zonesButton.addEventListener("click", () => openDrawer(zonesDrawer, "zones"));
    chatButton.addEventListener("click", () => {
      if (state.chatOpen) closeDrawers();
      else {
        state.unread = 0;
        badge.hidden = true;
        openDrawer(chatDrawer, "chat");
      }
    });

    const messages = $("#chatMessages");
    if (messages && window.MutationObserver) {
      new MutationObserver((mutations) => {
        const added = mutations.reduce((n, m) => n + m.addedNodes.length, 0);
        if (!added || state.chatOpen) return;
        state.unread += added;
        badge.textContent = state.unread > 9 ? "9+" : String(state.unread);
        badge.hidden = false;
      }).observe(messages, { childList: true });
    }

    const desktopEnd = $("#endTurnButton");
    if (desktopEnd) {
      const mobileEnd = createButton("End", "End Turn", "mobile-button--end");
      mobileEnd.addEventListener("click", () => desktopEnd.click());
      toolbar.appendChild(mobileEnd);
      const syncEnd = () => { mobileEnd.disabled = desktopEnd.disabled; };
      syncEnd();
      new MutationObserver(syncEnd).observe(desktopEnd, { attributes: true, attributeFilter: ["disabled"] });
    }

    installExpandPrompt();
    installStartupWatchdog();

    const battlefield = $("#battlefield");
    if (battlefield && window.MutationObserver) {
      new MutationObserver(() => requestAnimationFrame(() => applyTransform(stage)))
        .observe(battlefield, { childList: true, subtree: true });
    }

    state.initialized = true;
    hideBootstrapStatus();
    console.info("[Mobile] Mobile route initialized without changing the desktop route.");
  }

  async function boot() {
    try {
      await initializeMobile();
    } catch (error) {
      console.error("[Mobile] Enhancement failed; preserving shared desktop UI as fallback.", error);
      document.body.classList.remove("mobile-battle");
      setBootstrapStatus(`Mobile controls could not start: ${error.message}`, "error");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
