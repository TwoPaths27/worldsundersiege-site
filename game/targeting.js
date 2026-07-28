/* targeting.js
 * Worlds Under Siege
 * Generic Target Selection Engine (v13 Foundation)
 */
"use strict";

const TargetTypes = Object.freeze({
    CARD: "Card",
    UNIT: "Unit",
    PLAYER: "Player",
    STRONGHOLD: "Stronghold",
    ANY: "Any"
});

if (!GameState.targetRequests) {
    GameState.targetRequests = [];
}

let nextTargetRequestId = 1;

function createTargetRequest(options = {}) {
    return {
        id: options.id ?? ("target-" + nextTargetRequestId++),
        controller: options.controller ?? null,
        source: options.source ?? null,
        types: options.types ?? [TargetTypes.ANY],
        minimum: options.minimum ?? 1,
        maximum: options.maximum ?? 1,
        optional: options.optional ?? false,
        validator: typeof options.validator === "function" ? options.validator : null,
        onComplete: typeof options.onComplete === "function" ? options.onComplete : null,
        selected: []
    };
}

function isValidTarget(request, target) {
    if (!target) return false;
    if (typeof canInteractWithUnit === "function" && !canInteractWithUnit(request?.source, target)) return false;
    if (request.validator) return !!request.validator(target, request);
    if (request.types.includes(TargetTypes.ANY)) return true;
    return request.types.includes(target.cardType) || request.types.includes(target.type);
}

function beginTargetSelection(options = {}) {
    const request = createTargetRequest(options);
    GameState.targetRequests.push(request);

    if (typeof emitGameEvent === "function") {
        emitGameEvent({
            type: "targetSelectionStarted",
            request
        });
    }

    return request;
}

function selectTarget(request, target) {
    if (!isValidTarget(request, target)) return false;

    if (request.selected.some(t => t.id === target.id)) {
        return false;
    }

    request.selected.push(target);

    if (request.selected.length >= request.maximum) {
        if (request.onComplete) {
            request.onComplete(request.selected, request);
        }

        GameState.targetRequests =
            GameState.targetRequests.filter(r => r.id !== request.id);

        if (typeof emitGameEvent === "function") {
            emitGameEvent({
                type: "targetSelectionComplete",
                request
            });
        }
    }

    return true;
}

function cancelTargetSelection(requestId) {
    GameState.targetRequests =
        GameState.targetRequests.filter(r => r.id !== requestId);

    if (typeof emitGameEvent === "function") {
        emitGameEvent({
            type: "targetSelectionCancelled",
            requestId
        });
    }
}

window.TargetTypes = TargetTypes;
window.beginTargetSelection = beginTargetSelection;
window.selectTarget = selectTarget;
window.cancelTargetSelection = cancelTargetSelection;
window.isValidTarget = isValidTarget;
