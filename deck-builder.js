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
const $ = id => document.getElementById(id);
const ids = ["deckName","newDeckBtn","saveDeckBtn","savedDecks","deleteDeckBtn","goldBalance","previewImage","formTabs","previewName","previewOwned","previewMeta","previewStats","previewCharacteristics","previewEffect","previewEffectName","previewEffectText","purchasePanel","deckSummary","deckStatus","deckList","emptyDeck","clearDeckBtn","strongholdSlot","armySlots","searchCards","typeFilter","rarityFilter","setFilter","costFilter","atkFilter","hpFilter","rangeFilter","spdFilter","ownedOnly","resetFilters","cardBrowser","emptyBrowser","visibleCount"];
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
function populateSaved(){const decks=loadDecks();els.savedDecks.innerHTML='<option value="">Load saved deck…</option>';Object.entries(decks).sort((a,b)=>(b[1].updated||0)-(a[1].updated||0)).forEach(([id,d])=>els.savedDecks.add(new Option(d.name,id)));els.savedDecks.value=activeDeckId||"";els.deleteDeckBtn.disabled=!activeDeckId;}
async function setImg(img,path){img.src="card-back.png";try{img.src=window.WUSAssets?await WUSAssets.getObjectUrl(path):encodeURI(path);}catch{img.src=encodeURI(path);}}
function formData(card){return card.forms?.[selectedForm]||card;}
function purchasePrice(card){return card?.isSecret||card?.rarity==="Secret Rare"?null:(BUY_PRICE[card?.rarity]??null);}
function ownershipLimit(card){return window.WUSCollection?.getLimit(card) ?? card.copyLimit ?? 3;}
function canPurchase(card){const price=purchasePrice(card);return price!==null&&owned(card.id)<ownershipLimit(card);}
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
  renderPreview();renderDeck();renderBrowser();
}
function selectCard(card){selectedCard=card;selectedForm=0;renderPreview();document.querySelectorAll('.browser-card').forEach(e=>e.classList.toggle('selected',e.dataset.id===card.id));}
function renderPreview(){const c=selectedCard;if(!c)return;const f=formData(c);setImg(els.previewImage,c.image);els.previewName.textContent=f.name||c.name;els.previewOwned.textContent=`Owned ${owned(c.id)} / ${c.copyLimit}`;els.previewMeta.textContent=`${c.id} · ${c.rarity} · ${c.types.join(" / ")}${c.isSecret?" · Secret printing":""}`;els.previewStats.innerHTML=[["COST",f.cost],["ATK",f.atk],["HP",f.hp],["RNG",f.range],["SPD",f.spd]].map(([k,v])=>v===null||v===undefined?'':`<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');els.previewCharacteristics.innerHTML=(f.characteristics||[]).map(x=>`<span class="tag">${x}</span>`).join('');els.previewEffect.hidden=!(f.effectName||f.effectText);els.previewEffectName.textContent=f.effectName||'Effect';els.previewEffectText.textContent=f.effectText||'No additional effect.';
const price=purchasePrice(c), have=owned(c.id), limit=ownershipLimit(c), gold=window.WUSCollection?.load().gold||0;
els.purchasePanel.classList.remove("purchase-error");
if(c.isSecret||c.rarity==="Secret Rare"){
  els.purchasePanel.hidden=false;els.purchasePanel.innerHTML='<strong>Secret Rare</strong><span>Only obtainable from booster packs.</span>';
}else if(price!==null&&have<limit){
  els.purchasePanel.hidden=false;els.purchasePanel.innerHTML=`<div><strong>Buy another copy</strong><span>${price.toLocaleString()} Gold · Owned ${have}/${limit}</span></div><button id="previewBuyButton" class="primary-btn" ${gold<price?'disabled':''}>Buy</button>`;
  els.purchasePanel.querySelector('button')?.addEventListener('click',()=>buyCard(c));
}else if(price!==null){
  els.purchasePanel.hidden=false;els.purchasePanel.innerHTML='<strong>Maximum Owned</strong><span>No more copies can be purchased.</span>';
}else els.purchasePanel.hidden=true;
if(c.forms){els.formTabs.hidden=false;els.formTabs.innerHTML=c.forms.map((x,i)=>`<button class="form-tab ${i===selectedForm?'active':''}" data-form="${i}">${x.name}</button>`).join('');els.formTabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedForm=Number(b.dataset.form);renderPreview();});}else{els.formTabs.hidden=true;els.formTabs.innerHTML='';}}
function addCard(id){const c=byId[id];if(!c||!canAdd(c))return;if(isStronghold(c))stronghold=id;else if(isArmy(c))armies.push(id);else mainDeck[id]=(mainDeck[id]||0)+1;saveActive();renderDeck();renderBrowser();}
function removeCard(id){const c=byId[id];if(!c)return;if(isStronghold(c)){if(stronghold===id)stronghold=null;}else if(isArmy(c)){armies=armies.filter(x=>x!==id);}else if(mainDeck[id]){mainDeck[id]-=1;if(mainDeck[id]<=0)delete mainDeck[id];}saveActive();renderDeck();renderBrowser();}
function slotMarkup(card,kind,index){if(!card)return `<div class="special-slot empty"><span>${kind==='Stronghold'?'Choose 1 Stronghold':`Army Slot ${index+1}`}</span><small>${kind==='Stronghold'?'This is your deck’s main card.':'Choose a different Army card.'}</small></div>`;return `<article class="special-slot filled ${card.isSecret?'secret':''}" data-special-id="${card.id}"><img src="card-back.png" alt=""><div><strong>${card.name}</strong><small>${card.id} · ${card.rarity}</small><small>Owned ${owned(card.id)}</small></div><button class="special-remove" aria-label="Remove ${card.name}">×</button></article>`;}
function renderSpecialSections(){const sh=stronghold?byId[stronghold]:null;els.strongholdSlot.innerHTML=slotMarkup(sh,"Stronghold",0);if(sh){const row=els.strongholdSlot.querySelector('[data-special-id]');setImg(row.querySelector('img'),sh.image);row.onmouseenter=()=>selectCard(sh);row.querySelector('button').onclick=()=>removeCard(sh.id);}els.armySlots.innerHTML=Array.from({length:ARMY_LIMIT},(_,i)=>slotMarkup(armies[i]?byId[armies[i]]:null,"Army",i)).join('');els.armySlots.querySelectorAll('[data-special-id]').forEach(row=>{const c=byId[row.dataset.specialId];setImg(row.querySelector('img'),c.image);row.onmouseenter=()=>selectCard(c);row.querySelector('button').onclick=()=>removeCard(c.id);});}
function renderDeck(){const entries=Object.entries(mainDeck).filter(([,q])=>q>0).sort(([a],[b])=>byId[a].name.localeCompare(byId[b].name));const total=mainTotal();els.deckSummary.textContent=`${total} / ${MAIN_DECK_LIMIT} cards · ${entries.length} unique`;els.emptyDeck.hidden=entries.length>0;els.deckList.innerHTML='';let violations=[];const groupTotals={};entries.forEach(([id,q])=>{const c=byId[id];groupTotals[c.gameplayId]=(groupTotals[c.gameplayId]||0)+q;if(q>owned(id))violations.push(`${c.name}: deck uses ${q}, owned ${owned(id)}`);});Object.entries(groupTotals).forEach(([gid,q])=>{const c=DB.find(x=>x.gameplayId===gid);if(q>c.copyLimit)violations.push(`${c.name}: ${q}/${c.copyLimit} shared copies`);});if(total!==MAIN_DECK_LIMIT)violations.push(`Main deck must contain exactly ${MAIN_DECK_LIMIT} cards (${total}/${MAIN_DECK_LIMIT})`);if(!stronghold)violations.push('Choose exactly 1 Stronghold');else if(owned(stronghold)<1)violations.push(`${byId[stronghold].name}: not owned`);if(armies.length>ARMY_LIMIT)violations.push(`Choose no more than ${ARMY_LIMIT} Armies`);armies.forEach(id=>{if(owned(id)<1)violations.push(`${byId[id].name}: not owned`);});els.deckStatus.className=`deck-status ${violations.length?'invalid':'valid'}`;els.deckStatus.textContent=violations.length?violations.join(' · '):`Deck ready: ${MAIN_DECK_LIMIT} cards, 1 Stronghold, ${armies.length} Arm${armies.length===1?'y':'ies'}.`;
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
function renderBrowser(){const list=DB.filter(matches);els.visibleCount.textContent=`${list.length} shown`;els.emptyBrowser.hidden=list.length>0;els.cardBrowser.innerHTML='';list.forEach(c=>{const have=owned(c.id);const div=document.createElement('article');div.className=`browser-card ${have?'':'unowned'} ${c.isSecret?'secret':''}`;div.dataset.id=c.id;div.title=`${c.name} · ${c.id} · ${c.rarity} · Owned ${have} · ${deckUseLabel(c)}`;const price=purchasePrice(c), limit=ownershipLimit(c), purchasable=canPurchase(c);
const purchaseMarkup=c.isSecret?'':(purchasable?`<div class="buy-overlay"><strong>${price.toLocaleString()} Gold</strong><span>Owned ${have}/${limit}</span><button class="buy-card-btn" ${window.WUSCollection.load().gold<price?'disabled':''}>Buy Copy</button></div>`:(price!==null?`<div class="buy-overlay maxed"><strong>Maximum Owned</strong><span>${have}/${limit} copies</span></div>`:''));
div.innerHTML=`<img class="browser-thumb" src="card-back.png" alt="${c.name}">${purchaseMarkup}<div class="browser-card-controls"><span class="browser-quantity">${isStronghold(c)?(stronghold===c.id?'Selected':'Stronghold'):isArmy(c)?(armies.includes(c.id)?'Selected':'Army'):`${printingQty(c.id)} / ${have}`}</span><button class="browser-add" aria-label="${addLabel(c)}" ${canAdd(c)?'':'disabled'}>+</button></div>`;setImg(div.querySelector('img'),c.image);div.onclick=()=>selectCard(c);div.ondblclick=()=>addCard(c.id);div.onmouseenter=()=>selectCard(c);div.querySelector('.browser-add').onclick=e=>{e.stopPropagation();addCard(c.id)};div.querySelector('.buy-card-btn')?.addEventListener('click',e=>{e.stopPropagation();selectCard(c);buyCard(c)});els.cardBrowser.append(div);});if(selectedCard)document.querySelector(`[data-id="${selectedCard.id}"]`)?.classList.add('selected');}
function resetFilters(){
  els.searchCards.value="";
  ["typeFilter","rarityFilter","setFilter","costFilter","atkFilter","hpFilter","rangeFilter","spdFilter"].forEach(id=>els[id].value="All");
  els.ownedOnly.checked=false;
  renderBrowser();
}
function newDeck(){mainDeck={};stronghold=null;armies=[];activeDeckId=null;els.deckName.value='New Deck';saveActive();populateSaved();renderDeck();renderBrowser();}
els.newDeckBtn.onclick=newDeck;els.clearDeckBtn.onclick=()=>{if(confirm('Remove the main deck, Stronghold, and all Armies?')){mainDeck={};stronghold=null;armies=[];saveActive();renderDeck();renderBrowser();}};els.saveDeckBtn.onclick=()=>{const decks=loadDecks();const id=activeDeckId||`deck-${Date.now()}`;decks[id]={name:els.deckName.value.trim()||'Untitled Deck',...currentState(),updated:Date.now()};storeDecks(decks);activeDeckId=id;populateSaved();};els.savedDecks.onchange=()=>{const id=els.savedDecks.value;if(!id)return;const d=loadDecks()[id];if(!d)return;activeDeckId=id;applyState(d);els.deckName.value=d.name;saveActive();populateSaved();renderDeck();renderBrowser();};els.deleteDeckBtn.onclick=()=>{if(!activeDeckId||!confirm('Delete this saved deck?'))return;const decks=loadDecks();delete decks[activeDeckId];storeDecks(decks);newDeck();};["searchCards","typeFilter","rarityFilter","setFilter","costFilter","atkFilter","hpFilter","rangeFilter","spdFilter","ownedOnly"].forEach(id=>{
  els[id].addEventListener(id==="searchCards"?"input":"change",renderBrowser);
});els.resetFilters.onclick=resetFilters;window.addEventListener('wus-player-data-changed',()=>{els.goldBalance.textContent=`${WUSCollection.load().gold.toLocaleString()} Gold`;renderDeck();renderBrowser();renderPreview();});
function init(){populateFilters();populateSaved();try{const active=JSON.parse(localStorage.getItem(ACTIVE_KEY));if(active){applyState(active);els.deckName.value=active.name||'New Deck';}else{const legacy=JSON.parse(localStorage.getItem(LEGACY_ACTIVE_KEY));if(legacy){applyState(legacy);els.deckName.value=legacy.name||'New Deck';}}}catch{}els.goldBalance.textContent=`${(WUSCollection?.load().gold||0).toLocaleString()} Gold`;renderDeck();renderBrowser();if(DB.length)selectCard(DB.find(c=>owned(c.id)>0&&!c.isSecret)||DB[0]);}
init();
})();
