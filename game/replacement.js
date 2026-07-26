"use strict";

/*
 * Worlds Under Siege — v13 Replacement and Prevention Engine
 */

const ReplacementTypes = Object.freeze({
  REPLACE: "replace",
  PREVENT: "prevent",
});

let nextReplacementId = 1;

function ensureReplacementState() {
  GameState.replacementEffects ??= [];
  GameState.replacementHistory ??= [];
}

function createReplacementEffect(options = {}) {
  return {
    id: options.id ?? `replacement-${nextReplacementId++}`,
    type: options.type ?? ReplacementTypes.REPLACE,
    priority: Number(options.priority ?? 100),
    source: options.source ?? null,
    controller: options.controller ?? null,
    once: Boolean(options.once),
    active: options.active !== false,
    matches:
      typeof options.matches === "function"
        ? options.matches
        : () => false,
    apply:
      typeof options.apply === "function"
        ? options.apply
        : (event) => event,
    metadata: options.metadata ?? {},
  };
}

function registerReplacementEffect(effectOrOptions) {
  ensureReplacementState();

  const effect =
    effectOrOptions?.id && typeof effectOrOptions.matches === "function"
      ? effectOrOptions
      : createReplacementEffect(effectOrOptions);

  GameState.replacementEffects.push(effect);
  GameState.replacementEffects.sort(
    (first, second) =>
      first.priority - second.priority ||
      String(first.id).localeCompare(String(second.id))
  );

  return effect;
}

function unregisterReplacementEffect(effectId) {
  ensureReplacementState();
  const previousLength = GameState.replacementEffects.length;

  GameState.replacementEffects =
    GameState.replacementEffects.filter((effect) => effect.id !== effectId);

  return GameState.replacementEffects.length !== previousLength;
}

function unregisterReplacementEffectsForSource(source) {
  const sourceId = typeof source === "object" ? source?.id : source;

  GameState.replacementEffects = GameState.replacementEffects.filter(
    (effect) => {
      const effectSourceId =
        typeof effect.source === "object" ? effect.source?.id : effect.source;

      return effectSourceId !== sourceId;
    }
  );
}

function processReplacementEffects(event) {
  ensureReplacementState();

  let currentEvent = event;
  const applied = [];

  for (const effect of [...GameState.replacementEffects]) {
    if (!effect.active || !currentEvent) continue;

    let matches = false;

    try {
      matches = effect.matches(currentEvent, {
        game: GameState,
        effect,
      }) !== false;
    } catch (error) {
      console.error(`Replacement matcher "${effect.id}" failed.`, error);
      continue;
    }

    if (!matches) continue;

    try {
      const result = effect.apply(currentEvent, {
        game: GameState,
        effect,
      });

      applied.push(effect);

      if (effect.type === ReplacementTypes.PREVENT || result === false) {
        currentEvent = null;
      } else if (result && typeof result === "object") {
        currentEvent = {
          ...currentEvent,
          ...result,
          replacementDepth: (currentEvent.replacementDepth ?? 0) + 1,
        };
      }

      if (effect.once) {
        unregisterReplacementEffect(effect.id);
      }
    } catch (error) {
      console.error(`Replacement effect "${effect.id}" failed.`, error);
    }
  }

  const result = {
    event: currentEvent,
    prevented: currentEvent == null,
    applied,
  };

  if (applied.length) {
    GameState.replacementHistory.push({
      originalEventId: event.id,
      finalEventType: currentEvent?.type ?? null,
      prevented: result.prevented,
      effectIds: applied.map((effect) => effect.id),
      timestamp: Date.now(),
    });
  }

  return result;
}

function resetReplacementEngine() {
  GameState.replacementEffects = [];
  GameState.replacementHistory = [];
}

ensureReplacementState();

window.ReplacementTypes = ReplacementTypes;
window.createReplacementEffect = createReplacementEffect;
window.registerReplacementEffect = registerReplacementEffect;
window.unregisterReplacementEffect = unregisterReplacementEffect;
window.unregisterReplacementEffectsForSource =
  unregisterReplacementEffectsForSource;
window.processReplacementEffects = processReplacementEffects;
window.resetReplacementEngine = resetReplacementEngine;
