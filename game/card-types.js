"use strict";

/*
 * Worlds Under Siege — Card Type, Trait, and Capability Architecture (v14)
 *
 * This module is intentionally dependency-free and loads before game-state.js.
 * It accepts legacy single-type cards while exposing normalized multi-type,
 * trait, and capability APIs for the rest of the engine.
 */

const CardTypes = Object.freeze({
  CHARACTER: "Character",
  ARMY: "Army",
  ANIMAL: "Animal",
  CONSTRUCT: "Construct",
  ITEM: "Item",
  EVENT: "Event",
  ACTION: "Action",
  STRONGHOLD: "Stronghold",
  UNIT: "Unit", // legacy/generic Unit type retained for compatibility
});

const CardCapabilities = Object.freeze({
  ATTACK: "attack",
  USE_ACTIONS: "useActions",
  EQUIP_ITEMS: "equipItems",
  OPERATE_CONSTRUCTS: "operateConstructs",
});

const UNIT_CARD_TYPES = new Set([
  CardTypes.CHARACTER,
  CardTypes.ARMY,
  CardTypes.ANIMAL,
  CardTypes.UNIT,
]);

const DEFAULT_CAPABILITIES_BY_TYPE = Object.freeze({
  [CardTypes.CHARACTER]: Object.freeze({
    [CardCapabilities.ATTACK]: true,
    [CardCapabilities.USE_ACTIONS]: true,
    [CardCapabilities.EQUIP_ITEMS]: true,
    [CardCapabilities.OPERATE_CONSTRUCTS]: true,
  }),
  [CardTypes.ARMY]: Object.freeze({
    [CardCapabilities.ATTACK]: true,
    [CardCapabilities.USE_ACTIONS]: false,
    [CardCapabilities.EQUIP_ITEMS]: false,
    [CardCapabilities.OPERATE_CONSTRUCTS]: false,
  }),
  [CardTypes.ANIMAL]: Object.freeze({
    [CardCapabilities.ATTACK]: true,
    [CardCapabilities.USE_ACTIONS]: false,
    [CardCapabilities.EQUIP_ITEMS]: false,
    [CardCapabilities.OPERATE_CONSTRUCTS]: false,
  }),
  [CardTypes.UNIT]: Object.freeze({
    [CardCapabilities.ATTACK]: true,
    [CardCapabilities.USE_ACTIONS]: false,
    [CardCapabilities.EQUIP_ITEMS]: false,
    [CardCapabilities.OPERATE_CONSTRUCTS]: false,
  }),
  [CardTypes.CONSTRUCT]: Object.freeze({
    [CardCapabilities.ATTACK]: false,
    [CardCapabilities.USE_ACTIONS]: false,
    [CardCapabilities.EQUIP_ITEMS]: false,
    [CardCapabilities.OPERATE_CONSTRUCTS]: false,
  }),
});

function normalizeStringCollection(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return [...new Set(values.filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean))];
}

function getCardTypes(card) {
  if (!card || typeof card !== "object") return [];
  const types = normalizeStringCollection(card.types);
  if (typeof card.type === "string" && card.type.trim()) {
    types.unshift(card.type.trim());
  }
  return [...new Set(types)];
}

function getDefaultCapabilities(card) {
  const defaults = {};
  for (const type of getCardTypes(card)) {
    Object.assign(defaults, DEFAULT_CAPABILITIES_BY_TYPE[type] ?? {});
  }
  return defaults;
}

function normalizeCard(card) {
  if (!card || typeof card !== "object") return card;

  card.types = getCardTypes(card);
  if (!card.type && card.types.length) card.type = card.types[0];
  card.traits = normalizeStringCollection(card.traits ?? card.trait);
  card.characteristics = normalizeStringCollection(card.characteristics);

  const explicit = card.capabilities && typeof card.capabilities === "object"
    ? card.capabilities
    : {};
  card.capabilities = { ...getDefaultCapabilities(card), ...explicit };

  if (!card.capabilityOverrides || typeof card.capabilityOverrides !== "object") {
    card.capabilityOverrides = {};
  }

  return card;
}

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return cards;
  cards.forEach(normalizeCard);
  return cards;
}

function hasType(card, type) {
  return getCardTypes(card).includes(type);
}

