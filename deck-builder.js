(() => {
"use strict";
const DB = window.WUS_CARD_DATABASE || [];
const byId = Object.fromEntries(DB.map(card => [card.id, card]));
const DECKS_KEY = "wus-saved-decks-v2";
const LEGACY_DECKS_KEY = "wus-saved-decks-v1";
const ACTIVE_KEY = "wus-active-deck-v2";
const LEGACY_ACTIVE_KEY = "wus-active-deck-v1";
const MAIN_DECK_LIMIT = 60;
const ARMY_LIMIT = 3;
const BUY_PRICE = Object.freeze({ Common:25, Uncommon:50, Rare:100, "Super Rare":200, "Ultra Rare":300 });
let mainDeck = {};
let stronghold = null;
let armies = [];
let activeDeckId = null;
let selectedCard = null;
let selectedForm = 0;
const purchaseSound = new Audio("sounds/drop-coin.mp3");
purchaseSound.preload = "auto";
purchaseSound.volume = 0.75;

const addCardSound = new Audio("sounds/universfield-computer-mouse-click-352734.mp3");
addCardSound.preload = "auto";
addCardSound.volume = 0.75;

const removeCardSound = new Audio("sounds/dragon-studio-simple-whoosh-382724.mp3");
removeCardSound.preload = "auto";
removeCardSound.volume = 0.75;

function playDeckSound(sound){
  try{
    sound.currentTime = 0;
    sound.play().catch(()=>{});
  }catch{}
}
const $ = id => document.getElementById(id);
const ids = ["deckName","newDeckBtn","saveDeckBtn","exportDeckBtn","pasteDeckBtn","saveAsDeckBtn","renameDeckBtn","savedDecks","deleteDeckBtn","deckSort","goldBalance","previewImage","formTabs","previewName","previewOwned","previewMeta","previewStats","previewCharacteristics","previewEffect","previewEffectName","previewEffectText","purchasePanel","deckSummary","deckStatus","deckList","emptyDeck","clearDeckBtn","strongholdSlot","armySlots","searchCards","typeFilter","rarityFilter","setFilter","costFilter","atkFilter","hpFilter","rangeFilter","spdFilter","ownedOnly","buySingles","resetFilters","cardBrowser","emptyBrowser","visibleCount","assetGate","assetGateStatus","assetGateDownload","assetGateProgress","assetGateProgressFill","assetGateProgressText","assetGateErrors","assetGateErrorList","deckManagerModal","managerNewDeck","managerDeckSelect","managerLoadDeck","managerEmptyMessage","pasteDeckModal","pasteDeckText","pasteDeckStatus","cancelPasteDeckBtn","importPastedDeckBtn","missingCardsModal","missingCardsList","closeMissingCardsBtn"];
const els = Object.fromEntries(ids.map(id=>[id,$(id)]));
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const owned=id=>window.WUSCollection?.getOwned(id)||0;
const isStronghold=card=>card?.types?.includes("Stronghold");
const isArmy=card=>card?.types?.includes("Army");
const isMainCard=card=>card&&!isStronghold(card)&&!isArmy(card);
const mainTotal=()=>Object.values(mainDeck).reduce((n,q)=>n+q,0);
const printingQty=id=>mainDeck[id]||0;
const sharedQty=gameplayId=>Object.entries(mainDeck).reduce((n,[id,q])=>n+(byId[id]?.gameplayId===gameplayId?q:0),0);
function canAddMain(card){return isMainCard(card)&&mainTotal()<MAIN_DECK_LIMIT&&owned(card.id)>printingQty(card.id)&&sharedQty(card.gameplayId)<card.copyLimit;}
function canSelectStronghold(card){return isStronghold(card)&&owned(card.id)>0&&stronghold!==card.id;}
function canAddArmy(card){return isArmy(card)&&owned(card.id)>0&&!armies.includes(card.id)&&armies.length<ARMY_LIMIT;}
function canAdd(card){if(isStronghold(card))return canSelectStronghold(card);if(isArmy(card))return canAddArmy(card);return canAddMain(card);}
function normalizedState(raw={}){
  if(raw.mainDeck||raw.stronghold!==undefined||raw.armies){return {mainDeck:{...(raw.mainDeck||{})},stronghold:raw.stronghold||null,armies:[...(raw.armies||[])].slice(0,ARMY_LIMIT)};}
  const legacy=raw.deck||raw.cards||raw||{};const state={mainDeck:{},stronghold:null,armies:[]};
  Object.entries(legacy).forEach(([id,q])=>{const c=byId[id];if(!c||q<=0)return;if(isStronghold(c)){if(!state.stronghold)state.stronghold=id;}else if(isArmy(c)){if(state.armies.length<ARMY_LIMIT&&!state.armies.includes(id))state.armies.push(id);}else state.mainDeck[id]=q;});
  return state;
}
function applyState(raw){const s=normalizedState(raw);mainDeck=s.mainDeck;stronghold=s.stronghold;armies=s.armies;}
function currentState(){return {mainDeck:{...mainDeck},stronghold,armies:[...armies]};}
function loadDecks(){try{const v=JSON.parse(localStorage.getItem(DECKS_KEY));if(v)return v;const legacy=JSON.parse(localStorage.getItem(LEGACY_DECKS_KEY))||{};return Object.fromEntries(Object.entries(legacy).map(([id,d])=>[id,{...d,...normalizedState(d.cards||d.deck||{}),cards:undefined,deck:undefined}]));}catch{return {};}}
function storeDecks(v){localStorage.setItem(DECKS_KEY,JSON.stringify(v));}
function saveActive(){localStorage.setItem(ACTIVE_KEY,JSON.stringify({name:els.deckName.value,...currentState()}));}
function populateFilters(){
  [...new Set(DB.flatMap(c=>c.types))].sort().forEach(v=>els.typeFilter.add(new Option(v,v)));
  ["Common","Uncommon","Rare","Super Rare","Ultra Rare","Secret Rare"].forEach(v=>els.rarityFilter.add(new Option(v,v)));
  [...new Set(DB.map(c=>c.set).filter(Boolean))].sort().forEach(v=>els.setFilter.add(new Option(v,v)));
  const addRange=(el,max,label)=>{for(let i=0;i<=max;i++)el.add(new Option(`${label} ${i}`,String(i)));};
  addRange(els.costFilter,10,"Cost");
  addRange(els.atkFilter,14,"ATK");
  addRange(els.hpFilter,17,"HP");
  addRange(els.rangeFilter,4,"Range");
  addRange(els.spdFilter,4,"Speed");
}
function populateSaved(){
  const decks=loadDecks();
  const sorted=Object.entries(decks).sort((a,b)=>(b[1].updated||0)-(a[1].updated||0));
  els.savedDecks.innerHTML='<option value="">Load saved deck…</option>';
  els.managerDeckSelect.innerHTML='<option value="">Choose a saved deck…</option>';
  sorted.forEach(([id,d])=>{els.savedDecks.add(new Option(d.name,id));els.managerDeckSelect.add(new Option(d.name,id));});
  els.savedDecks.value=activeDeckId||"";
  els.deleteDeckBtn.disabled=!activeDeckId;
  els.renameDeckBtn.disabled=!activeDeckId;
  els.managerEmptyMessage.hidden=sorted.length!==0;
  els.managerDeckSelect.disabled=sorted.length===0;
  els.managerLoadDeck.disabled=true;
}
async function setImg(img,path){img.src="card-back.png";try{img.src=window.WUSAssets?await WUSAssets.getObjectUrl(path):encodeURI(path);}catch{img.src=encodeURI(path);}}
function formData(card){return card.forms?.[selectedForm]||card;}
function purchasePrice(card){return card?.isSecret||card?.rarity==="Secret Rare"?null:(BUY_PRICE[card?.rarity]??null);}
function ownershipLimit(card){return window.WUSCollection?.getLimit(card) ?? card.copyLimit ?? 3;}
function canPurchase(card){const price=purchasePrice(card);return els.buySingles.checked&&price!==null&&owned(card.id)<ownershipLimit(card);}
function buyCard(card){
  const price=purchasePrice(card);
  if(price===null||!window.WUSCollection)return;
  const result=WUSCollection.purchaseCard(card,price);
  if(!result.ok){
    const message=result.reason==="insufficient-gold"?`Need ${price.toLocaleString()} Gold. You have ${result.gold.toLocaleString()}.`:"Maximum owned.";
    els.purchasePanel.innerHTML=`<strong>${message}</strong>`;
    els.purchasePanel.classList.add("purchase-error");
    els.purchasePanel.hidden=false;
    return;
  }
  els.purchasePanel.classList.remove("purchase-error");
  try{purchaseSound.currentTime=0;purchaseSound.play().catch(()=>{});}catch{}
  renderPreview();renderDeck();renderBrowser();
}
function selectCard(card){selectedCard=card;selectedForm=0;renderPreview();document.querySelectorAll('.browser-card').forEach(e=>e.classList.toggle('selected',e.dataset.id===card.id));}
function renderPreview(){const c=selectedCard;if(!c)return;const f=formData(c);setImg(els.previewImage,f.image||c.image);els.previewName.textContent=f.name||c.name;els.previewOwned.textContent=`Owned ${owned(c.id)} / ${c.copyLimit}`;els.previewMeta.textContent=`${c.id} · ${c.rarity} · ${c.types.join(" / ")}${c.isSecret?" · Secret printing":""}`;els.previewStats.innerHTML=[["COST",f.cost],["ATK",f.atk],["HP",f.hp],["RNG",f.range],["SPD",f.spd]].map(([k,v])=>v===null||v===undefined?'':`<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');els.previewCharacteristics.innerHTML=(f.characteristics||[]).map(x=>`<span class="tag">${x}</span>`).join('');els.previewEffect.hidden=!(f.effectName||f.effectText);els.previewEffectName.textContent=f.effectName||'Effect';els.previewEffectText.textContent=f.effectText||'No additional effect.';
const price=purchasePrice(c), have=owned(c.id), limit=ownershipLimit(c), gold=window.WUSCollection?.load().gold||0;
els.purchasePanel.classList.remove("purchase-error");
if(!els.buySingles.checked){
  els.purchasePanel.hidden=true;
}else if(c.isSecret||c.rarity==="Secret Rare"){
  els.purchasePanel.hidden=false;els.purchasePanel.innerHTML='<strong>Secret Rare</strong><span>Only obtainable from booster packs.</span>';
}else if(price!==null&&have<limit){
  els.purchasePanel.hidden=false;els.purchasePanel.innerHTML=`<div><strong>Buy another copy</strong><span>${price.toLocaleString()} Gold · Owned ${have}/${limit}</span></div><button id="previewBuyButton" class="primary-btn" ${gold<price?'disabled':''}>Buy</button>`;
  els.purchasePanel.querySelector('button')?.addEventListener('click',()=>buyCard(c));
}else if(price!==null){
  els.purchasePanel.hidden=false;els.purchasePanel.innerHTML='<strong>Maximum Owned</strong><span>No more copies can be purchased.</span>';
}else els.purchasePanel.hidden=true;
if(c.forms){els.formTabs.hidden=false;els.formTabs.innerHTML=c.forms.map((x,i)=>`<button class="form-tab ${i===selectedForm?'active':''}" data-form="${i}">${x.name}</button>`).join('');els.formTabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedForm=Number(b.dataset.form);renderPreview();});}else{els.formTabs.hidden=true;els.formTabs.innerHTML='';}}
function addCard(id){
  const c=byId[id];
  if(!c||!canAdd(c))return;
  if(isStronghold(c))stronghold=id;
  else if(isArmy(c))armies.push(id);
  else mainDeck[id]=(mainDeck[id]||0)+1;
  playDeckSound(addCardSound);
  saveActive();
  renderDeck();
  renderBrowser();
}
function removeCard(id){
  const c=byId[id];
  if(!c)return;
  let removed=false;
  if(isStronghold(c)){
    if(stronghold===id){stronghold=null;removed=true;}
  }else if(isArmy(c)){
    const before=armies.length;
    armies=armies.filter(x=>x!==id);
    removed=armies.length<before;
  }else if(mainDeck[id]){
    mainDeck[id]-=1;
    if(mainDeck[id]<=0)delete mainDeck[id];
    removed=true;
  }
  if(!removed)return;
  playDeckSound(removeCardSound);
  saveActive();
  renderDeck();
  renderBrowser();
}
function slotMarkup(card,kind,index){if(!card)return `<div class="special-slot empty"><span>${kind==='Stronghold'?'Choose 1 Stronghold':`Army Slot ${index+1}`}</span><small>${kind==='Stronghold'?'This is your deck’s main card.':'Choose a different Army card.'}</small></div>`;return `<article class="special-slot filled ${card.isSecret?'secret':''}" data-special-id="${card.id}"><img src="card-back.png" alt=""><div><strong>${card.name}</strong><small>${card.id} · ${card.rarity}</small><small>Owned ${owned(card.id)}</small></div><button class="special-remove" aria-label="Remove ${card.name}">×</button></article>`;}
function renderSpecialSections(){const sh=stronghold?byId[stronghold]:null;els.strongholdSlot.innerHTML=slotMarkup(sh,"Stronghold",0);if(sh){const row=els.strongholdSlot.querySelector('[data-special-id]');setImg(row.querySelector('img'),sh.image);row.onmouseenter=()=>selectCard(sh);row.querySelector('button').onclick=()=>removeCard(sh.id);}els.armySlots.innerHTML=Array.from({length:ARMY_LIMIT},(_,i)=>slotMarkup(armies[i]?byId[armies[i]]:null,"Army",i)).join('');els.armySlots.querySelectorAll('[data-special-id]').forEach(row=>{const c=byId[row.dataset.specialId];setImg(row.querySelector('img'),c.image);row.onmouseenter=()=>selectCard(c);row.querySelector('button').onclick=()=>removeCard(c.id);});}
const RARITY_ORDER={"Common":0,"Uncommon":1,"Rare":2,"Super Rare":3,"Ultra Rare":4,"Secret Rare":5};
function deckSortValue(card,mode){
  if(mode==="type")return (card.types?.[0]||"").toLowerCase();
  if(mode==="rarity")return RARITY_ORDER[card.rarity]??99;
  if(["cost","atk","hp","range","spd"].includes(mode)){const value=card[mode];return value===null||value===undefined?-1:Number(value);}
  return card.name.toLowerCase();
}
function sortedDeckEntries(){
  const mode=els.deckSort?.value||"name";
  return Object.entries(mainDeck).filter(([,q])=>q>0).sort(([a],[b])=>{
    const ca=byId[a],cb=byId[b],va=deckSortValue(ca,mode),vb=deckSortValue(cb,mode);
    if(typeof va==="number"&&typeof vb==="number"&&va!==vb)return va-vb;
    const compared=String(va).localeCompare(String(vb),undefined,{numeric:true,sensitivity:"base"});
    return compared||ca.name.localeCompare(cb.name);
  });
}
function renderDeck(){const entries=sortedDeckEntries();const total=mainTotal();els.deckSummary.textContent=`${total} / ${MAIN_DECK_LIMIT} cards · ${entries.length} unique`;els.emptyDeck.hidden=entries.length>0;els.deckList.innerHTML='';let violations=[];const groupTotals={};entries.forEach(([id,q])=>{const c=byId[id];groupTotals[c.gameplayId]=(groupTotals[c.gameplayId]||0)+q;if(q>owned(id))violations.push(`${c.name}: deck uses ${q}, owned ${owned(id)}`);});Object.entries(groupTotals).forEach(([gid,q])=>{const c=DB.find(x=>x.gameplayId===gid);if(q>c.copyLimit)violations.push(`${c.name}: ${q}/${c.copyLimit} shared copies`);});if(total!==MAIN_DECK_LIMIT)violations.push(`Main deck must contain exactly ${MAIN_DECK_LIMIT} cards (${total}/${MAIN_DECK_LIMIT})`);if(!stronghold)violations.push('Choose exactly 1 Stronghold');else if(owned(stronghold)<1)violations.push(`${byId[stronghold].name}: not owned`);if(armies.length>ARMY_LIMIT)violations.push(`Choose no more than ${ARMY_LIMIT} Armies`);armies.forEach(id=>{if(owned(id)<1)violations.push(`${byId[id].name}: not owned`);});els.deckStatus.className=`deck-status ${violations.length?'invalid':'valid'}`;els.deckStatus.textContent=violations.length?violations.join(' · '):`Deck ready: ${MAIN_DECK_LIMIT} cards, 1 Stronghold, ${armies.length} Arm${armies.length===1?'y':'ies'}.`;
entries.forEach(([id,q])=>{const c=byId[id];const div=document.createElement('article');div.className=`deck-entry compact-card ${c.isSecret?'secret':''}`;div.title=`${c.name} · ${c.id} · Owned ${owned(id)} · Shared ${sharedQty(c.gameplayId)}/${c.copyLimit}`;div.innerHTML=`<img class="deck-thumb" src="card-back.png" alt="${c.name}"><div class="qty-controls"><button class="qty-btn minus" aria-label="Remove one ${c.name}">−</button><span class="qty">${q}</span><button class="qty-btn plus" aria-label="Add one ${c.name}" ${canAddMain(c)?'':'disabled'}>+</button></div>`;setImg(div.querySelector('img'),c.image);div.onmouseenter=()=>selectCard(c);div.onclick=()=>selectCard(c);div.querySelector('.minus').onclick=e=>{e.stopPropagation();removeCard(id)};div.querySelector('.plus').onclick=e=>{e.stopPropagation();addCard(id)};els.deckList.append(div);});renderSpecialSections();
const counts={Character:0,Animal:0,Action:0,Item:0,Construct:0,Event:0};entries.forEach(([id,q])=>byId[id].types.forEach(t=>{if(t in counts)counts[t]+=q;}));Object.entries(counts).forEach(([t,n])=>{const e=$("count"+t);if(e)e.textContent=n;});}
function statMatches(card,key,selected){
  if(selected==="All")return true;
  const target=Number(selected);
  const values=[card[key],...(card.forms||[]).map(form=>form[key])]
    .filter(value=>value!==null&&value!==undefined&&value!=="")
    .map(Number);
  return values.includes(target);
}
function matches(c){
  const q=els.searchCards.value.trim().toLowerCase();
  const have=owned(c.id);
  if(c.isSecret&&!have)return false;
  if(els.ownedOnly.checked&&!have)return false;
  if(els.typeFilter.value!=="All"&&!c.types.includes(els.typeFilter.value))return false;
  if(els.rarityFilter.value!=="All"&&c.rarity!==els.rarityFilter.value)return false;
  if(els.setFilter.value!=="All"&&c.set!==els.setFilter.value)return false;
  if(!statMatches(c,"cost",els.costFilter.value))return false;
  if(!statMatches(c,"atk",els.atkFilter.value))return false;
  if(!statMatches(c,"hp",els.hpFilter.value))return false;
  if(!statMatches(c,"range",els.rangeFilter.value))return false;
  if(!statMatches(c,"spd",els.spdFilter.value))return false;
  if(!q)return true;
  const hay=[
    c.id,c.name,c.set,c.rarity,c.effectName,c.effectText,
    ...c.types,...c.characteristics,
    ...(c.forms||[]).flatMap(f=>[f.name,f.effectName,f.effectText,...(f.characteristics||[])])
  ].join(" ").toLowerCase();
  return hay.includes(q);
}
function deckUseLabel(c){if(isStronghold(c))return stronghold===c.id?'Selected':'Not selected';if(isArmy(c))return armies.includes(c.id)?'Selected':'Not selected';return `Deck ${printingQty(c.id)}`;}
function addLabel(c){if(isStronghold(c))return stronghold?'Replace Stronghold':'Select Stronghold';if(isArmy(c))return 'Add Army';return `Add ${c.name}`;}
function renderBrowser(){
  const list=DB.filter(matches);
  const buying=els.buySingles.checked;
  const gold=window.WUSCollection?.load().gold||0;
  els.visibleCount.textContent=`${list.length} shown`;
  els.emptyBrowser.hidden=list.length>0;
  els.cardBrowser.innerHTML='';
  list.forEach(c=>{
    const have=owned(c.id);
    const price=purchasePrice(c);
    const limit=ownershipLimit(c);
    const purchasable=canPurchase(c);
    const div=document.createElement('article');
    div.className=`browser-card ${have?'':'unowned'} ${c.isSecret?'secret':''} ${buying?'buying-card':''}`;
    div.dataset.id=c.id;
    div.title=`${c.name} · ${c.id} · ${c.rarity} · Owned ${have} · ${deckUseLabel(c)}`;

    let actionMarkup;
    if(buying){
      let label="Unavailable";
      let disabled=true;
      if(price!==null&&have>=limit) label="Max Owned";
      else if(purchasable){
        label=`Buy · ${price.toLocaleString()} Gold`;
        disabled=gold<price;
      }
      actionMarkup=`<button class="buy-card-btn browser-action-btn" type="button" ${disabled?'disabled':''}>${label}</button>`;
    }else{
      actionMarkup=`<button class="browser-add browser-action-btn" type="button" aria-label="${addLabel(c)}" ${canAdd(c)?'':'disabled'}>+</button>`;
    }

    div.innerHTML=`<img class="browser-thumb" src="card-back.png" alt="${c.name}"><div class="browser-card-controls"><span class="browser-quantity">${buying?`Owned ${have}/${limit}`:(isStronghold(c)?(stronghold===c.id?'Selected':'Stronghold'):isArmy(c)?(armies.includes(c.id)?'Selected':'Army'):`${printingQty(c.id)} / ${have}`)}</span>${actionMarkup}</div>`;
    setImg(div.querySelector('img'),c.image);
    div.onclick=()=>selectCard(c);
    div.ondblclick=()=>{if(!buying)addCard(c.id);};
    div.onmouseenter=()=>selectCard(c);
    div.querySelector('.browser-add')?.addEventListener('click',e=>{e.stopPropagation();addCard(c.id);});
    div.querySelector('.buy-card-btn')?.addEventListener('click',e=>{e.stopPropagation();selectCard(c);buyCard(c);});
    els.cardBrowser.append(div);
  });
  if(selectedCard)document.querySelector(`[data-id="${selectedCard.id}"]`)?.classList.add('selected');
}
function resetFilters(){
  els.searchCards.value="";
  ["typeFilter","rarityFilter","setFilter","costFilter","atkFilter","hpFilter","rangeFilter","spdFilter"].forEach(id=>els[id].value="All");
  els.ownedOnly.checked=false;
  els.buySingles.checked=false;
  renderBrowser();
  renderPreview();
}
function newDeck(){mainDeck={};stronghold=null;armies=[];activeDeckId=null;els.deckName.value='New Deck';saveActive();populateSaved();renderDeck();renderBrowser();}
const allImagePaths=window.WUSAssetManifest?.getRequiredCardImages()||[...new Set(DB.flatMap(card=>[card.image,...(card.forms||[]).map(form=>form.image)].filter(Boolean)))];
function lockPage(show){document.body.classList.toggle("builder-locked",show);}
function showDeckManager(){els.assetGate.hidden=true;els.deckManagerModal.hidden=false;lockPage(true);populateSaved();}
function closeDeckManager(){els.deckManagerModal.hidden=true;lockPage(false);}
function loadDeckById(id){const d=loadDecks()[id];if(!d)return false;activeDeckId=id;applyState(d);els.deckName.value=d.name||"Untitled Deck";saveActive();populateSaved();renderDeck();renderBrowser();closeDeckManager();return true;}
function formatAssetFailures(failed){return failed.map(x=>`${x.path}: ${x.error}`).join("\n");}
async function checkAssetsBeforeEntry(){
  lockPage(true);els.assetGate.hidden=false;els.deckManagerModal.hidden=true;
  if(!window.WUSAssets||!allImagePaths.length){showDeckManager();return;}
  try{
    const status=await WUSAssets.getStatus(allImagePaths);
    if(status.complete){showDeckManager();return;}
    els.assetGateStatus.textContent=`${status.installed} / ${status.total} images installed`;
    els.assetGateDownload.textContent=status.installed?"Continue Download":"Download Images";
  }catch(error){els.assetGateStatus.textContent=error.message||"Could not check card images.";}
}
async function installAssetsFromGate(){
  els.assetGateDownload.disabled=true;els.assetGateProgress.hidden=false;els.assetGateErrors.hidden=true;els.assetGateErrorList.textContent="";
  const result=await WUSAssets.install(allImagePaths,{onProgress:({completed,total,failed})=>{
    els.assetGateProgressFill.style.width=`${Math.round(completed/total*100)}%`;
    els.assetGateProgressText.textContent=`${completed} / ${total}${failed?` · ${failed} failed`:""}`;
    els.assetGateStatus.textContent="Downloading Battle of Ages images…";
  }});
  els.assetGateDownload.disabled=false;
  if(result.failed.length){
    els.assetGateStatus.textContent=`${result.total-result.failed.length} / ${result.total} installed. Retry the failed files.`;
    els.assetGateDownload.textContent="Continue Download";els.assetGateErrors.hidden=false;els.assetGateErrorList.textContent=formatAssetFailures(result.failed);
  }else{els.assetGateStatus.textContent="Battle of Ages is ready!";els.assetGateStatus.classList.remove("warning");els.assetGateStatus.classList.add("ready");setTimeout(showDeckManager,350);}
}
els.assetGateDownload.onclick=installAssetsFromGate;
els.managerDeckSelect.onchange=()=>{els.managerLoadDeck.disabled=!els.managerDeckSelect.value;};
els.managerNewDeck.onclick=()=>{newDeck();closeDeckManager();};
els.managerLoadDeck.onclick=()=>loadDeckById(els.managerDeckSelect.value);
function cardFileName(card){
  const source=String(card?.image||"").replace(/\\/g,"/");
  return decodeURIComponent(source.split("/").pop()||"").trim();
}
function exportedDeckFileNames(){
  const names=[];
  if(stronghold&&byId[stronghold])names.push(cardFileName(byId[stronghold]));
  armies.forEach(id=>{if(byId[id])names.push(cardFileName(byId[id]));});
  sortedDeckEntries().forEach(([id,qty])=>{
    const card=byId[id];
    if(!card)return;
    for(let i=0;i<qty;i++)names.push(cardFileName(card));
  });
  return names.filter(Boolean);
}
async function copyDeckExport(){
  const text=exportedDeckFileNames().join("\n");
  if(!text){alert("There are no cards in this deck to export.");return;}
  try{
    await navigator.clipboard.writeText(text);
  }catch{
    const box=document.createElement("textarea");box.value=text;box.style.position="fixed";box.style.opacity="0";document.body.append(box);box.select();document.execCommand("copy");box.remove();
  }
  const original=els.exportDeckBtn.textContent;els.exportDeckBtn.textContent="Copied!";setTimeout(()=>{els.exportDeckBtn.textContent=original;},1200);
}
function normalizePastedFileName(value){
  return decodeURIComponent(String(value||"").trim().replace(/^['\"]|['\"]$/g,"").replace(/\\/g,"/").split("/").pop()||"").toLowerCase();
}
function pastedFileNames(text){
  return String(text||"").split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
}
function showPasteDeckModal(){
  els.pasteDeckText.value="";els.pasteDeckStatus.hidden=true;els.pasteDeckStatus.textContent="";els.pasteDeckModal.hidden=false;lockPage(true);setTimeout(()=>els.pasteDeckText.focus(),0);
}
function closePasteDeckModal(){els.pasteDeckModal.hidden=true;lockPage(false);}
function closeMissingCardsModal(){els.missingCardsModal.hidden=true;lockPage(false);}
function showMissingCards(missing){
  els.missingCardsList.innerHTML=missing.map(item=>`<div class="missing-card-row"><strong>${item.file}</strong><span>${item.reason}</span></div>`).join("");
  els.missingCardsModal.hidden=false;lockPage(true);
}
function importPastedDeck(){
  const lines=pastedFileNames(els.pasteDeckText.value);
  if(!lines.length){els.pasteDeckStatus.textContent="Paste at least one card file name.";els.pasteDeckStatus.hidden=false;return;}
  const fileMap=new Map();
  DB.forEach(card=>{
    const file=normalizePastedFileName(cardFileName(card));
    if(file&&!fileMap.has(file))fileMap.set(file,card);
  });
  const requested=new Map(),unknown=[];
  lines.forEach(file=>{
    const card=fileMap.get(normalizePastedFileName(file));
    if(!card)unknown.push({file,reason:"File name not found"});
    else requested.set(card.id,(requested.get(card.id)||0)+1);
  });
  const nextMain={},nextArmies=[];let nextStronghold=null;const missing=[...unknown];
  requested.forEach((qty,id)=>{
    const card=byId[id],available=owned(id),allowed=Math.min(qty,available);
    if(allowed<qty)missing.push({file:cardFileName(card),reason:`Not owned: missing ${qty-allowed} cop${qty-allowed===1?'y':'ies'}`});
    if(!allowed)return;
    if(isStronghold(card)){
      if(!nextStronghold)nextStronghold=id;
      else missing.push({file:cardFileName(card),reason:"Only 1 Stronghold can be added"});
      if(allowed>1)missing.push({file:cardFileName(card),reason:`Only 1 Stronghold can be added; ${allowed-1} extra cop${allowed-1===1?'y was':'ies were'} skipped`});
      return;
    }
    if(isArmy(card)){
      if(nextArmies.length<ARMY_LIMIT)nextArmies.push(id);
      else missing.push({file:cardFileName(card),reason:"Only 3 different Armies can be added"});
      if(allowed>1)missing.push({file:cardFileName(card),reason:`Army cards can only be added once; ${allowed-1} extra cop${allowed-1===1?'y was':'ies were'} skipped`});
      return;
    }
    const sharedAlready=Object.entries(nextMain).reduce((sum,[otherId,count])=>sum+(byId[otherId]?.gameplayId===card.gameplayId?count:0),0);
    const room=Math.max(0,Math.min(card.copyLimit-sharedAlready,MAIN_DECK_LIMIT-Object.values(nextMain).reduce((a,b)=>a+b,0)));
    const addQty=Math.min(allowed,room);
    if(addQty)nextMain[id]=addQty;
    if(addQty<allowed)missing.push({file:cardFileName(card),reason:`Deck rules skipped ${allowed-addQty} cop${allowed-addQty===1?'y':'ies'}`});
  });
  mainDeck=nextMain;stronghold=nextStronghold;armies=nextArmies;activeDeckId=null;els.deckName.value="Pasted Deck";saveActive();populateSaved();renderDeck();renderBrowser();
  els.pasteDeckModal.hidden=true;
  if(missing.length)showMissingCards(missing);else{lockPage(false);alert("Deck pasted successfully.");}
}

function saveDeck({forceNew=false,nameOverride=null}={}){
  const decks=loadDecks();
  const id=forceNew||!activeDeckId?`deck-${Date.now()}`:activeDeckId;
  const name=(nameOverride??els.deckName.value).trim()||"Untitled Deck";
  decks[id]={name,...currentState(),updated:Date.now()};
  storeDecks(decks);activeDeckId=id;els.deckName.value=name;saveActive();populateSaved();
}
function saveDeckAs(){
  const suggested=els.deckName.value.trim()||"Untitled Deck";
  const name=prompt("Save this deck as:",suggested);
  if(name===null)return;
  saveDeck({forceNew:true,nameOverride:name});
}
function renameDeck(){
  if(!activeDeckId)return;
  const decks=loadDecks(),current=decks[activeDeckId];if(!current)return;
  const name=prompt("Rename this deck:",current.name||els.deckName.value||"Untitled Deck");
  if(name===null||!name.trim())return;
  current.name=name.trim();current.updated=Date.now();decks[activeDeckId]=current;storeDecks(decks);els.deckName.value=current.name;saveActive();populateSaved();
}
els.newDeckBtn.onclick=newDeck;
els.clearDeckBtn.onclick=()=>{if(confirm('Remove the main deck, Stronghold, and all Armies?')){mainDeck={};stronghold=null;armies=[];saveActive();renderDeck();renderBrowser();}};
els.saveDeckBtn.onclick=()=>saveDeck();
els.exportDeckBtn.onclick=copyDeckExport;
els.pasteDeckBtn.onclick=showPasteDeckModal;
els.cancelPasteDeckBtn.onclick=closePasteDeckModal;
els.importPastedDeckBtn.onclick=importPastedDeck;
els.closeMissingCardsBtn.onclick=closeMissingCardsModal;
els.pasteDeckModal.addEventListener("click",e=>{if(e.target===els.pasteDeckModal)closePasteDeckModal();});
els.missingCardsModal.addEventListener("click",e=>{if(e.target===els.missingCardsModal)closeMissingCardsModal();});
els.saveAsDeckBtn.onclick=saveDeckAs;
els.renameDeckBtn.onclick=renameDeck;
els.savedDecks.onchange=()=>{const id=els.savedDecks.value;if(id)loadDeckById(id);};
els.deleteDeckBtn.onclick=()=>{if(!activeDeckId||!confirm('Delete this saved deck?'))return;const decks=loadDecks();delete decks[activeDeckId];storeDecks(decks);newDeck();};
els.deckSort.addEventListener("change",renderDeck);["searchCards","typeFilter","rarityFilter","setFilter","costFilter","atkFilter","hpFilter","rangeFilter","spdFilter","ownedOnly"].forEach(id=>{
  els[id].addEventListener(id==="searchCards"?"input":"change",renderBrowser);
});els.buySingles.addEventListener("change",()=>{renderBrowser();renderPreview();});els.resetFilters.onclick=resetFilters;window.addEventListener('wus-player-data-changed',()=>{els.goldBalance.textContent=`${WUSCollection.load().gold.toLocaleString()} Gold`;renderDeck();renderBrowser();renderPreview();});
function init(){populateFilters();populateSaved();mainDeck={};stronghold=null;armies=[];activeDeckId=null;els.deckName.value='New Deck';els.goldBalance.textContent=`${(WUSCollection?.load().gold||0).toLocaleString()} Gold`;renderDeck();renderBrowser();if(DB.length)selectCard(DB.find(c=>owned(c.id)>0&&!c.isSecret)||DB[0]);checkAssetsBeforeEntry();}
init();

/* Keep the center and right columns exactly as tall as the natural left preview. */
function syncBuilderColumnHeight(){
  const layout = document.querySelector(".builder-layout");
  const preview = document.querySelector(".preview-panel");
  if(!layout || !preview || window.innerWidth < 1251){
    layout?.style.removeProperty("--builder-column-height");
    return;
  }
  const height = Math.ceil(preview.getBoundingClientRect().height);
  if(height > 0) layout.style.setProperty("--builder-column-height", `${height}px`);
}

const builderColumnObserver = typeof ResizeObserver !== "undefined"
  ? new ResizeObserver(syncBuilderColumnHeight)
  : null;

if(builderColumnObserver){
  const previewPanel = document.querySelector(".preview-panel");
  if(previewPanel) builderColumnObserver.observe(previewPanel);
}

window.addEventListener("resize", syncBuilderColumnHeight);
window.addEventListener("load", syncBuilderColumnHeight);
requestAnimationFrame(syncBuilderColumnHeight);

})();