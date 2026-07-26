
export function clearInteractionState(GameState){
  const fields=["selectedCardId","selectedUnitId","selectedTargetId","selectedOperatorId","selectedAttachmentId"];
  for(const f of fields){
    if(f in GameState) GameState[f]=null;
  }
  const sets=["reachableSpaces","attackableUnitIds","constructOperatorIds","highlightedSpaces","validTargets"];
  for(const s of sets){
    const v=GameState[s];
    if(v && typeof v.clear==="function") v.clear();
  }
}
export function cancelInteraction(GameState, renderGame, reason=""){
  clearInteractionState(GameState);
  if(reason) console.debug("Interaction cancelled:",reason);
  if(typeof renderGame==="function") renderGame();
}
