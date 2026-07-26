/* costs.js
 * Worlds Under Siege
 * Cost Payment and Resolution Transaction Engine (v13 Foundation)
 */

"use strict";

/* ============================================================
 * Cost Types
 * ============================================================ */

const CostTypes = Object.freeze({
    RESOURCE: "resource",
    HEALTH: "health",
    DISCARD: "discard",
    SACRIFICE: "sacrifice",
    EXHAUST: "exhaust",
    CUSTOM: "custom"
});

let nextTransactionId = 1;

/* ============================================================
 * Utilities
 * ============================================================ */

function getPlayerById(playerId) {
    if (!window.GameState) return null;

    if (Array.isArray(GameState.players)) {
        return GameState.players.find(player => player?.id === playerId) || null;
    }

    if (GameState.player?.id === playerId) return GameState.player;
    if (GameState.opponent?.id === playerId) return GameState.opponent;

    return null;
}

function cloneSerializable(value) {
    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        } catch (error) {
            // Fall through to JSON cloning for plain game-state data.
        }
    }

    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return value;
    }
}

function emitCostEvent(type, payload = {}) {
    if (typeof emitGameEvent !== "function") return;

    emitGameEvent({
        type,
        ...payload
    });
}

/* ============================================================
 * Cost Normalization
 * ============================================================ */

function normalizeCost(cost) {
    if (!cost || typeof cost !== "object") {
        throw new TypeError("A cost must be an object.");
    }

    if (!cost.type) {
        throw new Error("A cost requires a type.");
    }

    return {
        type: cost.type,
        amount: Math.max(0, Number(cost.amount ?? 1)),
        resource: cost.resource ?? "resources",
        playerId: cost.playerId ?? null,
        card: cost.card ?? null,
        cardId: cost.cardId ?? cost.card?.id ?? null,
        unit: cost.unit ?? null,
        unitId: cost.unitId ?? cost.unit?.id ?? null,
        zone: cost.zone ?? null,
        selector: typeof cost.selector === "function" ? cost.selector : null,
        canPay: typeof cost.canPay === "function" ? cost.canPay : null,
        pay: typeof cost.pay === "function" ? cost.pay : null,
        refund: typeof cost.refund === "function" ? cost.refund : null,
        metadata: cost.metadata ?? {}
    };
}

function normalizeCosts(costs) {
    if (!costs) return [];
    return (Array.isArray(costs) ? costs : [costs]).map(normalizeCost);
}

/* ============================================================
 * Cost Validation
 * ============================================================ */

function canPayResourceCost(cost, context) {
    const player = getPlayerById(cost.playerId ?? context.playerId);
    if (!player) return false;

    const current = Number(player[cost.resource] ?? 0);
    return current >= cost.amount;
}

function canPayHealthCost(cost, context) {
    const player = getPlayerById(cost.playerId ?? context.playerId);
    if (!player) return false;

    const health = Number(player.health ?? 0);
    return health > cost.amount;
}

function findCardForCost(cost, context) {
    if (cost.card) return cost.card;

    const cardId = cost.cardId;
    if (!cardId) return null;

    if (Array.isArray(context.cards)) {
        const found = context.cards.find(card => card?.id === cardId);
        if (found) return found;
    }

    const zones = GameState?.zones;
    if (zones) {
        for (const zone of Object.values(zones)) {
            if (!Array.isArray(zone)) continue;
            const found = zone.find(card => card?.id === cardId);
            if (found) return found;
        }
    }

    return null;
}

function findUnitForCost(cost, context) {
    if (cost.unit) return cost.unit;

    const unitId = cost.unitId;
    if (!unitId) return null;

    if (Array.isArray(context.units)) {
        const found = context.units.find(unit => unit?.id === unitId);
        if (found) return found;
    }

    if (Array.isArray(GameState?.units)) {
        return GameState.units.find(unit => unit?.id === unitId) || null;
    }

    return null;
}

function canPayDiscardCost(cost, context) {
    const card = findCardForCost(cost, context);
    if (!card) return false;

    if (cost.selector && !cost.selector(card, context)) return false;

    const expectedZone = cost.zone ?? "hand";
    return !card.zone || card.zone === expectedZone;
}

function canPaySacrificeCost(cost, context) {
    const unit = findUnitForCost(cost, context);
    if (!unit) return false;

    if (cost.selector && !cost.selector(unit, context)) return false;

    return unit.zone === undefined || unit.zone === "battlefield";
}

