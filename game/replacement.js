/* replacement.js
 * Worlds Under Siege
 * Replacement & Prevention Engine (v13 Foundation)
 */
"use strict";

const ReplacementTypes = Object.freeze({
    REPLACE: "replace",
    PREVENT: "prevent"
});

if (!window.GameState.replacementEffects) {
    GameState.replacementEffects = [];
}

let nextReplacementId = 1;

function createReplacementEffect(options = {}) {
    return {
        id: options.id ?? ("replacement-" + nextReplacementId++),
        type: options.type ?? ReplacementTypes.REPLACE,
        priority: options.priority ?? 100,
        source: options.source ?? null,
        active: options.active ?? true,
        matches: typeof options.matches === "function" ? options.matches : (() => false),
        apply: typeof options.apply === "function" ? options.apply : (event => event),
        metadata: options.metadata ?? {}
    };
}

function registerReplacementEffect(effect) {
    GameState.replacementEffects.push(effect);
    GameState.replacementEffects.sort((a,b)=>a.priority-b.priority);
    return effect;
}

function unregisterReplacementEffect(id) {
    GameState.replacementEffects =
        GameState.replacementEffects.filter(e => e.id !== id);
}

function processReplacementEffects(event) {
    let current = event;

    for (const effect of GameState.replacementEffects) {
        if (!effect.active) continue;
        if (!effect.matches(current)) continue;

        if (effect.type === ReplacementTypes.PREVENT) {
            if (effect.apply(current) === false) {
                if (typeof emitGameEvent === "function") {
                    emitGameEvent({
                        type: "eventPrevented",
                        originalEvent: event,
                        effect
                    });
                }
                return null;
            }
            continue;
        }

        const updated = effect.apply(current);

        if (updated) {
            current = updated;
        }

        if (typeof emitGameEvent === "function") {
            emitGameEvent({
                type: "eventReplaced",
                originalEvent: event,
                newEvent: current,
                effect
            });
        }
    }

    return current;
}

window.ReplacementTypes = ReplacementTypes;
window.createReplacementEffect = createReplacementEffect;
window.registerReplacementEffect = registerReplacementEffect;
window.unregisterReplacementEffect = unregisterReplacementEffect;
window.processReplacementEffects = processReplacementEffects;
