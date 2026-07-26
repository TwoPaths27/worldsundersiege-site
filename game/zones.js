/* zones.js
 * Worlds Under Siege
 * Zone Management Engine (v13 Foundation)
 */

"use strict";

const ZoneTypes = Object.freeze({
    DECK: "deck",
    HAND: "hand",
    STACK: "stack",
    BATTLEFIELD: "battlefield",
    DISCARD: "discard",
    EXILE: "exile"
});

function ensureZones() {
    if (!GameState.zones) {
        GameState.zones = {
            deck: [],
            hand: [],
            stack: [],
            battlefield: [],
            discard: [],
            exile: []
        };
    }
}

ensureZones();

function getZone(zoneName) {
    return GameState.zones[zoneName] || null;
}

function removeFromZone(cardId, zoneName) {
    const zone = getZone(zoneName);
    if (!zone) return null;

    const idx = zone.findIndex(c => c.id === cardId);
    if (idx < 0) return null;

    return zone.splice(idx, 1)[0];
}

function addToZone(card, zoneName) {
    const zone = getZone(zoneName);
    if (!zone) return false;
    zone.push(card);
    return true;
}

function moveCard(card, options = {}) {
    const from = options.from;
    const to = options.to;
    const reason = options.reason || "move";

    if (!card || !from || !to) return false;
    if (from === to) return true;

    const removed = removeFromZone(card.id, from);
    if (!removed) return false;

    addToZone(removed, to);

    removed.zone = to;

    if (typeof emitGameEvent === "function") {
        emitGameEvent({
            type: "cardMoved",
            card: removed,
            from,
            to,
            reason
        });

        emitGameEvent({
            type: "leftZone",
            card: removed,
            zone: from
        });

        emitGameEvent({
            type: "enteredZone",
            card: removed,
            zone: to
        });
    }

    return true;
}

function discardCard(card, from) {
    return moveCard(card, {
        from,
        to: ZoneTypes.DISCARD,
        reason: "discard"
    });
}

function exileCard(card, from) {
    return moveCard(card, {
        from,
        to: ZoneTypes.EXILE,
        reason: "exile"
    });
}

function returnCardToHand(card, from) {
    return moveCard(card, {
        from,
        to: ZoneTypes.HAND,
        reason: "return"
    });
}

window.ZoneTypes = ZoneTypes;
window.moveCard = moveCard;
window.discardCard = discardCard;
window.exileCard = exileCard;
window.returnCardToHand = returnCardToHand;
window.getZone = getZone;