function canPayExhaustCost(cost, context) {
    const unit = findUnitForCost(cost, context);
    if (!unit) return false;

    if (cost.selector && !cost.selector(unit, context)) return false;

    return !unit.exhausted;
}

function canPayCost(costInput, context = {}) {
    const cost = normalizeCost(costInput);

    if (cost.canPay) {
        return Boolean(cost.canPay(cost, context));
    }

    switch (cost.type) {
        case CostTypes.RESOURCE:
            return canPayResourceCost(cost, context);

        case CostTypes.HEALTH:
            return canPayHealthCost(cost, context);

        case CostTypes.DISCARD:
            return canPayDiscardCost(cost, context);

        case CostTypes.SACRIFICE:
            return canPaySacrificeCost(cost, context);

        case CostTypes.EXHAUST:
            return canPayExhaustCost(cost, context);

        case CostTypes.CUSTOM:
            return typeof cost.pay === "function";

        default:
            console.warn("Unknown cost type:", cost.type);
            return false;
    }
}

function canPayCosts(costs, context = {}) {
    const normalized = normalizeCosts(costs);
    return normalized.every(cost => canPayCost(cost, context));
}

/* ============================================================
 * Resolution Transactions
 * ============================================================ */

function createResolutionTransaction(options = {}) {
    const transaction = {
        id: options.id ?? `transaction-${nextTransactionId++}`,
        label: options.label ?? "Resolution Transaction",
        source: options.source ?? null,
        controller: options.controller ?? null,
        context: options.context ?? {},
        status: "pending",
        steps: [],
        completedSteps: [],
        error: null,
        createdAt: Date.now(),

        addStep(step) {
            if (!step || typeof step.apply !== "function") {
                throw new TypeError("Transaction steps require an apply() function.");
            }

            this.steps.push({
                label: step.label ?? `Step ${this.steps.length + 1}`,
                apply: step.apply,
                rollback: typeof step.rollback === "function" ? step.rollback : null,
                snapshot: step.snapshot ?? null,
                result: undefined
            });

            return this;
        },

        async commit() {
            if (this.status !== "pending") {
                throw new Error(`Transaction ${this.id} is already ${this.status}.`);
            }

            this.status = "committing";

            emitCostEvent("transactionStarted", {
                transaction: this
            });

            try {
                for (const step of this.steps) {
                    step.result = await step.apply(this.context, this);
                    this.completedSteps.push(step);
                }

                this.status = "committed";

                emitCostEvent("transactionCommitted", {
                    transaction: this
                });

                return {
                    success: true,
                    transaction: this
                };
            } catch (error) {
                this.error = error;
                await this.rollback();
                return {
                    success: false,
                    transaction: this,
                    error
                };
            }
        },

        async rollback() {
            this.status = "rollingBack";

            for (const step of [...this.completedSteps].reverse()) {
                if (!step.rollback) continue;

                try {
                    await step.rollback(
                        this.context,
                        this,
                        step.result,
                        step.snapshot
                    );
                } catch (rollbackError) {
                    console.error(
                        `Rollback failed for "${step.label}" in ${this.id}:`,
                        rollbackError
                    );
                }
            }

            this.status = "rolledBack";

            emitCostEvent("transactionRolledBack", {
                transaction: this,
                error: this.error
            });

            return this;
        }
    };

    return transaction;
}

/* ============================================================
 * Cost Payment Steps
 * ============================================================ */

function createResourceCostStep(cost, context) {
    const player = getPlayerById(cost.playerId ?? context.playerId);
    const previous = Number(player[cost.resource] ?? 0);

    return {
        label: `Pay ${cost.amount} ${cost.resource}`,

        apply() {
            player[cost.resource] = previous - cost.amount;
            return { player, previous };
        },

        rollback() {
            player[cost.resource] = previous;
        }
    };
}

function createHealthCostStep(cost, context) {
    const player = getPlayerById(cost.playerId ?? context.playerId);
    const previous = Number(player.health ?? 0);

    return {
        label: `Pay ${cost.amount} health`,

        apply() {
            player.health = previous - cost.amount;
            return { player, previous };
        },

        rollback() {
            player.health = previous;
        }
    };
}

