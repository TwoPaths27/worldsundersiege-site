"use strict";

/*
 * Worlds Under Siege — Module 13 Event and Trigger Engine
 *
 * Provides synchronous, queued game events and data-driven triggered
 * abilities. Core modules emit facts; listeners and abilities react without
 * creating direct dependencies between gameplay systems.
 */

const GameEventListeners = new Map();
const GameTriggerRegistry = new Map();
const GameEventQueue = [];
let isProcessingGameEvents = false;
let nextGameListenerId = 1;
let nextGameTriggerId = 1;

function onGameEvent(eventType, handler, options = {}) {
  if (typeof eventType !== "string" || !eventType.trim()) {
    throw new TypeError("Event type must be a non-empty string.");
  }
  if (typeof handler !== "function") {
    throw new TypeError("Event handler must be a function.");
  }

  const type = eventType.trim();
  const listener = {
    id: `listener-${nextGameListenerId++}`,
    handler,
    once: Boolean(options.once),
    priority: Number(options.priority) || 0,
  };

  const listeners = GameEventListeners.get(type) ?? [];
  listeners.push(listener);
  listeners.sort((a, b) => b.priority - a.priority);
  GameEventListeners.set(type, listeners);

  return () => offGameEvent(type, listener.id);
}

function offGameEvent(eventType, listenerOrId) {
  const listeners = GameEventListeners.get(eventType);
  if (!listeners) return false;

  const id = typeof listenerOrId === "string"
    ? listenerOrId
    : listenerOrId?.id;
  const next = listeners.filter((listener) => listener.id !== id);

  if (next.length) GameEventListeners.set(eventType, next);
  else GameEventListeners.delete(eventType);

  return next.length !== listeners.length;
}

function emitGameEvent(type, payload = {}, options = {}) {
  if (typeof type !== "string" || !type.trim()) {
    throw new TypeError("Event type must be a non-empty string.");
  }

  const event = {
    type: type.trim(),
    payload,
    source: options.source ?? null,
    timestamp: Date.now(),
    cancelled: false,
    stopPropagation: false,
    cancel() { this.cancelled = true; },
    stop() { this.stopPropagation = true; },
  };

  GameEventQueue.push(event);
  processGameEventQueue();
  return event;
}

function processGameEventQueue() {
  if (isProcessingGameEvents) return;
  isProcessingGameEvents = true;

  try {
    while (GameEventQueue.length) {
      const event = GameEventQueue.shift();
      dispatchGameEvent(event);
    }
  } finally {
    isProcessingGameEvents = false;
  }
}

function dispatchGameEvent(event) {
  const listeners = [
    ...(GameEventListeners.get(event.type) ?? []),
    ...(GameEventListeners.get("*") ?? []),
  ];

  for (const listener of listeners) {
    try {
      listener.handler(event);
    } catch (error) {
      console.error(`Game event listener failed for "${event.type}".`, error);
    }

    if (listener.once) {
      offGameEvent(
        GameEventListeners.get(event.type)?.includes(listener) ? event.type : "*",
        listener.id
      );
    }
    if (event.stopPropagation) break;
  }

  processRegisteredTriggers(event);
}

function registerGameTrigger(definition) {
  if (!definition || typeof definition !== "object") {
    throw new TypeError("Trigger definition must be an object.");
  }

  const eventType = definition.event ?? definition.eventType;
  const abilityId = definition.abilityId ?? definition.ability;
  if (!eventType || !abilityId) {
    throw new TypeError("A trigger requires event and abilityId.");
  }

  const trigger = {
    id: definition.id ?? `trigger-${nextGameTriggerId++}`,
    eventType,
    abilityId,
    source: definition.source ?? null,
    owner: definition.owner ?? null,
    once: Boolean(definition.once),
    condition: typeof definition.condition === "function"
      ? definition.condition
      : () => true,
    context: definition.context ?? {},
  };

  GameTriggerRegistry.set(trigger.id, trigger);
  return trigger.id;
}

function unregisterGameTrigger(triggerId) {
  return GameTriggerRegistry.delete(triggerId);
}

function unregisterTriggersForSource(source) {
  let removed = 0;
  for (const [id, trigger] of GameTriggerRegistry) {
    if (trigger.source === source || trigger.source?.id === source?.id) {
      GameTriggerRegistry.delete(id);
      removed += 1;
    }
  }
  return removed;
}

function processRegisteredTriggers(event) {
  for (const trigger of [...GameTriggerRegistry.values()]) {
    if (trigger.eventType !== event.type) continue;

    const context = {
      game: typeof GameState !== "undefined" ? GameState : null,
      event,
      eventType: event.type,
      eventPayload: event.payload,
      source: trigger.source,
      owner: trigger.owner,
      ...trigger.context,
    };

    let eligible = false;
    try {
      eligible = trigger.condition(context) !== false;
    } catch (error) {
      console.error(`Trigger condition failed for "${trigger.id}".`, error);
    }
    if (!eligible) continue;

    if (typeof executeAbility === "function") {
      executeAbility(trigger.abilityId, context);
    }
    if (trigger.once) GameTriggerRegistry.delete(trigger.id);
  }
}

function registerTriggersForSource(source, triggerDefinitions = source?.triggers ?? source?.trigger) {
  if (!triggerDefinitions) return [];
  const definitions = Array.isArray(triggerDefinitions)
    ? triggerDefinitions
    : [triggerDefinitions];

  return definitions.map((definition) => registerGameTrigger({
    ...definition,
    source,
    owner: definition.owner ?? source?.owner ?? null,
  }));
}

/* Compatibility names used by earlier planning and prototype code. */
const emitEvent = emitGameEvent;
const registerTrigger = registerGameTrigger;
const unregisterTrigger = unregisterGameTrigger;
