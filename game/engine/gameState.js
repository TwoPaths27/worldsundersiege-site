export const GameState={
 turn:1,
 activePlayer:1,
 board:Array.from({length:7},()=>Array(6).fill(null)),
 players:[
  {energy:1,maxEnergy:1,hand:[],strongholdHP:30},
  {energy:1,maxEnergy:1,hand:[],strongholdHP:30}
 ]
};
