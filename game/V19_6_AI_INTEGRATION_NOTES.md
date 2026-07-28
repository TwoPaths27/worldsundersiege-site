# Worlds Under Siege v19.6 — AI Integration

## Added

- `ai-strategy.js`, a deterministic tactical evaluator for the new Conceal,
  Mount, mounted-combat, and Construct Range systems.
- Mount scoring and legal Mount selection.
- Optional automatic execution helper for a legal AI Mount action.
- Concealed-unit reveal scoring and optional automatic reveal execution.
- Mounted combat damage targeting that evaluates lethal damage, rider value,
  and Mount mobility.
- Concealed-versus-face-up recruitment recommendation helper.
- Construct activation positioning scores and plan selection.

## Integration

- `mounted-combat.js` now delegates AI damage choice to `WUSAI` when available.
- `index.html` loads the AI module before battlefield gameplay begins.

## Scope

This pass provides the tactical AI API and connects mounted damage assignment.
The project does not currently contain a complete autonomous AI turn controller,
so movement path execution, card recruitment execution, and full-turn sequencing
remain available as integration points rather than being forced into the player-2
turn flow.