function createDiscardCostStep(cost, context) {
    const card = findCardForCost(cost, context);
    const from = cost.zone ?? card.zone ?? "hand";

    return {
        label: `Discard ${card.name ?? card.id ?? "card"}`,

        apply() {
            if (typeof discardCard === "function") {
                const moved = discardCard(card, from);
                if (!moved) throw new Error("Discard cost could not be paid.");
            } else {
                card.zone = "discard";
            }

            return { card, from };
        },

        rollback() {
            if (typeof moveCard === "function") {
                moveCard(card, {
                    from: "discard",
                    to: from,
                    reason: "costRollback"
                });
            } else {
                card.zone = from;
            }
        }
    };
}

function createSacrificeCostStep(cost, context) {
    const unit = findUnitForCost(cost, context);
    const snapshot = cloneSerializable(unit);

    return {
        label: `Sacrifice ${unit.name ?? unit.id ?? "unit"}`,

        apply() {
            if (typeof destroyUnit === "function") {
                const result = destroyUnit(unit, {
                    reason: "sacrifice",
                    isCost: true,
                    source: context.source ?? null
                });

                if (result === false) {
                    throw new Error("Sacrifice cost could not be paid.");
                }
            } else if (Array.isArray(GameState.units)) {
                const index = GameState.units.findIndex(candidate => candidate?.id === unit.id);
                if (index < 0) throw new Error("Sacrifice target is not on the battlefield.");
                GameState.units.splice(index, 1);
            }

            return { unit, snapshot };
        },

        rollback() {
            if (!Array.isArray(GameState.units)) GameState.units = [];

            if (!GameState.units.some(candidate => candidate?.id === unit.id)) {
                Object.assign(unit, snapshot);
                GameState.units.push(unit);
            }
        }
    };
}

function createExhaustCostStep(cost, context) {
    const unit = findUnitForCost(cost, context);
    const previous = Boolean(unit.exhausted);

    return {
        label: `Exhaust ${unit.name ?? unit.id ?? "unit"}`,

        apply() {
            unit.exhausted = true;
            return { unit, previous };
        },

        rollback() {
            unit.exhausted = previous;
        }
    };
}

function createCustomCostStep(cost, context) {
    return {
        label: cost.metadata.label ?? "Pay custom cost",

        async apply(transactionContext, transaction) {
            return cost.pay(cost, transactionContext, transaction);
        },

        async rollback(transactionContext, transaction, result) {
            if (cost.refund) {
                await cost.refund(cost, transactionContext, transaction, result);
            }
        }
    };
}

function createCostStep(cost, context) {
    switch (cost.type) {
        case CostTypes.RESOURCE:
            return createResourceCostStep(cost, context);

        case CostTypes.HEALTH:
            return createHealthCostStep(cost, context);

        case CostTypes.DISCARD:
            return createDiscardCostStep(cost, context);

        case CostTypes.SACRIFICE:
            return createSacrificeCostStep(cost, context);

        case CostTypes.EXHAUST:
            return createExhaustCostStep(cost, context);

        case CostTypes.CUSTOM:
            return createCustomCostStep(cost, context);

        default:
            throw new Error(`Unsupported cost type: ${cost.type}`);
    }
}

/* ============================================================
 * Public Payment API
 * ============================================================ */

async function payCosts(costs, context = {}, options = {}) {
    const normalized = normalizeCosts(costs);

    if (!canPayCosts(normalized, context)) {
        const result = {
            success: false,
            reason: "unpayable",
            costs: normalized
        };

        emitCostEvent("costPaymentFailed", {
            ...result,
            context
        });

        return result;
    }

    const transaction = createResolutionTransaction({
        label: options.label ?? "Pay Costs",
        source: options.source ?? context.source ?? null,
        controller: options.controller ?? context.playerId ?? null,
        context
    });

    for (const cost of normalized) {
        transaction.addStep(createCostStep(cost, context));
    }

    const result = await transaction.commit();

    if (result.success) {
        emitCostEvent("costsPaid", {
            costs: normalized,
            context,
            transaction
        });
    } else {
        emitCostEvent("costPaymentFailed", {
            costs: normalized,
            context,
            transaction,
            error: result.error
        });
    }

    return {
        ...result,
        costs: normalized
    };
}

/* ============================================================
 * Exports
 * ============================================================ */

window.CostTypes = CostTypes;
window.normalizeCost = normalizeCost;
window.normalizeCosts = normalizeCosts;
window.canPayCost = canPayCost;
window.canPayCosts = canPayCosts;
window.payCosts = payCosts;
window.createResolutionTransaction = createResolutionTransaction;
