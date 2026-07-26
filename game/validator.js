"use strict";

/* Development-time validators. They warn instead of interrupting play. */
function validatePermanent(permanent) {
  const errors = [];
  if (!permanent || typeof permanent !== "object") return { valid: false, errors: ["Permanent is not an object."] };
  if (!permanent.id) errors.push("Missing id.");
  if (!permanent.name) errors.push("Missing name.");
  if (!isPermanent(permanent)) errors.push("Card does not have a permanent type.");
  if (!getCardTypes(permanent).length) errors.push("Missing types.");
  if (permanent.controller == null && permanent.owner == null) errors.push("Missing owner/controller.");
  errors.push(...validatePermanentState(permanent));
  return { valid: errors.length === 0, errors };
}


function validatePermanentState(permanent) {
  const state = permanent?.permanentState;
  if (!state) {
    return ["Missing permanentState."];
  }

  const errors = [];
  if (typeof state.registered !== "boolean") {
    errors.push("permanentState.registered must be boolean.");
  }
  if (typeof state.entering !== "boolean") {
    errors.push("permanentState.entering must be boolean.");
  }
  if (typeof state.leaving !== "boolean") {
    errors.push("permanentState.leaving must be boolean.");
  }
  return errors;
}


function validateEventState() {
  const errors = [];
  const slots = GameState.playerEvents || {};
  for (const playerId of [1, 2]) {
    const event = slots[playerId];
    if (event && !isEvent(event)) errors.push(`Player ${playerId} Event slot contains a non-Event.`);
  }
  return { valid: errors.length === 0, errors };
}

function reportValidation(result, label = "Validation") {
  if (!result.valid) console.warn(`${label} failed:`, result.errors);
  return result.valid;
}
