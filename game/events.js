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
let nextGameEventId = 1;
let nextGameListenerId = 1;
let nextGameTriggerId = 1;
const RegisteredTriggerIdsBySource = new Map();

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
    id: `event-${nextGameEventId++}`,
    type: type.trim(),
    payload,
    source: options.source ?? null,
    timestamp: Date.now(),
    queuedAt: Date.now(),
    dispatchedAt: null,
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
  event.dispatchedAt = Date.now();

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


function queueGameEvent(type, payload = {}, options = {}) {
  return emitGameEvent(type, payload, options);
}

function isGameEventQueueProcessing() {
  return isProcessingGameEvents;
}

function getPendingGameEvents() {
  return GameEventQueue.map((event) => ({
    id: event.id,
    type: event.type,
    source: event.source,
    timestamp: event.timestamp,
  }));
}


function getTriggerSourceKey(source) {
  if (!source) return null;

  if (typeof source === "string" || typeof source === "number") {
    return String(source);
  }

  return source.id ??
    source.instanceId ??
    source.cardId ??
    source.databaseId ??
    null;
}

function normalizeTriggerDefinitions(definitions) {
  if (!definitions) return [];

  return (Array.isArray(definitions) ? definitions : [definitions])
    .filter((definition) => definition && typeof definition === "object");
}

function getTriggerDefinitionsForSource(source, suppliedDefinitions = null) {
  if (suppliedDefinitions) {
    return normalizeTriggerDefinitions(suppliedDefinitions);
  }

  const sourceDefinitions =
    source?.triggers ??
    source?.trigger ??
    [];

  const abilityDefinitions =
    typeof getAbilityTriggerDefinitions === "function"
      ? getAbilityTriggerDefinitions(source)
      : [];

  return [
    ...normalizeTriggerDefinitions(sourceDefinitions),
    ...normalizeTriggerDefinitions(abilityDefinitions),
  ];
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

  if (GameTriggerRegistry.has(trigger.id)) {
    throw new Error(`A trigger with id "${trigger.id}" is already registered.`);
  }

  GameTriggerRegistry.set(trigger.id, trigger);
  return trigger.id;
}

function unregisterGameTrigger(triggerId) {
  return GameTriggerRegistry.delete(triggerId);
}

function unregisterTriggersForSource(source) {
  const sourceKey = getTriggerSourceKey(source);
  const trackedIds = sourceKey
    ? RegisteredTriggerIdsBySource.get(sourceKey) ?? []
    : [];

  let removed = 0;

  for (const id of trackedIds) {
    if (GameTriggerRegistry.delete(id)) {
      removed += 1;
    }
  }

  /*
   * Keep the fallback scan for sources registered before tracking was added,
   * or for source objects without a stable ID.
   */
  for (const [id, trigger] of [...GameTriggerRegistry]) {
    if (
      trigger.source === source ||
      (
        sourceKey &&
        getTriggerSourceKey(trigger.source) === sourceKey
      )
    ) {
      GameTriggerRegistry.delete(id);
      removed += 1;
    }
  }

  if (sourceKey) {
    RegisteredTriggerIdsBySource.delete(sourceKey);
  }

  return removed;
}

function processRegisteredTriggers(event) {
  for (const trigger of [...GameTriggerRegistry.values()]) {
    if (trigger.eventType !== event.type) continue;

    const owner = trigger.owner ?? trigger.source?.owner ?? null;
    const context = {
      game: typeof GameState !== "undefined" ? GameState : null,
      event,
      eventType: event.type,
      eventPayload: event.payload,
      source: trigger.source,
      card: trigger.source?.cardType === "Action"
        ? trigger.source
        : null,
      owner,
      playerId: owner,
      player:
        owner && typeof GameState !== "undefined"
          ? GameState.players?.[owner] ?? null
          : null,
      opponent:
        owner && typeof GameState !== "undefined"
          ? GameState.players?.[owner === 1 ? 2 : 1] ?? null
          : null,
      user: trigger.context?.user ?? trigger.source?.unit ?? null,
      target: trigger.context?.target ?? null,
      trigger,
      ...trigger.context,
    };

    let eligible = false;
    try {
      eligible = trigger.condition(context) !== false;
    } catch (error) {
      console.error(`Trigger condition failed for "${trigger.id}".`, error);
    }
    if (!eligible) continue;

    let stackEntry = null;

    if (typeof queueTriggeredAbility === "function") {
      stackEntry = queueTriggeredAbility({
        trigger,
        context,
        originalEvent: event,
      });
    } else {
      console.warn(
        `Trigger "${trigger.id}" could not enter the stack because ` +
        "queueTriggeredAbility() is unavailable."
      );
    }

    emitGameEvent(
      "triggerQueued",
      {
        triggerId: trigger.id,
        abilityId: trigger.abilityId,
        source: trigger.source,
        originalEvent: event,
        stackEntry,
      },
      { source: trigger.source }
    );

    if (trigger.once && stackEntry) {
      unregisterGameTrigger(trigger.id);
    }
  }
}

function registerTriggersForSource(
  source,
  triggerDefinitions = null
) {
  const definitions = getTriggerDefinitionsForSource(
    source,
    triggerDefinitions
  );

  if (!definitions.length) {
    return [];
  }

  const sourceKey = getTriggerSourceKey(source);

  /*
   * Re-registering a source should replace its old trigger records instead of
   * causing the same trigger to fire multiple times.
   */
  if (sourceKey && RegisteredTriggerIdsBySource.has(sourceKey)) {
    unregisterTriggersForSource(source);
  }

  const registeredIds = definitions.map((definition, index) => {
    const explicitId = definition.id;
    const generatedId =
      sourceKey
        ? `${sourceKey}:trigger:${index + 1}`
        : undefined;

    return registerGameTrigger({
      ...definition,
      id: explicitId ?? generatedId,
      source,
      owner: definition.owner ?? source?.owner ?? null,
    });
  });

  if (sourceKey) {
    RegisteredTriggerIdsBySource.set(sourceKey, registeredIds);
  }

  return registeredIds;
}

function getRegisteredTriggersForSource(source) {
  const sourceKey = getTriggerSourceKey(source);

  if (!sourceKey) {
    return [];
  }

  const ids = RegisteredTriggerIdsBySource.get(sourceKey) ?? [];

  return ids
    .map((id) => GameTriggerRegistry.get(id))
    .filter(Boolean);
}

/* Compatibility names used by earlier planning and prototype code. */
const emitEvent = emitGameEvent;
const queueEvent = queueGameEvent;
const registerTrigger = registerGameTrigger;
const unregisterTrigger = unregisterGameTrigger;
