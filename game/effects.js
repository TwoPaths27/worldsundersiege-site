/* effects.js
 * Worlds Under Siege
 * Continuous Effects / Modifier Engine
 */

"use strict";

/* ============================================================
 * Modifier Layers
 * ============================================================ */

const ModifierLayers = Object.freeze({
    BASE: 0,
    SET: 10,
    EQUIPMENT: 20,
    AURA: 30,
    BUFF: 40,
    DEBUFF: 50,
    STATUS: 60,
    FINAL: 100
});

/* ============================================================
 * Status Types
 * ============================================================ */

const StatusTypes = Object.freeze({
    STUNNED: "stunned",
    POISONED: "poisoned",
    BURNING: "burning",
    FROZEN: "frozen",
    SILENCED: "silenced",
    SHIELDED: "shielded",
    ROOTED: "rooted",
    INVISIBLE: "invisible"
});

if (!window.GameState) {
    throw new Error("GameState must be initialized before effects.js");
}

if (!GameState.continuousEffects) {
    GameState.continuousEffects = [];
}

let nextEffectId = 1;

function generateEffectId() {
    return nextEffectId++;
}

function createContinuousEffect(options = {}) {
    return {
        id: generateEffectId(),
        source: options.source ?? null,
        controller: options.controller ?? null,
        target: options.target ?? null,
        layer: options.layer ?? ModifierLayers.BUFF,
        duration: options.duration ?? "permanent",
        expiresOnTurn: options.expiresOnTurn ?? null,
        expiresOnPhase: options.expiresOnPhase ?? null,
        expiresWithSource: options.expiresWithSource ?? false,
        active: true,
        modifier: options.modifier ?? (() => {}),
        metadata: options.metadata ?? {}
    };
}

function addContinuousEffect(effect) {
    GameState.continuousEffects.push(effect);

    if (typeof emitGameEvent === "function") {
        emitGameEvent({
            type: "continuousEffectAdded",
            effect
        });
    }

    return effect;
}

function removeContinuousEffect(effectId) {
    const index = GameState.continuousEffects.findIndex(e => e.id === effectId);

    if (index < 0) return false;

    const effect = GameState.continuousEffects[index];
    GameState.continuousEffects.splice(index, 1);

    if (typeof emitGameEvent === "function") {
        emitGameEvent({
            type: "continuousEffectRemoved",
            effect
        });
    }

    return true;
}

function createModifierContext(unit) {
    return {
        attack: unit.baseAttack ?? unit.attack ?? 0,
        health: unit.baseHealth ?? unit.health ?? 0,
        movement: unit.baseMovement ?? unit.movement ?? 0,
        keywords: new Set(unit.keywords || [])
    };
}

function applyContinuousEffect(effect, unit, context) {
    if (!effect.active) return;
    if (effect.target !== null && effect.target !== unit.id) return;

    effect.modifier(context, unit);
}

function getModifiedStats(unit) {
    const context = createModifierContext(unit);

    const effects = [...GameState.continuousEffects]
        .filter(e => e.active)
        .sort((a, b) => a.layer - b.layer);

    for (const effect of effects) {
        applyContinuousEffect(effect, unit, context);
    }

    return context;
}

function getCurrentAttack(unit) {
    return getModifiedStats(unit).attack;
}

function getCurrentHealth(unit) {
    return getModifiedStats(unit).health;
}

function getCurrentMovement(unit) {
    return getModifiedStats(unit).movement;
}

function hasKeyword(unit, keyword) {
    return getModifiedStats(unit).keywords.has(keyword);
}

function addStatus(unit, status) {
    if (!unit.statuses) unit.statuses = [];
    unit.statuses.push(status);
}

function removeStatus(unit, statusId) {
    if (!unit.statuses) return;
    unit.statuses = unit.statuses.filter(s => s.id !== statusId);
}

function updateContinuousEffects() {
    GameState.continuousEffects = GameState.continuousEffects.filter(effect => {
        if (!effect.active) return false;

        if (
            effect.expiresOnTurn !== null &&
            GameState.turn > effect.expiresOnTurn
        ) {
            return false;
        }

        if (
            effect.expiresWithSource &&
            typeof findCardById === "function" &&
            !findCardById(effect.source)
        ) {
            return false;
        }

        return true;
    });
}

window.ModifierLayers = ModifierLayers;
window.StatusTypes = StatusTypes;

window.createContinuousEffect = createContinuousEffect;
window.addContinuousEffect = addContinuousEffect;
window.removeContinuousEffect = removeContinuousEffect;

window.getModifiedStats = getModifiedStats;
window.getCurrentAttack = getCurrentAttack;
window.getCurrentHealth = getCurrentHealth;
window.getCurrentMovement = getCurrentMovement;
window.hasKeyword = hasKeyword;

window.addStatus = addStatus;
window.removeStatus = removeStatus;

window.updateContinuousEffects = updateContinuousEffects;
