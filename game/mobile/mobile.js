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
    audioUnlocked: false,
    layoutScheduled: false,
    clickSoundReady: false,
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

  function getBoardMetrics(stage = state.stage) {
    const board = $("#battlefield");
    if (!stage || !board) return null;
    return {
      board,
      left: board.offsetLeft || 0,
      top: board.offsetTop || 0,
      width: board.offsetWidth || 700,
      height: board.offsetHeight || 600,
    };
  }

  function centerBoard(camera = state.camera, stage = state.stage, scale = null) {
    if (!camera || !stage) return;
    if (Number.isFinite(scale)) {
      state.scale = Math.max(state.minScale, Math.min(state.maxScale, scale));
    }
    const metrics = getBoardMetrics(stage);
    if (!metrics) return;
    state.x = (camera.clientWidth - metrics.width * state.scale) / 2 - metrics.left * state.scale;
    // Center the complete mobile HUD vertically when it fits, while keeping the board centered horizontally.
    const contentHeight = Math.max(stage.scrollHeight || 0, stage.offsetHeight || 0, metrics.top + metrics.height);
    const scaledContentHeight = contentHeight * state.scale;
    state.y = scaledContentHeight <= camera.clientHeight
      ? (camera.clientHeight - scaledContentHeight) / 2
      : Math.min(8, -metrics.top * state.scale + 110);
    applyTransform(stage);
  }

  function fitBoard(camera = state.camera, stage = state.stage) {
    if (!camera || !stage) return;
    const metrics = getBoardMetrics(stage);
    if (!metrics) return;
    // Mobile is width-first: the battlefield spans almost the full phone width.
    const fit = (camera.clientWidth - 8) / Math.max(1, metrics.width);
    centerBoard(camera, stage, Math.max(state.minScale, Math.min(1.45, fit)));
  }

  function distance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function midpoint(a, b) {
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  }

  function setAbsoluteBox(element, left, top, width = null) {
    if (!element) return;
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("left", `${Math.round(left)}px`, "important");
    element.style.setProperty("top", `${Math.round(top)}px`, "important");
    element.style.setProperty("right", "auto", "important");
    element.style.setProperty("bottom", "auto", "important");
    element.style.setProperty("transform", "none", "important");
    if (Number.isFinite(width)) element.style.setProperty("width", `${Math.round(width)}px`, "important");
  }

  function arrangeMobileBoard(stage = state.stage) {
    if (!stage) return;
    const board = $("#battlefield");
    if (!board || board.offsetWidth < 100 || board.offsetHeight < 100) return;

    const boardWidth = board.offsetWidth;
    const boardHeight = board.offsetHeight;
    const gap = 8;
    const zoneW = Math.max(54, Math.min(72, boardWidth / 8));
    const boardTop = 132;

    setAbsoluteBox(board, 0, boardTop, boardWidth);

    const enemyStronghold = $(".stronghold-lane--enemy");
    const playerStronghold = $(".stronghold-lane--player");
    setAbsoluteBox(enemyStronghold, boardWidth * 0.28, 44, boardWidth * 0.44);
    setAbsoluteBox(playerStronghold, boardWidth * 0.28, boardTop + boardHeight + gap, boardWidth * 0.44);

    const enemyEnergy = $(".battlefield-energy--enemy");
    const playerEnergy = $(".battlefield-energy--player");
    setAbsoluteBox(enemyEnergy, boardWidth * 0.43, 108, boardWidth * 0.14);
    setAbsoluteBox(playerEnergy, boardWidth * 0.43, boardTop + boardHeight + 76, boardWidth * 0.14);

    // Enemy utilities stay compact at the top edges.
    setAbsoluteBox($(".zone-group--enemy-piles"), 0, 18, zoneW * 3 + gap * 2);
    setAbsoluteBox($(".army-zones--enemy"), boardWidth - (zoneW * 3 + gap * 2), 18, zoneW * 3 + gap * 2);
    setAbsoluteBox($(".event-column--enemy"), boardWidth - zoneW, 92, zoneW);

    // Player HUD: Stronghold and Energy stay centered; Event, Armies, Deck, Discard, and Banish
    // remain visible in two compact rows beneath the board instead of falling below the camera.
    const playerStrongholdTop = boardTop + boardHeight + gap;
    setAbsoluteBox(playerStronghold, boardWidth * 0.28, playerStrongholdTop, boardWidth * 0.44);
    setAbsoluteBox(playerEnergy, boardWidth * 0.43, playerStrongholdTop + 58, boardWidth * 0.14);

    const lowerOne = playerStrongholdTop + 116;
    const lowerTwo = lowerOne + 66;
    setAbsoluteBox($(".event-column--player"), 0, lowerOne, zoneW);
    setAbsoluteBox($(".army-zones--player"), zoneW + gap, lowerOne, zoneW * 3 + gap * 2);
    setAbsoluteBox($(".zone-group--player-piles"), 0, lowerTwo, zoneW * 3 + gap * 2);

    stage.style.setProperty("min-width", `${Math.ceil(boardWidth)}px`, "important");
    stage.style.setProperty("width", `${Math.ceil(boardWidth)}px`, "important");
    stage.style.setProperty("min-height", `${Math.ceil(lowerTwo + 76)}px`, "important");
    stage.classList.add("mobile-stage-reflowed");
  }

  function scheduleMobileBoardLayout() {
    if (state.layoutScheduled) return;
    state.layoutScheduled = true;
    requestAnimationFrame(() => {
      state.layoutScheduled = false;
      arrangeMobileBoard();
      fitBoard();
    });
  }

  function unlockMobileAudio() {
    if (state.audioUnlocked) return;
    state.audioUnlocked = true;
    try {
      if (typeof ambienceAudio !== "undefined" && ambienceAudio) {
        ambienceAudio.volume = Math.max(0.25, Number(ambienceAudio.volume) || 0.25);
        const playback = ambienceAudio.play();
        playback?.catch?.(() => { state.audioUnlocked = false; });
      } else if (typeof startAmbience === "function") {
        startAmbience();
      }
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context && playBoostedOneShot?.context?.state === "suspended") {
        playBoostedOneShot.context.resume().catch(() => {});
      }
    } catch (error) {
      state.audioUnlocked = false;
      console.warn("[Mobile] Audio unlock deferred.", error);
    }
  }


  function installMobileButtonClickSound() {
    if (state.clickSoundReady) return;
    state.clickSoundReady = true;
    const soundUrl = new URL("../sounds/mouse-click.mp3", document.baseURI).href;
    let baseAudio = null;
    try {
      baseAudio = new Audio(soundUrl);
      baseAudio.preload = "auto";
      baseAudio.volume = 1;
    } catch (error) {
      console.warn("[Mobile] Could not prepare button click sound.", error);
      return;
    }

    document.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("button, [role='button']");
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
      try {
        const click = baseAudio.cloneNode(true);
        click.volume = 1;
        click.play().catch(() => {});
      } catch (_) {}
    }, { capture: true, passive: true });
  }

  function installMobileAudioUnlock() {
    const unlock = () => unlockMobileAudio();
    document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
    document.addEventListener("touchstart", unlock, { capture: true, passive: true });
    document.addEventListener("click", unlock, { capture: true, passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        state.audioUnlocked = false;
        unlockMobileAudio();
      }
    });
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
      const source = event.target.closest(".unit-token, .mounted-rider-overlay, .mounted-mount-panel, .hand-card, .public-zone-card, .zone-browser-card");
      if (!source) return;
      state.lastTappedToken = source;
      pressTimer = setTimeout(() => showCardArt(source), 520);
    }, true);

    const cancelPress = () => {
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
    };
    document.addEventListener("pointerup", cancelPress, true);
    document.addEventListener("pointercancel", cancelPress, true);

    document.addEventListener("click", (event) => {
      const token = event.target.closest(".unit-token, .mounted-rider-overlay, .mounted-mount-panel");
      if (!token) return;
      state.lastTappedToken = token;
      $(".mobile-expand-prompt")?.remove();
      const prompt = document.createElement("button");
      prompt.type = "button";
      prompt.className = "mobile-expand-prompt";
      prompt.textContent = "Zoom Card";
      prompt.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showCardArt(state.lastTappedToken);
        prompt.remove();
      });
      document.body.appendChild(prompt);
      setTimeout(() => prompt.remove(), 3600);
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
    installMobileAudioUnlock();
    installMobileButtonClickSound();
    scheduleMobileBoardLayout();

    const toolbar = document.createElement("nav");
    toolbar.className = "mobile-toolbar";
    const home = createButton("✕", "Exit Match");
    const title = document.createElement("div");
    title.className = "mobile-toolbar__title";
    title.textContent = "Worlds Under Siege";
    const chatButton = createButton("Chat", "Open Chat", "mobile-button--chat");
    const badge = document.createElement("span");
    badge.className = "mobile-unread";
    badge.hidden = true;
    chatButton.appendChild(badge);
    toolbar.append(home, title, chatButton);
    document.body.appendChild(toolbar);

    const chatDrawer = makeDrawer("left", "Game Chat", "chat");
    const inspectDrawer = makeDrawer("right", "Unit & Card", "inspect");

    const chatPanel = desktopSidePanels[0]?.querySelector(".chat-panel");
    const selectedPanel = desktopSidePanels[0]?.querySelector(".panel-card:first-child");
    const previewPanel = desktopSidePanels[1]?.querySelector(".panel-card:first-child");
    if (chatPanel) chatDrawer.appendChild(chatPanel);
    if (selectedPanel) inspectDrawer.appendChild(selectedPanel);
    if (previewPanel) inspectDrawer.appendChild(previewPanel);

    home.addEventListener("click", () => $("#exitGameButton")?.click());
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
      const mobileEnd = createButton("End Turn", "End Turn", "mobile-button--end mobile-button--end-wide");
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
      new MutationObserver(() => scheduleMobileBoardLayout())
        .observe(battlefield, { childList: true, subtree: true });
    }

    if (window.ResizeObserver) {
      new ResizeObserver(() => scheduleMobileBoardLayout()).observe(battlefield);
    }
    setTimeout(scheduleMobileBoardLayout, 250);
    setTimeout(scheduleMobileBoardLayout, 900);

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
