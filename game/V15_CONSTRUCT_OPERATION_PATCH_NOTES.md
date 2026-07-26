# Worlds Under Siege — v15 Construct Operation System

## Implemented

- Constructs are now deployable battlefield cards without being treated as normal Units.
- Constructs cannot attack by themselves.
- Selecting a Construct's ATK control starts an operator-selection step.
- Eligible operators must be orthogonally adjacent friendly Characters.
- Operators must have the `operateConstructs` capability.
- Stunned, frozen, or already-attacked Characters cannot operate a Construct.
- The chosen Character spends its own attack when the Construct attacks.
- The Construct supplies the attack, range, position, animation, and combat body.
- Retaliation damage is dealt to the Construct, not the operator.
- A Construct may be operated again by a different eligible Character unless an effect says otherwise.
- Construct attacks can target Units or Strongholds using normal range and line-protection rules.
- Operator selection has a dedicated battlefield highlight.
- Selection and combat cleanup now clear pending Construct-operation state.

## Architecture added

- `isBattlefieldCard(card)`
- `canBeConstructOperator(card)`
- `getOrthogonallyAdjacentUnits(source)`
- `getEligibleConstructOperators(construct)`
- `canOperateConstruct(operator, construct)`
- `constructHasLegalAttackTarget(construct)`
- `findConstructAttackableUnits(construct)`
- `findConstructAttackableStronghold(construct)`
- `consumeConstructOperatorAttack(operator, construct)`

## Validation

All JavaScript files included in the package pass `node --check`.

## Completed roadmap

- v13 Engine Integration
- v14 Card Types, Traits, and Capabilities
- v15 Construct Operation foundation and combat flow

## Remaining roadmap

- v15 follow-up testing with real Construct cards and card-specific exceptions
- v16 Item attachment and equipment system
- v17 persistent Event system
- v18 Stronghold ability integration
- Individual card implementation pass
- AI updates for capabilities, Constructs, Items, and Events
- UI polish, automated gameplay tests, and balancing
