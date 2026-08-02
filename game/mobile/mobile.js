(() => {
  "use strict";

  const state = {
    scale: 0.72,
    x: 0,
    y: 0,
    minScale: 0.7,
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
    lastTappedToken: null,
  };

  const $ = (sel, root = document) => root.querySelector(sel);

  function createButton(label, title, extra = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mobile-button ${extra}`.trim();
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    return button;
  }

  function applyTransform(stage) {
    stage.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
  }

  function centerBoard(camera, stage, scale = null) {
    if (Number.isFinite(scale)) state.scale = Math.max(state.minScale, Math.min(state.maxScale, scale));
    const sw = stage.offsetWidth || 1080;
    const sh = stage.offsetHeight || 900;
    state.x = (camera.clientWidth - sw * state.scale) / 2;
    state.y = (camera.clientHeight - sh * state.scale) / 2;
    applyTransform(stage);
  }

  function fitBoard(camera, stage) {
    // The mobile stage is authored directly in viewport CSS pixels. Start at
    // true size instead of shrinking the desktop stage to fit its old bounds.
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    applyTransform(stage);
  }

  function distance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function midpoint(a, b) {
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  }

  function installCamera(stage) {
    const camera = document.createElement("div");
    camera.className = "mobile-camera";
    stage.parentNode.insertBefore(camera, stage);
    camera.appendChild(stage);

    camera.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button, input, textarea, select, .unit-token, .battlefield-cell")) return;
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
        const oldScale = state.scale;
        const nextScale = Math.max(state.minScale, Math.min(state.maxScale,
          state.startScale * (newDistance / Math.max(1, state.startDistance))));
        const localX = (state.startCenter.x - state.startX) / oldScale;
        const localY = (state.startCenter.y - state.startY) / oldScale;
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

  function makeDrawer(side, title) {
    const drawer = document.createElement("aside");
    drawer.className = `mobile-drawer mobile-drawer--${side}`;
    drawer.innerHTML = `<div class="mobile-drawer__header"><h2>${title}</h2><button type="button" class="mobile-button" data-close-drawer>×</button></div>`;
    document.body.appendChild(drawer);
    drawer.querySelector("[data-close-drawer]").addEventListener("click", () => closeDrawers());
    return drawer;
  }

  function closeDrawers() {
    document.querySelectorAll(".mobile-drawer.is-open").forEach(el => el.classList.remove("is-open"));
    $(".mobile-backdrop")?.remove();
    state.chatOpen = false;
    state.inspectOpen = false;
  }

  function openDrawer(drawer, kind) {
    closeDrawers();
    const backdrop = document.createElement("div");
    backdrop.className = "mobile-backdrop";
    backdrop.addEventListener("click", closeDrawers);
    document.body.appendChild(backdrop);
    drawer.classList.add("is-open");
    if (kind === "chat") state.chatOpen = true;
    if (kind === "inspect") state.inspectOpen = true;
  }

  function showCardArt(unitToken) {
    const imageUrl = unitToken?.style?.backgroundImage?.match(/url\(["']?(.*?)["']?\)/)?.[1]
      || unitToken?.querySelector("img")?.src
      || unitToken?.dataset?.cardImage;
    if (!imageUrl) return;
    const modal = document.createElement("div");
    modal.className = "mobile-card-modal";
    modal.innerHTML = `<button class="mobile-card-modal__close" type="button">×</button><img alt="Expanded card">`;
    modal.querySelector("img").src = imageUrl;
    modal.querySelector("button").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  function installExpandPrompt() {
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

  function initializeMobile() {
    if (new URLSearchParams(location.search).get("desktop") === "1") {
      location.replace("../" + location.search.replace(/([?&])desktop=1(&|$)/, "$1").replace(/[?&]$/, ""));
      return;
    }

    document.body.classList.add("mobile-battle");
    const stage = $(".battlefield-stage");
    const desktopSidePanels = [...document.querySelectorAll(".game-layout > .side-panel")];
    if (!stage || desktopSidePanels.length < 2) throw new Error("Mobile UI could not find the shared desktop battlefield DOM.");

    const camera = installCamera(stage);
    const toolbar = document.createElement("nav");
    toolbar.className = "mobile-toolbar";
    const home = createButton("✕", "Exit Match");
    const title = document.createElement("div");
    title.className = "mobile-toolbar__title";
    title.textContent = "Worlds Under Siege";
    const chatButton = createButton("Chat", "Open Chat", "mobile-chat-button");
    const badge = document.createElement("span");
    badge.className = "mobile-unread";
    badge.hidden = true;
    chatButton.appendChild(badge);
    toolbar.append(home, title, chatButton);
    document.body.appendChild(toolbar);

    const chatDrawer = makeDrawer("left", "Game Chat");
    const inspectDrawer = makeDrawer("right", "Unit & Card");
    const chatPanel = desktopSidePanels[0].querySelector(".chat-panel");
    const selectedPanel = desktopSidePanels[0].querySelector(".panel-card:first-child");
    const previewPanel = desktopSidePanels[1].querySelector(".panel-card:first-child");
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

    // Mirror the real End Turn button in the top toolbar without moving it.
    const desktopEnd = $("#endTurnButton");
    if (desktopEnd) {
      const mobileEnd = createButton("End Turn", "End Turn", "mobile-button--end");
      mobileEnd.addEventListener("click", () => desktopEnd.click());
      toolbar.appendChild(mobileEnd);
      new MutationObserver(() => { mobileEnd.disabled = desktopEnd.disabled; })
        .observe(desktopEnd, { attributes: true, attributeFilter: ["disabled"] });
    }

    installExpandPrompt();
    console.info("[Mobile] Separate mobile UI initialized. Desktop route remains unchanged.");
  }

  function boot() {
    try {
      initializeMobile();
    } catch (error) {
      console.error("[Mobile] Enhancement failed; preserving shared desktop UI as fallback.", error);
      document.body.classList.remove("mobile-battle");
      const notice = document.createElement("div");
      notice.style.cssText = "position:fixed;z-index:20000;left:10px;right:10px;top:10px;padding:12px;background:#5a1c1c;color:white;border:1px solid #ff8b8b;border-radius:10px";
      notice.textContent = "Mobile controls could not start. The standard game interface has been preserved. Refresh or use /game/ on this device.";
      document.body.appendChild(notice);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
