"use strict";
(async function bootstrapMatch(){
 const log=(m)=>{console.log("[Startup]",m);window.__startupLog=(window.__startupLog||[]);window.__startupLog.push(m);};
 try{
  log("Lobby");
  if(typeof runPregameLobby==="function") await Promise.race([runPregameLobby(),new Promise((_,rej)=>setTimeout(()=>rej(new Error("Lobby timeout")),10000))]);
  log("Coin");
  if(typeof runCoinFlip==="function") await Promise.race([runCoinFlip(),new Promise((_,rej)=>setTimeout(()=>rej(new Error("Coin timeout")),10000))]);
  log("Opening");
  if(typeof runOpeningHandPhase==="function"){
    const ready=await Promise.race([runOpeningHandPhase(),new Promise((_,rej)=>setTimeout(()=>rej(new Error("Opening timeout")),10000))]);
    if(ready===false||GameState.gameOver)return;
  }
  log("Init");
  initializeGame();
 }catch(e){
  console.error("Startup failed",e);
  alert("Startup failed: "+e.message+"\nSee browser console.");
 }
})();