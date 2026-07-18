(() => {
  "use strict";

  const CACHE_NAME = "wus-card-images-boa-v1";
  const VERSION_KEY = "wus-card-image-pack-version";
  const VERSION = "BOA-1.0";
  const objectUrls = new Map();

  function absoluteUrl(path) {
    return new URL(path, window.location.href).href;
  }

  async function openCache() {
    if (!("caches" in window)) throw new Error("This browser does not support image caching.");
    return caches.open(CACHE_NAME);
  }

  async function match(path) {
    const cache = await openCache();
    return cache.match(absoluteUrl(path));
  }

  async function fetchAndCache(path, force = false) {
    const url = absoluteUrl(path);
    const cache = await openCache();
    if (!force) {
      const existing = await cache.match(url);
      if (existing) return existing;
    }

    const response = await fetch(url, { cache: force ? "reload" : "default" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    await cache.put(url, response.clone());
    return response;
  }

  async function getObjectUrl(path) {
    const url = absoluteUrl(path);
    if (objectUrls.has(url)) return objectUrls.get(url);

    let response = await match(path);
    if (!response) response = await fetchAndCache(path);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.set(url, objectUrl);
    return objectUrl;
  }

  async function getStatus(paths) {
    const cache = await openCache();
    let installed = 0;
    for (const path of paths) {
      if (await cache.match(absoluteUrl(path))) installed += 1;
    }
    return {
      installed,
      total: paths.length,
      complete: installed === paths.length,
      version: localStorage.getItem(VERSION_KEY) || null
    };
  }

  async function install(paths, { force = false, onProgress } = {}) {
    const uniquePaths = [...new Set(paths)];
    let completed = 0;
    const failed = [];

    // A small worker pool avoids launching 227 full-resolution downloads at once.
    const queue = [...uniquePaths];
    const workers = Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const path = queue.shift();
        try {
          await fetchAndCache(path, force);
        } catch (error) {
          failed.push({ path, error: error.message });
        }
        completed += 1;
        onProgress?.({ completed, total: uniquePaths.length, failed: failed.length, path });
      }
    });

    await Promise.all(workers);
    if (failed.length === 0) localStorage.setItem(VERSION_KEY, VERSION);
    return { completed, total: uniquePaths.length, failed, version: VERSION };
  }

  async function clear() {
    objectUrls.forEach(value => URL.revokeObjectURL(value));
    objectUrls.clear();
    await caches.delete(CACHE_NAME);
    localStorage.removeItem(VERSION_KEY);
  }

  window.WUSAssets = {
    CACHE_NAME,
    VERSION,
    getObjectUrl,
    getStatus,
    install,
    clear,
    absoluteUrl
  };
})();
