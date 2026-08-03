(() => {
  "use strict";

  function collectCardImages(cardDatabase) {
    const database = Array.isArray(cardDatabase) ? cardDatabase : [];

    return [...new Set(
      database.flatMap(card => [
        card?.image,
        ...(Array.isArray(card?.forms)
          ? card.forms.map(form => form?.image)
          : [])
      ].filter(Boolean))
    )];
  }

  function getRequiredCardImages() {
    // The unified card database is the canonical source because it includes
    // alternate forms as well as the normal pack-printing artwork.
    if (Array.isArray(window.WUS_CARD_DATABASE) && window.WUS_CARD_DATABASE.length) {
      return collectCardImages(window.WUS_CARD_DATABASE);
    }

    // Compatibility fallback for pages that only load cards.js.
    if (Array.isArray(window.cards) && window.cards.length) {
      return collectCardImages(window.cards);
    }

    if (typeof cards !== "undefined" && Array.isArray(cards) && cards.length) {
      return collectCardImages(cards);
    }

    return [];
  }

  window.WUSAssetManifest = Object.freeze({
    collectCardImages,
    getRequiredCardImages
  });
})();