function isCharacter(card) { return hasType(card, CardTypes.CHARACTER); }
function isArmy(card) { return hasType(card, CardTypes.ARMY); }
function isAnimal(card) { return hasType(card, CardTypes.ANIMAL); }
function isConstruct(card) { return hasType(card, CardTypes.CONSTRUCT); }
function isItem(card) { return hasType(card, CardTypes.ITEM); }
function isEvent(card) { return hasType(card, CardTypes.EVENT); }
function isAction(card) { return hasType(card, CardTypes.ACTION); }
function isStronghold(card) { return hasType(card, CardTypes.STRONGHOLD); }
function isUnit(card) {
  return getCardTypes(card).some((type) => UNIT_CARD_TYPES.has(type));
}

function getTraits(card) {
  return normalizeStringCollection(card?.traits ?? card?.trait);
}

function hasTrait(card, trait) {
  return getTraits(card).includes(trait);
}

function getCharacteristics(card) {
  return normalizeStringCollection(card?.characteristics);
}

function hasCharacteristic(card, characteristic) {
  const requested = String(characteristic ?? "").trim().toLowerCase();
  if (!requested) return false;
  return getCharacteristics(card).some(
    (value) => value.toLowerCase() === requested
  );
}

function addTrait(card, trait) {
  if (!card || typeof card !== "object" || typeof trait !== "string" || !trait.trim()) return false;
  normalizeCard(card);
  if (!card.traits.includes(trait.trim())) card.traits.push(trait.trim());
  return true;
}

function removeTrait(card, trait) {
  if (!card || typeof card !== "object") return false;
  normalizeCard(card);
  const before = card.traits.length;
  card.traits = card.traits.filter((entry) => entry !== trait);
  return card.traits.length !== before;
}

function getCapability(card, capability) {
  if (!card || typeof card !== "object") return false;
  normalizeCard(card);
  if (Object.prototype.hasOwnProperty.call(card.capabilityOverrides, capability)) {
    return Boolean(card.capabilityOverrides[capability]);
  }
  return Boolean(card.capabilities[capability]);
}

function grantCapability(card, capability) {
  if (!card || typeof card !== "object") return false;
  normalizeCard(card);
  card.capabilityOverrides[capability] = true;
  return true;
}

function revokeCapability(card, capability) {
  if (!card || typeof card !== "object") return false;
  normalizeCard(card);
  card.capabilityOverrides[capability] = false;
  return true;
}

function clearCapabilityOverride(card, capability) {
  if (!card?.capabilityOverrides) return false;
  return delete card.capabilityOverrides[capability];
}

function canAttack(card) { return getCapability(card, CardCapabilities.ATTACK); }
function canUseActions(card) { return getCapability(card, CardCapabilities.USE_ACTIONS); }
function canEquipItems(card) { return getCapability(card, CardCapabilities.EQUIP_ITEMS); }
function canOperateConstructs(card) { return getCapability(card, CardCapabilities.OPERATE_CONSTRUCTS); }

function isBattlefieldCard(card) {
  return isUnit(card) || isConstruct(card);
}

function getItemAttachmentRule(item) {
  if (!item || !isItem(item)) return null;
  const rule = item.attachmentRule && typeof item.attachmentRule === "object"
    ? item.attachmentRule
    : {};
  return {
    controllerOnly: rule.controllerOnly !== false,
    // Characters may carry any number of Items unless a specific Item explicitly sets a limit.
    maxPerHost: rule.maxPerHost == null ? Number.POSITIVE_INFINITY : Math.max(1, Number(rule.maxPerHost)),
    requiresTypes: normalizeStringCollection(rule.requiresTypes),
    requiresTraits: normalizeStringCollection(rule.requiresTraits),
    excludesTypes: normalizeStringCollection(rule.excludesTypes),
    canAttach: typeof rule.canAttach === "function" ? rule.canAttach : null,
  };
}

function itemCanAttachTo(item, host, context = {}) {
  if (!isItem(item) || !host || !isBattlefieldCard(host)) return false;
  const rule = getItemAttachmentRule(item);
  if (!rule) return false;
  if (rule.controllerOnly && item.owner != null && host.owner !== item.owner) return false;
  if (!canEquipItems(host) && !rule.requiresTypes.length && !rule.requiresTraits.length) return false;
  if (rule.requiresTypes.length && !rule.requiresTypes.some((type) => hasType(host, type))) return false;
  if (rule.requiresTraits.length && !rule.requiresTraits.every((trait) => hasTrait(host, trait))) return false;
  if (rule.excludesTypes.some((type) => hasType(host, type))) return false;
  return rule.canAttach ? rule.canAttach(item, host, context) !== false : true;
}

function canBeConstructOperator(card) {
  return isCharacter(card) && canOperateConstructs(card);
}
