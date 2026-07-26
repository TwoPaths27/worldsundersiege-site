
(function(global){
 const CardTypes=Object.freeze({
  CHARACTER:"Character",ARMY:"Army",ANIMAL:"Animal",CONSTRUCT:"Construct",
  ITEM:"Item",EVENT:"Event",ACTION:"Action",STRONGHOLD:"Stronghold"
 });
 const DefaultCapabilities={};
 DefaultCapabilities[CardTypes.CHARACTER]={attack:true,actions:true,equip:true,operateConstructs:true};
 DefaultCapabilities[CardTypes.ARMY]={attack:true,actions:false,equip:false,operateConstructs:false};
 DefaultCapabilities[CardTypes.ANIMAL]={attack:true,actions:false,equip:false,operateConstructs:false};
 DefaultCapabilities[CardTypes.CONSTRUCT]={attack:false,actions:false,equip:false,operateConstructs:false};
 function normalizeCard(card){
   if(!card)return card;
   if(!card.types) card.types=card.type?[card.type]:[];
   if(!card.traits) card.traits=[];
   if(!card.capabilities){
      card.capabilities={};
      card.types.forEach(t=>Object.assign(card.capabilities,DefaultCapabilities[t]||{}));
   }
   return card;
 }
 function hasType(c,t){normalizeCard(c);return c.types.includes(t);}
 function hasCapability(c,k){normalizeCard(c);return !!c.capabilities[k];}
 global.CardTypes=CardTypes;
 global.normalizeCard=normalizeCard;
 global.hasType=hasType;
 global.hasCapability=hasCapability;
 global.isCharacter=c=>hasType(c,CardTypes.CHARACTER);
 global.isArmy=c=>hasType(c,CardTypes.ARMY);
 global.isAnimal=c=>hasType(c,CardTypes.ANIMAL);
 global.isConstruct=c=>hasType(c,CardTypes.CONSTRUCT);
 global.isItem=c=>hasType(c,CardTypes.ITEM);
 global.isEvent=c=>hasType(c,CardTypes.EVENT);
 global.isAction=c=>hasType(c,CardTypes.ACTION);
 global.isStronghold=c=>hasType(c,CardTypes.STRONGHOLD);
 global.isUnit=c=>[CardTypes.CHARACTER,CardTypes.ARMY,CardTypes.ANIMAL,CardTypes.CONSTRUCT].some(t=>hasType(c,t));
 global.canAttack=c=>hasCapability(c,"attack");
 global.canUseActions=c=>hasCapability(c,"actions");
 global.canEquipItems=c=>hasCapability(c,"equip");
 global.canOperateConstructs=c=>hasCapability(c,"operateConstructs");
})(window);
