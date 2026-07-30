"use strict";

/*
 * Worlds Under Siege — Unified Card Database v19.9.7
 *
 * This is the single authoritative card catalog used by the game and Deck Builder.
 * It also owns normalization, indexed lookups, compatibility aliases, and startup
 * validation so older engine modules can migrate without duplicating card data.
 */
(function initUnifiedCardDatabase(global) {
  const SOURCE_CARDS = [
  {
    "id": "BOA-001",
    "name": "King Arthur",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 5,
    "atk": 6,
    "hp": 6,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "King",
      "Knight",
      "Brit"
    ],
    "effectName": "Chosen King",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-001 King Arthur.jpg",
    "isSecret": false,
    "gameplayId": "BOA-001",
    "sharedCardId": "KING_ARTHUR",
    "recruitAudio": {"voice":"../sounds/King Arthur.mp3","music":"../sounds/King Arthur 2.mp3","voiceVolume":1,"musicVolume":0.32,"duckBackgroundMusic":true},
    "copyLimit": 3,
    "effectText": "Other Units you control gain +2 Attack and +1 Speed."
  },
  {
    "id": "BOA-002",
    "name": "Merlin",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 7,
    "atk": 6,
    "hp": 10,
    "range": 3,
    "spd": 1,
    "characteristics": [
      "Wizard"
    ],
    "effectName": "Magical Prowess",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-002 Merlin.jpg",
    "isSecret": false,
    "gameplayId": "BOA-002",
    "copyLimit": 3,
    "effectText": "The first Action Merlin becomes the User of during your turns cost 0 to play."
  },
  {
    "id": "BOA-003",
    "name": "Sir Lancelot",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 6,
    "atk": 8,
    "hp": 6,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Charge Into Battle",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-003 Sir Lancelot.jpg",
    "isSecret": false,
    "gameplayId": "BOA-003",
    "copyLimit": 3,
    "effectText": "Whenever Sir Lancelot is revealed, he gains +3 Speed until the end of the turn. He can only attack Units and Constructs during that turn."
  },
  {
    "id": "BOA-004",
    "name": "Sir Yvain",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 6,
    "atk": 6,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Knight of the Lion",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-004 Sir Yvain.jpg",
    "isSecret": false,
    "gameplayId": "BOA-004",
    "copyLimit": 3,
    "effectText": "Whenever Sir Yvain is revealed, you may search your Deck for one Animal named 'Lion' and put into play adjacent to Sir Yvain. Then Mount Sir Yvain to him."
  },
  {
    "id": "BOA-005",
    "name": "Sir Galahad",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 5,
    "atk": 5,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Radiant Presence",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-005 Sir Galahad.jpg",
    "isSecret": false,
    "gameplayId": "BOA-005",
    "copyLimit": 3,
    "effectText": "Galahad gains +1 Attack for each other Unit you control."
  },
  {
    "id": "BOA-006",
    "name": "Sir Kay",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 5,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Radiating Aura",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-006 Sir Kay.jpg",
    "isSecret": false,
    "gameplayId": "BOA-006",
    "copyLimit": 3,
    "effectText": "At the end of each of your turns, deal 2 damage to each Unit and Construct in Sir Kay's range."
  },
  {
    "id": "BOA-007",
    "name": "Sir Lucan",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 4,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Final Toast",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-007 Sir Lucan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-007",
    "copyLimit": 3,
    "effectText": "Whenever Sir Lucan dies, remove all Damage Counters from all other Units you control."
  },
  {
    "id": "BOA-008",
    "name": "Sir Gawain",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 3,
    "atk": 2,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Knight of Light",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-008 Sir Gawain.jpg",
    "isSecret": false,
    "gameplayId": "BOA-008",
    "copyLimit": 3,
    "effectText": "Sir Gawain gains +1 Attack for each card in your hand."
  },
  {
    "id": "BOA-009",
    "name": "Sir Bedivere",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "The Final Duty",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-009 Sir Bedivere.jpg",
    "isSecret": false,
    "gameplayId": "BOA-009",
    "copyLimit": 3,
    "effectText": "Whenever Sir Bedivere is revealed, you may choose one Target Item from your Discard Pile and place it into your hand."
  },
  {
    "id": "BOA-010",
    "name": "Sir Sagremore",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 2,
    "atk": 4,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Thirst for Battle",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-010 Sir Sagremore.jpg",
    "isSecret": false,
    "gameplayId": "BOA-010",
    "copyLimit": 3,
    "effectText": "If one or more opposing Units or Constructs are in Sir Sagremore's Range, he must attack one of those. Sir Sagremore gains +1 Speed the turn he is revealed."
  },
  {
    "id": "BOA-011",
    "name": "Lady of the Lake",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 2,
    "atk": 0,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Divine",
      "Enchantress"
    ],
    "effectName": "Divine Blessing",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-011 Lady of the Lake.jpg",
    "isSecret": false,
    "gameplayId": "BOA-011",
    "copyLimit": 3,
    "effectText": "Whenever Lady of the Lake is revealed, you may search your Deck for one Item card and add it to your hand. Then shuffle your Deck."
  },
  {
    "id": "BOA-012",
    "name": "Queen Guinevere",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 1,
    "atk": 0,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Queen",
      "Brit"
    ],
    "effectName": "Queen of the Knights",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-012 Queen Guinevere.jpg",
    "isSecret": false,
    "gameplayId": "BOA-012",
    "copyLimit": 3,
    "effectText": "Knights you control gain +1 Range and +1 Speed."
  },
  {
    "id": "BOA-013",
    "name": "Sir Mordred",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 4,
    "atk": 4,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Seeds of Treason",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-013 Mordred.jpg",
    "isSecret": false,
    "gameplayId": "BOA-013",
    "copyLimit": 3,
    "effectText": "Whenever Mordred is revealed during your turn, you may take control of Target Character you don't control in Mordred's Range until the end of the turn."
  },
  {
    "id": "BOA-014",
    "name": "Sir Percival",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 2,
    "atk": 3,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Purest Knight",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-014 Sir Percival.jpg",
    "isSecret": false,
    "gameplayId": "BOA-014",
    "copyLimit": 3,
    "effectText": "Whenever Sir Percival is revealed, you may remove all Damage Counters from one Target Unit you control."
  },
  {
    "id": "BOA-015",
    "name": "Sir Bors",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 7,
    "atk": 9,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Camelot's Finest",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-015 Sir Bors.jpg",
    "isSecret": false,
    "gameplayId": "BOA-015",
    "copyLimit": 3,
    "effectText": "Sir Bors gains +1 Attack for each Item you control. Sir Bors can attack up to X additional Units and / or Constructs each turn where X = the number of Items equipped to him."
  },
  {
    "id": "BOA-016",
    "name": "Sir Tristan",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 3,
    "atk": 4,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Cunning Strike",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-016 Sir Tristan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-016",
    "copyLimit": 3,
    "effectText": "Units in Range of Sir Tristan get -1 Attack for each Item you control."
  },
  {
    "id": "BOA-017",
    "name": "Sir Gareth",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 1,
    "atk": 1,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Rescuer",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-017 Sir Gareth.jpg",
    "isSecret": false,
    "gameplayId": "BOA-017",
    "copyLimit": 3,
    "effectText": "Characters adjacent to Sir Gareth cannot be Targeted by your opponents effects."
  },
  {
    "id": "BOA-018",
    "name": "Sir Argavain",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 5,
    "atk": 5,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "No More Secrets",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-018 Sir Argavain.jpg",
    "isSecret": false,
    "gameplayId": "BOA-018",
    "copyLimit": 3,
    "effectText": "Players play the game with their hands revealed."
  },
  {
    "id": "BOA-019",
    "name": "Sir Gaheris",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 7,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "The Brother",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-019 Sir Gaheris.jpg",
    "isSecret": false,
    "gameplayId": "BOA-019",
    "copyLimit": 3,
    "effectText": "When Sir Gaheris is revealed, if you don't control another Knight with 'Sir' in their name, return Sir Gaheris to your hand."
  },
  {
    "id": "BOA-020",
    "name": "Dracula",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 6,
    "atk": 6,
    "hp": 8,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "Vampire",
      "Undead"
    ],
    "effectName": "Lord of the Dead",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-020 Dracula.jpg",
    "isSecret": false,
    "gameplayId": "BOA-020",
    "copyLimit": 3,
    "effectText": "Whenever Dracula is revealed, you may put a Character from your Discard Pile into play Revealed and adjacent to Dracula."
  },
  {
    "id": "BOA-021",
    "name": "Frankenstein's Monster",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 7,
    "atk": 0,
    "hp": 0,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Undead"
    ],
    "effectName": "Unnatural Creation",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-021 Frankenstein's Monster.jpg",
    "isSecret": false,
    "gameplayId": "BOA-021",
    "copyLimit": 3,
    "effectText": "Whenever Frankenstein's Monster is revealed, you must banish 3 Characters from your Discard Pile. If you cannot, sacrifice him. Frankenstein's Monster gains the ATK of one of the banished characters, the HP of another, and the effects of the third."
  },
  {
    "id": "BOA-022",
    "name": "Yeti",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 6,
    "atk": 10,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Sasquatch"
    ],
    "effectName": "Snow Giant",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-022 Yeti.jpg",
    "isSecret": false,
    "gameplayId": "BOA-022",
    "copyLimit": 3,
    "effectText": "Whenever Yeti is revealed, you must Discard 2 cards. If you cannot, return Yeti to your hand."
  },
  {
    "id": "BOA-023",
    "name": "Bertrand Calliet",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 5,
    "atk": 6,
    "hp": 6,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Werewolf"
    ],
    "effectName": "Hunter of the Moon",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-023 Bertrand Calliet.jpg",
    "isSecret": false,
    "gameplayId": "BOA-023",
    "copyLimit": 3,
    "effectText": "Bertrand Calliet gains +6 Attack during the turn he is revealed. At the end of each turn, you may return Bertrand Calliet to your hand."
  },
  {
    "id": "BOA-024",
    "name": "Headless Horseman",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 6,
    "hp": 3,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Undead",
      "Horror"
    ],
    "effectName": "Night Rider",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-024 Headless Horseman.jpg",
    "isSecret": false,
    "gameplayId": "BOA-024",
    "copyLimit": 3,
    "effectText": "If another Unit died this turn, Headless Horseman cannot recieve Damage until the end of the turn."
  },
  {
    "id": "BOA-025",
    "name": "Big Foot",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 10,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Sasquatch"
    ],
    "effectName": "Elusive Giant",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-025 Big Foot.jpg",
    "isSecret": false,
    "gameplayId": "BOA-025",
    "copyLimit": 3,
    "effectText": "At the end of each of your turns, if Big Foot is revealed and in Range of an opposing Units Range, return Big Foot to your hand."
  },
  {
    "id": "BOA-026",
    "name": "Nosferatu",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 3,
    "atk": 4,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Vampire",
      "Undead"
    ],
    "effectName": "Hidden from the Sun",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-026 Nosferatu.jpg",
    "isSecret": false,
    "gameplayId": "BOA-026",
    "copyLimit": 3,
    "effectText": "At the end of each of your turns, deal 2 Damage to Nosferatu. Then you may discard a card to conceal him."
  },
  {
    "id": "BOA-027",
    "name": "Van Helsing",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 3,
    "atk": 2,
    "hp": 5,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Doctor"
    ],
    "effectName": "Rebuke the Wicked",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-027 Van Helsing.jpg",
    "isSecret": false,
    "gameplayId": "BOA-027",
    "copyLimit": 3,
    "effectText": "Whenever Van Helsing is revealed, you may destroy Target Unit in Range that has damage counters on it."
  },
  {
    "id": "BOA-028",
    "name": "Swamp Monster",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Horror"
    ],
    "effectName": "Strike from the Deep",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-028 Swamp Monster.jpg",
    "isSecret": false,
    "gameplayId": "BOA-028",
    "copyLimit": 3,
    "effectText": "Whenever Swamp Monster attacks and deals combat damage to a Unit during the turn he was first revealed, destroy that Unit."
  },
  {
    "id": "BOA-029",
    "name": "Boogeyman",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 2,
    "atk": 4,
    "hp": 2,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Horror"
    ],
    "effectName": "Monster in the Closet",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-029 Boogeyman.jpg",
    "isSecret": false,
    "gameplayId": "BOA-029",
    "copyLimit": 3,
    "effectText": "At the end of each of your turns, conceal Boogeyman."
  },
  {
    "id": "BOA-030",
    "name": "Nelly Butler",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 2,
    "atk": 1,
    "hp": 4,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Spirit",
      "Undead"
    ],
    "effectName": "Eerie Prediction",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-030 Nelly Butler.jpg",
    "isSecret": false,
    "gameplayId": "BOA-030",
    "copyLimit": 3,
    "effectText": "Whenever you play a concealed Unit from your hand OR conceal a revealed Unit on the Battlefield that you control, draw a card. This only activates once per turn. Whenever Nelly Butler dies, return her to your hand."
  },
  {
    "id": "BOA-031",
    "name": "Invisible Man",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 2,
    "atk": 2,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [],
    "effectName": "Stealthy Movements",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-031 Invisible Man.jpg",
    "isSecret": false,
    "gameplayId": "BOA-031",
    "copyLimit": 3,
    "effectText": "Invisible Man takes 0 Damage while attacking. Discard a card: Conceal Invisible Man. You can only activate this during your turn and you can only activate this once per turn."
  },
  {
    "id": "BOA-032",
    "name": "Undead Widow",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 2,
    "atk": 3,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Undead"
    ],
    "effectName": "Love of the Dead",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-032 Undead Widow.jpg",
    "isSecret": false,
    "gameplayId": "BOA-032",
    "copyLimit": 3,
    "effectText": "You may play Undead Widow fro your Discard Pile. You may only activate the effect of one Undead Widow during each of your turns."
  },
  {
    "id": "BOA-033",
    "name": "Dr. Jekyl / Mr. Hyde",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 1,
    "atk": 1,
    "hp": 1,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Doctor",
      "Scientist"
    ],
    "effectName": "Duality",
    "forms": [
      {
        "name": "Dr. Jekyl",
        "cost": 1,
        "atk": 1,
        "hp": 1,
        "range": 1,
        "spd": 1,
        "characteristics": [
          "Doctor",
          "Scientist"
        ],
        "effectName": "Duality",
        "effectText": "Whenever another Unit dies, flip this card to its other side."
      },
      {
        "name": "Mr. Hyde",
        "cost": 0,
        "atk": 4,
        "hp": 4,
        "range": 1,
        "spd": 1,
        "characteristics": [
          "Doctor",
          "Scientist"
        ],
        "effectName": "Split Personality",
        "effectText": "No additional effect."
      }
    ],
    "hasAlternateForm": true,
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-033 Dr Jekyl.jpg",
    "isSecret": false,
    "gameplayId": "BOA-033",
    "copyLimit": 3,
    "effectText": "Whenever another Unit dies, flip this card to its other side."
  },
  {
    "id": "BOA-034",
    "name": "Dr. Frankenstein",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 1,
    "atk": 0,
    "hp": 2,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Doctor",
      "Scientist"
    ],
    "effectName": "Bring Back the Dead",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-034 Dr Frankenstein.jpg",
    "isSecret": false,
    "gameplayId": "BOA-034",
    "copyLimit": 3,
    "effectText": "Whenever Dr. Frankenstein is revealed, return Target Character from your Discard Pile to your hand."
  },
  {
    "id": "BOA-035",
    "name": "The Phantom",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 1,
    "atk": 0,
    "hp": 2,
    "range": 1,
    "spd": 1,
    "characteristics": [],
    "effectName": "Illusion of Music",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-035 The Phantom.jpg",
    "isSecret": false,
    "gameplayId": "BOA-035",
    "copyLimit": 3,
    "effectText": "Whenever you Discard your first card during a turn, you may choose one: 1.) Each opponent Discards a card. 2.) Draw 1 card."
  },
  {
    "id": "BOA-036",
    "name": "Strigoi",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 5,
    "hp": 4,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Vampire",
      "Undead"
    ],
    "effectName": "Blood Drain",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-036 Strigoi.jpg",
    "isSecret": false,
    "gameplayId": "BOA-036",
    "copyLimit": 3,
    "effectText": "Whenever a Unit you don't control dies, remove 2 Damage counters from all Units you control."
  },
  {
    "id": "BOA-037",
    "name": "Baba Yaga",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 2,
    "atk": 1,
    "hp": 4,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Witch"
    ],
    "effectName": "Disappear",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-037 Baba Yaga.jpg",
    "isSecret": false,
    "gameplayId": "BOA-037",
    "copyLimit": 3,
    "effectText": "Whenever Baba Yaga is revealed, you may move her to a non-occupied space within her range."
  },
  {
    "id": "BOA-038",
    "name": "Leshy",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 3,
    "atk": 4,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Deity"
    ],
    "effectName": "Forest Domain",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-038 Leshy.jpg",
    "isSecret": false,
    "gameplayId": "BOA-038",
    "copyLimit": 3,
    "effectText": "The printed Range of all Units becomes 1 as long as you control Leshy."
  },
  {
    "id": "BOA-039",
    "name": "Tarzan",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 5,
    "atk": 5,
    "hp": 6,
    "range": 1,
    "spd": 3,
    "characteristics": [],
    "effectName": "Beast Master",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-039 Tarzan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-039",
    "copyLimit": 3,
    "effectText": "Whenever Tarzan is revealed, you may put into play one Animal from your hand, adjacent to Tarzan without paying its cost."
  },
  {
    "id": "BOA-040",
    "name": "Mbonga",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 5,
    "atk": 4,
    "hp": 7,
    "range": 2,
    "spd": 2,
    "characteristics": [
      "Warrior",
      "Kulonga"
    ],
    "effectName": "Kulonga Leader",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-040 Mbonga.jpg",
    "isSecret": false,
    "gameplayId": "BOA-040",
    "copyLimit": 3,
    "effectText": "Whenever a Character you control attacks, you may put into play one 'Kulonga Warrior' Army adjacent to Mbonga. Charactesr and Armies you control deal double Batle Damage to Animals."
  },
  {
    "id": "BOA-041",
    "name": "Jane Porter",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 1,
    "atk": 0,
    "hp": 2,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Explorer"
    ],
    "effectName": "Curious Scholar",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-041 Jane Porter.jpg",
    "isSecret": false,
    "gameplayId": "BOA-041",
    "copyLimit": 3,
    "effectText": "Whenever you reveal another Unit, if you have 6 or fewer cards in your hand, draw a card. This effect only activates once per turn."
  },
  {
    "id": "BOA-042",
    "name": "Professor Porter",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 1,
    "atk": 0,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Explorer"
    ],
    "effectName": "Artifact Expert",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-042 Professor Porter.jpg",
    "isSecret": false,
    "gameplayId": "BOA-042",
    "copyLimit": 3,
    "effectText": "Items and Constructs in your hand cost one less to play."
  },
  {
    "id": "BOA-043",
    "name": "William Clayton",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 4,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Explorer"
    ],
    "effectName": "Silver Spoon",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-043 William Clayton.jpg",
    "isSecret": false,
    "gameplayId": "BOA-043",
    "copyLimit": 3,
    "effectText": "At the beginning of your turn before you draw, if you control an Item, you may raise your Max Energy by 1. If you don't control an Item, lower your Max Energy by 1."
  },
  {
    "id": "BOA-044",
    "name": "Rokoff",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 2,
    "atk": 3,
    "hp": 2,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Explorer"
    ],
    "effectName": "Master Schemer",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-044 Rokoff.jpg?v=20260730",
    "isSecret": false,
    "gameplayId": "BOA-044",
    "copyLimit": 3,
    "effectText": "Whenever Rokoff is revealed, choose and reveal Target players hand. Discard one card from that players hand."
  },
  {
    "id": "BOA-045",
    "name": "Robin Hood",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 3,
    "atk": 2,
    "hp": 5,
    "range": 3,
    "spd": 1,
    "characteristics": [
      "Outlaw"
    ],
    "effectName": "For the Poor",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-045 Robin Hood.jpg",
    "isSecret": false,
    "gameplayId": "BOA-045",
    "copyLimit": 3,
    "effectText": "Whenever Robin Hood becomes the User of an Action, he may deal 1 Damage to any Target in his range. The Targets controller Discards one card at random."
  },
  {
    "id": "BOA-046",
    "name": "Little John",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 5,
    "atk": 5,
    "hp": 7,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Outlaw"
    ],
    "effectName": "Staff of the Bridge",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-046 Little John.jpg",
    "isSecret": false,
    "gameplayId": "BOA-046",
    "copyLimit": 3,
    "effectText": "Whenever a Unit you don't control moves to a space in Little John's Range, deal 1 Damage to that Unit."
  },
  {
    "id": "BOA-047",
    "name": "The Abbot",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 3,
    "atk": 1,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Cleric"
    ],
    "effectName": "Holy Word",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-047 The Abbot.jpg?v=20260730",
    "isSecret": false,
    "gameplayId": "BOA-047",
    "copyLimit": 3,
    "effectText": "Opposing Characters in The Abbot's Range have their effects Negated."
  },
  {
    "id": "BOA-048",
    "name": "Guy of Gisborne",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 4,
    "atk": 4,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Mercenary",
      "Assassin"
    ],
    "effectName": "Hired to Kill",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-048 Guy of Gisborne.jpg",
    "isSecret": false,
    "gameplayId": "BOA-048",
    "copyLimit": 3,
    "effectText": "Whenever an opposing Unit dies, draw a card. Then Discard one card."
  },
  {
    "id": "BOA-049",
    "name": "Sheriff of Nottingham",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 3,
    "atk": 2,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Noble"
    ],
    "effectName": "Excessive Taxation",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-049 Sheriff of Nottingham.jpg",
    "isSecret": false,
    "gameplayId": "BOA-049",
    "copyLimit": 3,
    "effectText": "Whenever an opponent draws their second card during a turn, they must discard one card."
  },
  {
    "id": "BOA-050",
    "name": "King Leonidas",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 6,
    "atk": 8,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Warrior",
      "King",
      "Spartan"
    ],
    "effectName": "Army of 300",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-050 King Leonidas.jpg",
    "isSecret": false,
    "gameplayId": "BOA-050",
    "copyLimit": 3,
    "effectText": "At the end of each of your turns, put into play X 'Spartan Soldier' Armies in your Recruting Area where X = the number of Units you control. Then if you control 30 or more armies, you win the game."
  },
  {
    "id": "BOA-051",
    "name": "Queen Gorgo",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 2,
    "atk": 0,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Queen",
      "Spartan"
    ],
    "effectName": "Queen's Counsel",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-051 Queen Gorgo.jpg",
    "isSecret": false,
    "gameplayId": "BOA-051",
    "copyLimit": 3,
    "effectText": "You may look at the top card of your Deck at anytime. You may play Characters from the top of your Deck as if it were in your hand."
  },
  {
    "id": "BOA-052",
    "name": "Dienkes",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 5,
    "atk": 4,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Warrior",
      "Spartan"
    ],
    "effectName": "In the Face of Death",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-052 Dienkes.jpg",
    "isSecret": false,
    "gameplayId": "BOA-052",
    "copyLimit": 3,
    "effectText": "Dienekes gains +1 Attack for each Damage Counter on him."
  },
  {
    "id": "BOA-053",
    "name": "Demophilus",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 4,
    "atk": 4,
    "hp": 6,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Warrior",
      "Spartan"
    ],
    "effectName": "Stand Fast",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-053 Demophilus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-053",
    "copyLimit": 3,
    "effectText": "At the end of each of your turns, each Character you control gains +1 Attack."
  },
  {
    "id": "BOA-054",
    "name": "Captain Ahab",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 4,
    "atk": 3,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Captain"
    ],
    "effectName": "Obsessive Hunter",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-054 Captain Ahab.jpg",
    "isSecret": false,
    "gameplayId": "BOA-054",
    "copyLimit": 3,
    "effectText": "Whenever Captain Ahab is revealed, you may destroy Target Unit you don't control with the highest Attack in Range. If it is a tie, you choose the Target."
  },
  {
    "id": "BOA-055",
    "name": "Ishmael",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 1,
    "atk": 1,
    "hp": 2,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Explorer"
    ],
    "effectName": "Call Me Ishmael",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-055 Ishmael.jpg",
    "isSecret": false,
    "gameplayId": "BOA-055",
    "copyLimit": 3,
    "effectText": "Whenever an opponent reveals a Unit, draw a card. This only activates once per turn."
  },
  {
    "id": "BOA-056",
    "name": "King Richard I",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 8,
    "atk": 9,
    "hp": 9,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "King",
      "Knight",
      "Crusader",
      "Brit"
    ],
    "effectName": "Richard the Lionheart",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-056 King Richard I.jpg",
    "isSecret": false,
    "gameplayId": "BOA-056",
    "copyLimit": 3,
    "effectText": "Opposing Units get -2 Attack. If an opposing Unit has 2 or more Speed, lower its Speed by 1."
  },
  {
    "id": "BOA-057",
    "name": "William Marshal",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 10,
    "atk": 12,
    "hp": 12,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "Greatest Knight",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-057 William Marshal.jpg",
    "isSecret": false,
    "gameplayId": "BOA-057",
    "copyLimit": 3,
    "effectText": "William Marshal takes 0 damage from Battle."
  },
  {
    "id": "BOA-058",
    "name": "King Henry II",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 5,
    "atk": 4,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "King",
      "Knight",
      "Brit"
    ],
    "effectName": "Royal Supremacy",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-058 King Henry II.jpg",
    "isSecret": false,
    "gameplayId": "BOA-058",
    "copyLimit": 3,
    "effectText": "Negate the Actions used by Units you don't control that are in King Henry II's range."
  },
  {
    "id": "BOA-059",
    "name": "Henry the Young",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 3,
    "atk": 4,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "King",
      "Knight",
      "Brit"
    ],
    "effectName": "King By Title",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-059 Henry the Young.jpg",
    "isSecret": false,
    "gameplayId": "BOA-059",
    "copyLimit": 3,
    "effectText": "Whenever Henry the Young is revealed, draw 2 cards if you control another King."
  },
  {
    "id": "BOA-060",
    "name": "King John",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 3,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "King",
      "Knight",
      "Brit"
    ],
    "effectName": "Unpopular King",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-060 King John.jpg",
    "isSecret": false,
    "gameplayId": "BOA-060",
    "copyLimit": 3,
    "effectText": "Characters cost 1 additional Energy to play from players hands."
  },
  {
    "id": "BOA-061",
    "name": "Prince Louis VIII",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Prince",
      "Knight",
      "Crusader",
      "French"
    ],
    "effectName": "Claim the Throne",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-061 Prince Louis VIII.jpg",
    "isSecret": false,
    "gameplayId": "BOA-061",
    "copyLimit": 3,
    "effectText": "Whenever Prince Louis VIII is revealed, you may take control of Target Item you don't contro and Equip it to Prince Louis VIII."
  },
  {
    "id": "BOA-062",
    "name": "Alexander the Great",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 10,
    "atk": 12,
    "hp": 10,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "King",
      "Warrior",
      "Macedonian"
    ],
    "effectName": "Conqueror of Worlds",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-062 Alexander the Great.jpg",
    "isSecret": false,
    "gameplayId": "BOA-062",
    "copyLimit": 3,
    "effectText": "Whenever Alexander the Great destroys a Unit or Construct by Battle, restore his Speed to 3. He can attack another Unit or Construct again this turn."
  },
  {
    "id": "BOA-063",
    "name": "Aristotle",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 3,
    "atk": 0,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Philosopher",
      "Gree"
    ],
    "effectName": "Philosopher's Insight",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-063 Aristotle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-063",
    "copyLimit": 3,
    "effectText": "During your Draw step, draw an additional card."
  },
  {
    "id": "BOA-064",
    "name": "Phillip II of Macedonia",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 4,
    "atk": 5,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "King",
      "Macedonian"
    ],
    "effectName": "Raising an Empire",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-064 Phillip II of Macedonia.jpg",
    "isSecret": false,
    "gameplayId": "BOA-064",
    "copyLimit": 3,
    "effectText": "Spaces adjacent to Phillip II of Macedonia are also considered to be your Recruiting Area."
  },
  {
    "id": "BOA-065",
    "name": "Olympias of Epirus",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 2,
    "atk": 0,
    "hp": 3,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Queen",
      "Macedonian"
    ],
    "effectName": "Mystic Aura",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-065 Olympias of Epirus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-065",
    "copyLimit": 3,
    "effectText": "The first Action opponents play each turn cost 2 more energy to play."
  },
  {
    "id": "BOA-066",
    "name": "Hephasteon",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 5,
    "atk": 4,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Warrior",
      "Macedonian"
    ],
    "effectName": "Shield-Brother",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-066 Hephasteon.jpg",
    "isSecret": false,
    "gameplayId": "BOA-066",
    "copyLimit": 3,
    "effectText": "If another Unit you control would be dealt Damage by Battle or by effect, you may have Hephasteon take that Damage instead."
  },
  {
    "id": "BOA-067",
    "name": "Perdiccas",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 6,
    "atk": 7,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Warrior",
      "Macedonian"
    ],
    "effectName": "Ursurper",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-067 Perdiccas.jpg",
    "isSecret": false,
    "gameplayId": "BOA-067",
    "copyLimit": 3,
    "effectText": "Units cost 1 less to play from your hand. If you control a 'King', Units cost 2 less from your hand instead."
  },
  {
    "id": "BOA-068",
    "name": "Cleitus the Black",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 2,
    "atk": 2,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Warrior",
      "Macedonian"
    ],
    "effectName": "Rescue the King",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-068 Cleitus the Black.jpg",
    "isSecret": false,
    "gameplayId": "BOA-068",
    "copyLimit": 3,
    "effectText": "Whenever another Character you control dies, you may sacrifice Cleitus the Black to return that Character to your hand instead."
  },
  {
    "id": "BOA-069",
    "name": "Arminius",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 4,
    "atk": 4,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Warrior",
      "German"
    ],
    "effectName": "Ambush",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-069 Arminius.jpg",
    "isSecret": false,
    "gameplayId": "BOA-069",
    "copyLimit": 3,
    "effectText": "Whenever another non-mounted Unit you control would be Attacked, you may return that Unit to our hand and pay Arminius Cost. If so, put Arminius occupying that same space. He becomes the new attack Target."
  },
  {
    "id": "BOA-070",
    "name": "Sun Tzu",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 3,
    "atk": 1,
    "hp": 6,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Philosopher"
    ],
    "effectName": "Art of War",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-070 Sun Tzu.jpg",
    "isSecret": false,
    "gameplayId": "BOA-070",
    "copyLimit": 3,
    "effectText": "While you are the player with the most cards in hand, opposing Units get -1 Range and -1 Speed (cannot reduce lower than 1 Range or Speed due to this effect.) Whenever you play an Action, draw a card. This only activates once per turn."
  },
  {
    "id": "BOA-071",
    "name": "Attlia the Hun",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 5,
    "atk": 7,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Emperor",
      "King",
      "Warrior",
      "Hun"
    ],
    "effectName": "Lightning Calvary",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-071 Attila the Hun.jpg",
    "isSecret": false,
    "gameplayId": "BOA-071",
    "copyLimit": 3,
    "effectText": "Whenever you reveal Attila the Hun or another Character, you may put into play from your hand one Animal with Mount in its Characteristics without paying its cost. Place it adjacent to that character and mount that Character to that Animal."
  },
  {
    "id": "BOA-072",
    "name": "Boudica",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 5,
    "atk": 5,
    "hp": 6,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Queen",
      "Warrior",
      "Celtic"
    ],
    "effectName": "Iceni Fury",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-072 Boudica.jpg",
    "isSecret": false,
    "gameplayId": "BOA-072",
    "copyLimit": 3,
    "effectText": "Whenever Boudica attacks, deal 1 damage to all opposing Units in her Range. If a Unit dies this way, repeat this effect until a Unit doesn't die."
  },
  {
    "id": "BOA-073",
    "name": "Leonardo Da Vinci",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 2,
    "atk": 1,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Inventor"
    ],
    "effectName": "Brilliant Contraptions",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-073 Leonardo Da Vinci.jpg",
    "isSecret": false,
    "gameplayId": "BOA-073",
    "copyLimit": 3,
    "effectText": "Whenever Leonardo Da Vinci is revealed, you may search yoru Deck for one Construct and put it into your hand. Shuffle. Constructs in your hand cost one less energy to play."
  },
  {
    "id": "BOA-074",
    "name": "King Cyrus",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 4,
    "atk": 5,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Emperor",
      "King",
      "Persian"
    ],
    "effectName": "Creating an Empire",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-074 King Cyrus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-074",
    "copyLimit": 3,
    "effectText": "If a Character you don't control dies while in Range of King Cyrus, put that Character into play revealed and adjacent to King Cyrus under your control."
  },
  {
    "id": "BOA-075",
    "name": "King Xerexes I",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 4,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Emperor",
      "King",
      "Persian"
    ],
    "effectName": "Overwhelming Army",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-075 King Xerxes I.jpg",
    "isSecret": false,
    "gameplayId": "BOA-075",
    "copyLimit": 3,
    "effectText": "Whenever King Xerxes or another Character you control is revealed, put into play one 'Persian Immortal' Army into play adjacent to King Xerxes I."
  },
  {
    "id": "BOA-076",
    "name": "King Darius III",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 4,
    "atk": 3,
    "hp": 7,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Emperor",
      "King",
      "Persian"
    ],
    "effectName": "Protect His Highness",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-076 King Darius III.jpg",
    "isSecret": false,
    "gameplayId": "BOA-076",
    "copyLimit": 3,
    "effectText": "Whenever King Darius III or another King you control would be dealt damage, you may sacrifice another Character you control to negate that Damage."
  },
  {
    "id": "BOA-077",
    "name": "Joan of Arc",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "French"
    ],
    "effectName": "Banner of Light",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-077 Joan of Arc.jpg",
    "isSecret": false,
    "gameplayId": "BOA-077",
    "copyLimit": 3,
    "effectText": "Whenever Joan of Arc is revealed, reveal all Units on the Battlefield. As long as you control Joan of Arc, Units cannot be concealed."
  },
  {
    "id": "BOA-078",
    "name": "King Charles VII",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 7,
    "atk": 7,
    "hp": 8,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "King",
      "French"
    ],
    "effectName": "End the 100 Year War",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-078 King Charles VII.jpg",
    "isSecret": false,
    "gameplayId": "BOA-078",
    "copyLimit": 3,
    "effectText": "Whenever King Charles VII is revealed, Units cannot attack until the beginning of your next turn. Players may only attack with one Unit per turn."
  },
  {
    "id": "BOA-079",
    "name": "Jean De Dunois",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 4,
    "atk": 3,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "French"
    ],
    "effectName": "Defender of Orleans",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-079 Jean De Dunois.jpg",
    "isSecret": false,
    "gameplayId": "BOA-079",
    "copyLimit": 3,
    "effectText": "As long as Jean De Dunois is in your Recruiting Area, all Damage dealt to your Stronghold is reduced to 0."
  },
  {
    "id": "BOA-080",
    "name": "John Talbot",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 6,
    "atk": 7,
    "hp": 7,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Knight",
      "Brit"
    ],
    "effectName": "No Retreat",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-080 John Talbot.jpg",
    "isSecret": false,
    "gameplayId": "BOA-080",
    "copyLimit": 3,
    "effectText": "Units you control cannot move left, right, or backwards. Units you control gain +4 attack while attacking another Unit or Construct."
  },
  {
    "id": "BOA-081",
    "name": "Mothman",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 7,
    "atk": 9,
    "hp": 6,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Mutant"
    ],
    "effectName": "Impending Doom",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-081 Mothman.jpg",
    "isSecret": false,
    "gameplayId": "BOA-081",
    "copyLimit": 3,
    "effectText": "Whenever an opponent draws a card, deal one damage to 1 Unit you don't control."
  },
  {
    "id": "BOA-082",
    "name": "The Grim Reaper",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Character",
    "cost": 10,
    "atk": 5,
    "hp": 17,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Divine",
      "Undead"
    ],
    "effectName": "Inescapeable Death",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-082 The Grim Reaper.jpg",
    "isSecret": false,
    "gameplayId": "BOA-082",
    "copyLimit": 3,
    "effectText": "The Grim Reaper must be played revealed and cannot be concealed. Whenever you reveal The Grim Reaper, destroy all other Units. Then deal 1 damage to each players Stronghold for each unit they controlled that died this way."
  },
  {
    "id": "BOA-083",
    "name": "Ghengis Khan",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Character",
    "cost": 9,
    "atk": 12,
    "hp": 7,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Emperor",
      "Mongul"
    ],
    "effectName": "Relentless Advance",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-083 Ghengis Khan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-083",
    "copyLimit": 3,
    "effectText": "Whenever a Unit you control wins a victory, deal 1 Damage eto Target Stronghold you don't control."
  },
  {
    "id": "BOA-084",
    "name": "Mulan",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 7,
    "atk": 7,
    "hp": 9,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Chinese"
    ],
    "effectName": "For Family, For Honor",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-084 Mulan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-084",
    "copyLimit": 3,
    "effectText": "Units you control get double Attack until the end of the battle while battling another Unit with a higher Attack Stat."
  },
  {
    "id": "BOA-085",
    "name": "Sun Wukong",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 10,
    "atk": 10,
    "hp": 12,
    "range": 3,
    "spd": 3,
    "characteristics": [],
    "effectName": "The Great Sage",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-085 Sun Wukong.jpg",
    "isSecret": false,
    "gameplayId": "BOA-085",
    "copyLimit": 3,
    "effectText": "Whenever Sun Wukong dies, you may put him into play in your recruting area without paying his cost at the beginning of the next turn."
  },
  {
    "id": "BOA-086",
    "name": "John Henry",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 6,
    "atk": 5,
    "hp": 9,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "American"
    ],
    "effectName": "Steel Railroad",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-086 John Henry.jpg",
    "isSecret": false,
    "gameplayId": "BOA-086",
    "copyLimit": 3,
    "effectText": "The first Unit you paly each turn cost 2 less Energy to play."
  },
  {
    "id": "BOA-087",
    "name": "Nostradamus",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 5,
    "atk": 2,
    "hp": 10,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Astrologer",
      "French"
    ],
    "effectName": "Forseen Fates",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-087 Nostradamus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-087",
    "copyLimit": 3,
    "effectText": "Whenever an opponent would Reveal their first Unit during their turn, you may reveal the top card of your Deck. If the revealed card is of the same type, you may put it into your Recruiting Area revealed without paying its cost."
  },
  {
    "id": "BOA-088",
    "name": "Ferdinand Magellan",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Character",
    "cost": 7,
    "atk": 4,
    "hp": 11,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Navigator",
      "Portugese"
    ],
    "effectName": "Circumnavigation",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-088 Ferdinand Magellan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-088",
    "copyLimit": 3,
    "effectText": "Whenever Ferdinand Magellan is revealed, each player shuffles their Respective Decks. Then each player draws 5 cards. Starting with you, each player may then play one Character from their hand into their Recruiting Area without paying its cost."
  },
  {
    "id": "BOA-089",
    "name": "Roland",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Character",
    "cost": 9,
    "atk": 10,
    "hp": 10,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Knight",
      "Paladin",
      "Frankish"
    ],
    "effectName": "Break the Line",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-089 Roland.jpg",
    "isSecret": false,
    "gameplayId": "BOA-089",
    "copyLimit": 3,
    "effectText": "Opposing Units cannot Protect other Units or Strongholds."
  },
  {
    "id": "BOA-090",
    "name": "Napoleon Bonaparte",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Character",
    "cost": 8,
    "atk": 8,
    "hp": 9,
    "range": 2,
    "spd": 2,
    "characteristics": [
      "Emperor",
      "French"
    ],
    "effectName": "Emperor's Campaign",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-090 Napoleon Bonaparte.jpg",
    "isSecret": false,
    "gameplayId": "BOA-090",
    "copyLimit": 3,
    "effectText": "Whenever a Unit you control wins a victory against a Unit in your opponent's Recruiting Area, deal damage equal to the destroyed Units Cost to the opposing Stronghold."
  },
  {
    "id": "BOA-091",
    "name": "Daredevil",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 2,
    "atk": 3,
    "hp": 3,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Horse",
      "Mount"
    ],
    "effectName": "Rider of the Night",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-091 Daredevil.jpg",
    "isSecret": false,
    "gameplayId": "BOA-091",
    "copyLimit": 3,
    "effectText": "Whenever a Character Mounts Daredevil, each opponent Discards one card from their hand."
  },
  {
    "id": "BOA-092",
    "name": "Moby Dick",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Animal",
    "cost": 10,
    "atk": 8,
    "hp": 15,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Animal",
      "Whale"
    ],
    "effectName": "Shroud of the Sea",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-092 Moby Dick.jpg",
    "isSecret": false,
    "gameplayId": "BOA-092",
    "copyLimit": 3,
    "effectText": "Once during each of your turns, you may Discard one card to conceal Moby Dick. If you do, he gains +3 Speed while concealed this turn. Whenever Moby Dick is revealed, destroy Target Unit or Construct in his Range."
  },
  {
    "id": "BOA-093",
    "name": "Kerchak",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Animal",
    "cost": 5,
    "atk": 7,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Ape"
    ],
    "effectName": "Ape King Authority",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-093 Kerchak.jpg",
    "isSecret": false,
    "gameplayId": "BOA-093",
    "copyLimit": 3,
    "effectText": "Animals you control deal double damage to Characters and Armies."
  },
  {
    "id": "BOA-094",
    "name": "Kala",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Animal",
    "cost": 3,
    "atk": 2,
    "hp": 5,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Animal",
      "Ape"
    ],
    "effectName": "Mother's Protection",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-094 Kala.jpg",
    "isSecret": false,
    "gameplayId": "BOA-094",
    "copyLimit": 3,
    "effectText": "Damage dealt ot Characters you control named 'Tarzan' and other Animals you control is reduced by 2."
  },
  {
    "id": "BOA-095",
    "name": "Gorilla",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 4,
    "atk": 5,
    "hp": 4,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Ape"
    ],
    "effectName": "Vine Swing",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-095 Gorilla.jpg",
    "isSecret": false,
    "gameplayId": "BOA-095",
    "copyLimit": 3,
    "effectText": "Gorilla is not unique. Whenever Gorilla, an Ape, Monkey, or character named 'Tarzan' is revealed, that Unit gains +2 Speed until the end of the turn."
  },
  {
    "id": "BOA-096",
    "name": "Tantor",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 6,
    "atk": 5,
    "hp": 8,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Elephant",
      "Mount"
    ],
    "effectName": "Friends in Need",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-096 Tantor.jpg",
    "isSecret": false,
    "gameplayId": "BOA-096",
    "copyLimit": 3,
    "effectText": "Whenever 'Tarzan' or another Animal you control would be Damaged, Tantor may deal damage equal to his Attack to Target Unit or Construct in his Range."
  },
  {
    "id": "BOA-097",
    "name": "Jad-Bal-ja",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Animal",
    "cost": 4,
    "atk": 5,
    "hp": 4,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Cat",
      "Mount"
    ],
    "effectName": "Keen Senses",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-097 Jad-Bal-ja.jpg",
    "isSecret": false,
    "gameplayId": "BOA-097",
    "copyLimit": 3,
    "effectText": "Jad-Bal-ja and characters mounted to him cannot be Targeted by your opponents effects."
  },
  {
    "id": "BOA-098",
    "name": "Sabor",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Animal",
    "cost": 3,
    "atk": 3,
    "hp": 3,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Cat"
    ],
    "effectName": "Lioness Hunter",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-098 Sabor.jpg",
    "isSecret": false,
    "gameplayId": "BOA-098",
    "copyLimit": 3,
    "effectText": "Sabor gains +1 Attack for each Animal on the Battlefield."
  },
  {
    "id": "BOA-099",
    "name": "Gryf",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 5,
    "atk": 5,
    "hp": 10,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Dino",
      "Mount"
    ],
    "effectName": "Thick Skin",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-099 Gryf.jpg",
    "isSecret": false,
    "gameplayId": "BOA-099",
    "copyLimit": 3,
    "effectText": "Gryf is not unique."
  },
  {
    "id": "BOA-100",
    "name": "Mahar",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Animal",
    "cost": 4,
    "atk": 4,
    "hp": 6,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Dino",
      "Mount"
    ],
    "effectName": "King of Hollow Earth",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-100 Mahar.jpg",
    "isSecret": false,
    "gameplayId": "BOA-100",
    "copyLimit": 3,
    "effectText": "Mahar is not unique. Non-Animal units get -1 Attack. Non-Animal Units with 2 or more Speed get -1 Speed."
  },
  {
    "id": "BOA-101",
    "name": "Cafall",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 1,
    "atk": 2,
    "hp": 1,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Hound"
    ],
    "effectName": "King's Loyal Hound",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-101 Cafall.jpg",
    "isSecret": false,
    "gameplayId": "BOA-101",
    "copyLimit": 3,
    "effectText": "Units adjacent to Cafall gain +1 Range. If you control a 'King', Cafall gains +2 Attack and +2 HP."
  },
  {
    "id": "BOA-102",
    "name": "Adar Cilgwri",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Animal",
    "cost": 1,
    "atk": 1,
    "hp": 2,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Bird",
      "Divine"
    ],
    "effectName": "Prophecy",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-102 Adar Cilgwri.jpg",
    "isSecret": false,
    "gameplayId": "BOA-102",
    "copyLimit": 3,
    "effectText": "Whenever you draw your first card during your turn, instead, look at the top 3 cards of your Deck. Choose 1 to add to your hand, and put the rest on top of your Deck in any order."
  },
  {
    "id": "BOA-103",
    "name": "Horse",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 1,
    "atk": 1,
    "hp": 2,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Horse",
      "Mount"
    ],
    "effectName": "Gallop of the Wind",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-103 Horse.jpg",
    "isSecret": false,
    "gameplayId": "BOA-103",
    "copyLimit": 3,
    "effectText": "Horse is not unique."
  },
  {
    "id": "BOA-104",
    "name": "Armored Horse",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Animal",
    "cost": 2,
    "atk": 1,
    "hp": 4,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Horse",
      "Mount"
    ],
    "effectName": "Protective Gear",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-104 Armored Horse.jpg",
    "isSecret": false,
    "gameplayId": "BOA-104",
    "copyLimit": 3,
    "effectText": "Armored Horse is not Unique. Damage dealt to Armored Horse or Characters Mounted to Armor Horse is halved (rounded up)."
  },
  {
    "id": "BOA-105",
    "name": "Dragon",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Animal",
    "cost": 5,
    "atk": 7,
    "hp": 5,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Dragon",
      "Mount"
    ],
    "effectName": "Venomous Blood",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-105 Dragon.jpg",
    "isSecret": false,
    "gameplayId": "BOA-105",
    "copyLimit": 3,
    "effectText": "Dragon is not Unique. Whenever Dragon is dealt damage, deal 2 Damage to each Unit you don't control in Range."
  },
  {
    "id": "BOA-106",
    "name": "Lion",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Animal",
    "cost": 3,
    "atk": 4,
    "hp": 4,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Cat",
      "Mount"
    ],
    "effectName": "King of the Jungle",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-106 Lion.jpg",
    "isSecret": false,
    "gameplayId": "BOA-106",
    "copyLimit": 3,
    "effectText": "Lion is not unique. Other Animals you control gain +2 Attack and +1 Speed."
  },
  {
    "id": "BOA-107",
    "name": "Ziz",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Animal",
    "cost": 8,
    "atk": 9,
    "hp": 9,
    "range": 1,
    "spd": 4,
    "characteristics": [
      "Animal",
      "Bird",
      "Primal"
    ],
    "effectName": "Gale Wind Burst",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-107 Ziz.jpg",
    "isSecret": false,
    "gameplayId": "BOA-107",
    "copyLimit": 3,
    "effectText": "Whenever Ziz is revealed, return all opposing Units and Constructs in its Range to their Owners hands. Whenever Ziz attacks, return Targret Unit or Construct to its Owners hand."
  },
  {
    "id": "BOA-108",
    "name": "Leviathan",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Animal",
    "cost": 8,
    "atk": 8,
    "hp": 10,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Serpent",
      "Primal"
    ],
    "effectName": "From the Depths",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-108 Leviathan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-108",
    "copyLimit": 3,
    "effectText": "Whenever Leviathan would reveal a Unit due to its Range, instead, destroy it without revealing it."
  },
  {
    "id": "BOA-109",
    "name": "Behemoth",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Animal",
    "cost": 8,
    "atk": 10,
    "hp": 8,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Beast",
      "Primal"
    ],
    "effectName": "Tantrum Strike",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-109 Behemoth.jpg",
    "isSecret": false,
    "gameplayId": "BOA-109",
    "copyLimit": 3,
    "effectText": "Whenever Behemoth attacks, deal 4 Damage to each opposing Unit and Construct in Range."
  },
  {
    "id": "BOA-110",
    "name": "Loch Ness Monster",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Animal",
    "cost": 4,
    "atk": 4,
    "hp": 6,
    "range": 2,
    "spd": 2,
    "characteristics": [
      "Animal",
      "Dino",
      "Mount"
    ],
    "effectName": "Legend of the Lake",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-110 Loch Ness Monster.jpg",
    "isSecret": false,
    "gameplayId": "BOA-110",
    "copyLimit": 3,
    "effectText": "Whenever an opponent Reveals a concealed Unit, that player Discards a card."
  },
  {
    "id": "BOA-111",
    "name": "The Dragon King",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Animal",
    "cost": 10,
    "atk": 14,
    "hp": 8,
    "range": 2,
    "spd": 4,
    "characteristics": [
      "Animal",
      "Dragon"
    ],
    "effectName": "Tempest of the King",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-111 The Dragon King.jpg",
    "isSecret": false,
    "gameplayId": "BOA-111",
    "copyLimit": 3,
    "effectText": "Whenever The Dragon King attacks, each opponent Discards 1 card. Whenever an opponent would discard a card, deal 1 Damage to Target Unit you don't control."
  },
  {
    "id": "BOA-112",
    "name": "The Kraken",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Animal",
    "cost": 10,
    "atk": 8,
    "hp": 13,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Animal",
      "Octopus"
    ],
    "effectName": "Devourer of Worlds",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-112 The Kraken.jpg",
    "isSecret": false,
    "gameplayId": "BOA-112",
    "copyLimit": 3,
    "effectText": "Whenever The Kraken destroys a Unit by Battle, deal Damage equal to the destroyed Units Cost to it's controllers Stronghold."
  },
  {
    "id": "BOA-113",
    "name": "Bunyip",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Animal",
    "cost": 6,
    "atk": 6,
    "hp": 8,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Animal"
    ],
    "effectName": "Dragged Beneath",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-113 Bunyip.jpg",
    "isSecret": false,
    "gameplayId": "BOA-113",
    "copyLimit": 3,
    "effectText": "Whenever a Character you don't control moves more than 2 spaces in a turn, deal 2 Damage to that Character."
  },
  {
    "id": "BOA-114",
    "name": "Bucephalus",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Animal",
    "cost": 5,
    "atk": 2,
    "hp": 8,
    "range": 1,
    "spd": 4,
    "characteristics": [
      "Animal",
      "Horse",
      "Mount"
    ],
    "effectName": "Horse of Alexander",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-114 Bucephalus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-114",
    "copyLimit": 3,
    "effectText": "Mounted Characters you control +3 Attack. If 'Alexander the Great' is Mounted to Bucephalus, 'Alexander the Great' cannot be dealt damage while attacking."
  },
  {
    "id": "BOA-115",
    "name": "Black Shuck",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Animal",
    "cost": 5,
    "atk": 5,
    "hp": 7,
    "range": 1,
    "spd": 3,
    "characteristics": [
      "Animal",
      "Hound",
      "Mount"
    ],
    "effectName": "Darkness Looming",
    "setCode": "BOA",
    "types": [
      "Animal"
    ],
    "image": "cards/BOA-115 Black Shuck.jpg",
    "isSecret": false,
    "gameplayId": "BOA-115",
    "copyLimit": 3,
    "effectText": "Whenever Black Shuck deals damage to a Unit, destroy that Unit after Battle."
  },
  {
    "id": "BOA-116",
    "name": "Grail's Blessing",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-116 Grail's Blessing.jpg",
    "isSecret": false,
    "gameplayId": "BOA-116",
    "copyLimit": 3,
    "effectText": "Remove all Damage Counters from the User. The User cannot receive Damage during this turn."
  },
  {
    "id": "BOA-117",
    "name": "Last Stand",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-117 Last Stand.jpg",
    "isSecret": false,
    "gameplayId": "BOA-117",
    "copyLimit": 3,
    "effectText": "You can only activate this Action if the User is the only Character you control while an opponent has more Units than you. Sacrifice the User and destroy all opposing Units in Range of the User."
  },
  {
    "id": "BOA-118",
    "name": "Charge!",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-118 Charge!.jpg",
    "isSecret": false,
    "gameplayId": "BOA-118",
    "copyLimit": 3,
    "effectText": "The user gains +3 Speed until the end of the turn."
  },
  {
    "id": "BOA-119",
    "name": "Call to Arms",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-119 Call to Arms.jpg",
    "isSecret": false,
    "gameplayId": "BOA-119",
    "copyLimit": 3,
    "effectText": "Search your Deck for a Knight and add it to your hand. Shuffle. If 'King Arthur' is the User of this Action, put that Knight into play adjacent to him without paying its cost."
  },
  {
    "id": "BOA-120",
    "name": "Gift of the Lady",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-120 Gift of the Lady.jpg",
    "isSecret": false,
    "gameplayId": "BOA-120",
    "copyLimit": 3,
    "effectText": "Equip the User with one Item from your hand without paying its cost."
  },
  {
    "id": "BOA-121",
    "name": "Merlin's Prophecy",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 1,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-121 Merlin's Prophecy.jpg",
    "isSecret": false,
    "gameplayId": "BOA-121",
    "copyLimit": 3,
    "effectText": "Look at the top 3 cards of your Deck. Choose 1 to add to your hand. Put the rest on top of your Deck in any order."
  },
  {
    "id": "BOA-122",
    "name": "Enchant Weapon",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-122 Enchant Weapon.jpg",
    "isSecret": false,
    "gameplayId": "BOA-122",
    "copyLimit": 3,
    "effectText": "If the effect of Target Item would trigger for the first time this turn, it triggers a second time."
  },
  {
    "id": "BOA-123",
    "name": "Slay the Beast",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-123 Slay the Beast.jpg",
    "isSecret": false,
    "gameplayId": "BOA-123",
    "copyLimit": 3,
    "effectText": "Destroyo Target Unit you don't control with the highest ATK in Range of the User."
  },
  {
    "id": "BOA-124",
    "name": "Divine Cleansing",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Action",
    "cost": 7,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-124 Divine Cleansing.jpg",
    "isSecret": false,
    "gameplayId": "BOA-124",
    "copyLimit": 3,
    "effectText": "Destroy all Units and Constructs."
  },
  {
    "id": "BOA-125",
    "name": "Explosion!",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-125 Explosion!.jpg",
    "isSecret": false,
    "gameplayId": "BOA-125",
    "copyLimit": 3,
    "effectText": "Destroy Target Construct or Item."
  },
  {
    "id": "BOA-126",
    "name": "Reconstruct",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-126 Reconstruct.jpg",
    "isSecret": false,
    "gameplayId": "BOA-126",
    "copyLimit": 3,
    "effectText": "Put one Target Construct from your Discard Pile into your Recruting Area without paying its cost."
  },
  {
    "id": "BOA-127",
    "name": "Call of the Night",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-127 Call of the Night.jpg",
    "isSecret": false,
    "gameplayId": "BOA-127",
    "copyLimit": 3,
    "effectText": "Put into play X 'Vampire Bat' Armies adjacent to the User where X = the Users Energy Cost."
  },
  {
    "id": "BOA-128",
    "name": "Drink of Blood",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-128 Drink of Blood.jpg",
    "isSecret": false,
    "gameplayId": "BOA-128",
    "copyLimit": 3,
    "effectText": "Remove all Damage Counters from the user."
  },
  {
    "id": "BOA-129",
    "name": "Stake the Dead",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 1,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-129 Stake the Undead.jpg",
    "isSecret": false,
    "gameplayId": "BOA-129",
    "copyLimit": 3,
    "effectText": "Banish Target Unit from a players Discard. If the Target has 'Undead' in its Characteristics, draw a card."
  },
  {
    "id": "BOA-130",
    "name": "Hidden in Mist",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-130 Hidden in Mist.jpg",
    "isSecret": false,
    "gameplayId": "BOA-130",
    "copyLimit": 3,
    "effectText": "Conceal the user."
  },
  {
    "id": "BOA-131",
    "name": "Invasion of Night",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-131 Invasion of Night.jpg",
    "isSecret": false,
    "gameplayId": "BOA-131",
    "copyLimit": 3,
    "effectText": "Concealed characters you control gain +1 Speed until the end of the turn."
  },
  {
    "id": "BOA-132",
    "name": "Absorb Soul",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-132 Absorb Soul.jpg",
    "isSecret": false,
    "gameplayId": "BOA-132",
    "copyLimit": 3,
    "effectText": "Deal Damage to Target Unit in the Users Range equal to the number of Units in your Discard Pile. Remove that many Damage Counters from the User."
  },
  {
    "id": "BOA-133",
    "name": "Raise the Dead",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Action",
    "cost": 8,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-133 Raise the Dead.jpg",
    "isSecret": false,
    "gameplayId": "BOA-133",
    "copyLimit": 3,
    "effectText": "Each player shuffles their Discard Pile into their respective Decks. Then put into play 'Zombies' Army adjacent to the User equal to the number of Units shuffled this way."
  },
  {
    "id": "BOA-134",
    "name": "Zombie Plague",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 9,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-134 Zombie Plague.jpg",
    "isSecret": false,
    "gameplayId": "BOA-134",
    "copyLimit": 3,
    "effectText": "Destroy all Units. Then put into play a 'Zombies' army stack equal to the number of Units destroyed this way."
  },
  {
    "id": "BOA-135",
    "name": "It's Alive",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 6,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-135 It's Alive!.jpg",
    "isSecret": false,
    "gameplayId": "BOA-135",
    "copyLimit": 3,
    "effectText": "Put into play Target Unit from your Discard adjacent ot the user without paying its cost."
  },
  {
    "id": "BOA-136",
    "name": "Stitch Together",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-136 Stitch Together.jpg",
    "isSecret": false,
    "gameplayId": "BOA-136",
    "copyLimit": 3,
    "effectText": "Return Target Unit from your Discard Pile to your hand."
  },
  {
    "id": "BOA-137",
    "name": "Duality",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-137 Duality.jpg",
    "isSecret": false,
    "gameplayId": "BOA-137",
    "copyLimit": 3,
    "effectText": "Return the User to the Respective Owners hand. Then you may put into play another character from your hand with the same Cost as the User in the same space as the User. All Counters and Items move to the new character."
  },
  {
    "id": "BOA-138",
    "name": "Split",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-138 Split.jpg",
    "isSecret": false,
    "gameplayId": "BOA-138",
    "copyLimit": 3,
    "effectText": "Discard your hand. Draw 3 cards if you discarded 2 or more."
  },
  {
    "id": "BOA-139",
    "name": "Harsh Storm",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 6,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-139 Harsh Storm.jpg",
    "isSecret": false,
    "gameplayId": "BOA-139",
    "copyLimit": 3,
    "effectText": "Return the User and all other Units and Constructs adjacent to the User to their Respective Owners hands."
  },
  {
    "id": "BOA-140",
    "name": "Navigator's Insight",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-140 Navigator's Insight.jpg",
    "isSecret": false,
    "gameplayId": "BOA-140",
    "copyLimit": 3,
    "effectText": "Draw 2 cards."
  },
  {
    "id": "BOA-141",
    "name": "Stand Your Ground",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 5,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-141 Stand Your Ground.jpg",
    "isSecret": false,
    "gameplayId": "BOA-141",
    "copyLimit": 3,
    "effectText": "You can only activate this Action during an opponent's turn. Characters you control take 0 Damage during this turn."
  },
  {
    "id": "BOA-142",
    "name": "Aristotle's Philosophy",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-142 Aristotle's Philosophy.jpg",
    "isSecret": false,
    "gameplayId": "BOA-142",
    "copyLimit": 3,
    "effectText": "At the end of your turn, raise your Max Energy by one."
  },
  {
    "id": "BOA-143",
    "name": "Stealth Attack",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-143 Stealth Attack.jpg",
    "isSecret": false,
    "gameplayId": "BOA-143",
    "copyLimit": 3,
    "effectText": "You may only play this Action if the User was revealed during this turn. Deal 4 Damage to Target character within the Users Range."
  },
  {
    "id": "BOA-144",
    "name": "Cunning Thievery",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-144 Cunning Thievery.jpg",
    "isSecret": false,
    "gameplayId": "BOA-144",
    "copyLimit": 3,
    "effectText": "Target player reveals their hand. Choose and Discard one card from it. Draw a card."
  },
  {
    "id": "BOA-145",
    "name": "Vine Swing",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-145 Vine Swing.jpg",
    "isSecret": false,
    "gameplayId": "BOA-145",
    "copyLimit": 3,
    "effectText": "The user gains +1 Speed until the end of the turn. Anials with the characteristics Ape or Monkey may become the User of this Action."
  },
  {
    "id": "BOA-146",
    "name": "Taking Aim",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-146 Taking Aim.jpg",
    "isSecret": false,
    "gameplayId": "BOA-146",
    "copyLimit": 3,
    "effectText": "The User gains +2 Range until the end of the turn."
  },
  {
    "id": "BOA-147",
    "name": "Stampede!",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-147 Stampede!.jpg",
    "isSecret": false,
    "gameplayId": "BOA-147",
    "copyLimit": 3,
    "effectText": "Animals can be and must be the User of this Action. Deal Damage to any Target in range equal to the number of Animals you control."
  },
  {
    "id": "BOA-148",
    "name": "Emperor's Greed",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 1,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-148 Emperor's Greed.jpg",
    "isSecret": false,
    "gameplayId": "BOA-148",
    "copyLimit": 3,
    "effectText": "Discard two cards. If so, draw 2 cards."
  },
  {
    "id": "BOA-149",
    "name": "Construction Plans",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-149 Construction Plans.jpg",
    "isSecret": false,
    "gameplayId": "BOA-149",
    "copyLimit": 3,
    "effectText": "Search your Deck for one Construct and add it to your hand. Shuffle."
  },
  {
    "id": "BOA-150",
    "name": "Martyr",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 1,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-150 Martyr.jpg",
    "isSecret": false,
    "gameplayId": "BOA-150",
    "copyLimit": 3,
    "effectText": "Sacrifice the User. Draw 2 cards."
  },
  {
    "id": "BOA-151",
    "name": "Break the Gates",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 5,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-151 Break the Gates.jpg",
    "isSecret": false,
    "gameplayId": "BOA-151",
    "copyLimit": 3,
    "effectText": "Opposing Units and Constructs cannot Protect Strongholds this turn."
  },
  {
    "id": "BOA-152",
    "name": "No Quarter",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-152 No Quarter.jpg",
    "isSecret": false,
    "gameplayId": "BOA-152",
    "copyLimit": 3,
    "effectText": "During this turn, whenever you win a Victory, deal 1 damage to Target Stronghold you don't control."
  },
  {
    "id": "BOA-153",
    "name": "March On",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-153 March On.jpg",
    "isSecret": false,
    "gameplayId": "BOA-153",
    "copyLimit": 3,
    "effectText": "During this turn, Armies can attack twice."
  },
  {
    "id": "BOA-154",
    "name": "History Re-Written",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Action",
    "cost": 10,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-154 History Re-Written.jpg",
    "isSecret": false,
    "gameplayId": "BOA-154",
    "copyLimit": 3,
    "effectText": "Whenever a Unit would die this turn, deal damage equal to its cost to its Owners Stronghold."
  },
  {
    "id": "BOA-155",
    "name": "Acrobatic Dodge",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 1,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-155 Acrobatic Dodge.jpg",
    "isSecret": false,
    "gameplayId": "BOA-155",
    "copyLimit": 3,
    "effectText": "The User cannot be Targeted by your opponent's effects during this turn."
  },
  {
    "id": "BOA-156",
    "name": "Arcane Deflect",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-156 Arcane Deflect.jpg",
    "isSecret": false,
    "gameplayId": "BOA-156",
    "copyLimit": 3,
    "effectText": "Counter Target Action."
  },
  {
    "id": "BOA-157",
    "name": "Spring the Trap",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-157 Spring the Trap.jpg",
    "isSecret": false,
    "gameplayId": "BOA-157",
    "copyLimit": 3,
    "effectText": "You can only activate this Action when Target Unit is played revealed from its owners hand. Counter that Unit."
  },
  {
    "id": "BOA-158",
    "name": "Knighthood",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Action",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-158 Knighthood.jpg",
    "isSecret": false,
    "gameplayId": "BOA-158",
    "copyLimit": 3,
    "effectText": "Another Character you control gains +1 Attack, +1 Range, +1 Speed and 'Knight.' If the User has King in its characteristics, draw 2 cards."
  },
  {
    "id": "BOA-159",
    "name": "Moving Through Shadows",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Action",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-159 Moving Through Shadows.jpg",
    "isSecret": false,
    "gameplayId": "BOA-159",
    "copyLimit": 3,
    "effectText": "Concealed Units you control gain +3 Speed until the end of the turn. You cannot reveal concealed Units this turn."
  },
  {
    "id": "BOA-160",
    "name": "Clone Army",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Action",
    "cost": 9,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Action"
    ],
    "image": "cards/BOA-160 Clone Army.jpg",
    "isSecret": false,
    "gameplayId": "BOA-160",
    "copyLimit": 3,
    "effectText": "Search your Deck for up to two copies of the User and put them into play in your Recruting Area. The User and the copies gain \"This Character is not Unique.\""
  },
  {
    "id": "BOA-161",
    "name": "Adventure Journal",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Item",
    "cost": 1,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-161 Adventure Journal.jpg",
    "isSecret": false,
    "gameplayId": "BOA-161",
    "copyLimit": 3,
    "effectText": "At the end of the turn, if the equipped Character moved this turn, draw a card."
  },
  {
    "id": "BOA-162",
    "name": "Harpoon Gun",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Item",
    "cost": 5,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-162 Harpoon Gun.jpg",
    "isSecret": false,
    "gameplayId": "BOA-162",
    "copyLimit": 3,
    "effectText": "Whenever the Equipped Character reveals another Character by Range, destroy that Character."
  },
  {
    "id": "BOA-163",
    "name": "Hoplon Shield",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Item",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-163 Hoplon Shield.jpg",
    "isSecret": false,
    "gameplayId": "BOA-163",
    "copyLimit": 3,
    "effectText": "Damage dealt to the equipped Character is halved (rounded up)."
  },
  {
    "id": "BOA-164",
    "name": "Saddle",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Item",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-164 Saddle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-164",
    "copyLimit": 3,
    "effectText": "You can only equip this Ite to an Animal. The equipped Animal gains Mount."
  },
  {
    "id": "BOA-165",
    "name": "Crown of the King",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Item",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-165 Crown of the King.jpg",
    "isSecret": false,
    "gameplayId": "BOA-165",
    "copyLimit": 3,
    "effectText": "The Equipped Character gains the Characteristic King. If the Equipped character dies, you may equip this Item to another character you control."
  },
  {
    "id": "BOA-166",
    "name": "Excalibur",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Item",
    "cost": 10,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-166 Excalibur.jpg",
    "isSecret": false,
    "gameplayId": "BOA-166",
    "copyLimit": 3,
    "effectText": "Excalibur cost 0 to equip to 'King Arthur.' Whenever the Equipped Character attacks, you may destroy one Unit adjacent to the equipped Character."
  },
  {
    "id": "BOA-167",
    "name": "The Holy Grail",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Item",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-167 The Holy Grail.jpg",
    "isSecret": false,
    "gameplayId": "BOA-167",
    "copyLimit": 3,
    "effectText": "At the end of each turn, remove all damage counters from the Equipped Character. If the Holy Grail would be destroyed, shuffle it into your Deck."
  },
  {
    "id": "BOA-168",
    "name": "Pridewin Shield",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Item",
    "cost": 3,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-168 Pridewin Shield.jpg",
    "isSecret": false,
    "gameplayId": "BOA-168",
    "copyLimit": 3,
    "effectText": "The equipped Character cannot be Targeted by your opponent's effects."
  },
  {
    "id": "BOA-169",
    "name": "Spear of Longinus",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Item",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-169 Spear of Longinus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-169",
    "copyLimit": 3,
    "effectText": "The equipped Character, gains +X Attack where X equals its remaining HP."
  },
  {
    "id": "BOA-170",
    "name": "Lance of Lancelot",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Item",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-170 Lance of Lancelot.jpg",
    "isSecret": false,
    "gameplayId": "BOA-170",
    "copyLimit": 3,
    "effectText": "The Equipped Character gains +2 Range."
  },
  {
    "id": "BOA-171",
    "name": "Coffin Bed",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Item",
    "cost": 4,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-171 Coffin Bed.jpg",
    "isSecret": false,
    "gameplayId": "BOA-171",
    "copyLimit": 3,
    "effectText": "Whenever the equipped Character dies, you may Sacrifice this Item and return that Character to your Recruiting Area."
  },
  {
    "id": "BOA-172",
    "name": "Elixir of Madness",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Item",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-172 Elixir of Madness.jpg",
    "isSecret": false,
    "gameplayId": "BOA-172",
    "copyLimit": 3,
    "effectText": "The equipped Character gains +3 Attack and loses all effects."
  },
  {
    "id": "BOA-173",
    "name": "Mummy's Tomb",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Item",
    "cost": 2,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-173 Mummy's Tomb.jpg",
    "isSecret": false,
    "gameplayId": "BOA-173",
    "copyLimit": 3,
    "effectText": "Whenever the equipped Character dies, create a stack of 'Mummy' armies equal to the Cost of the equiped character."
  },
  {
    "id": "BOA-174",
    "name": "Yew Longbow",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Item",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-174 Yew Longbow.jpg",
    "isSecret": false,
    "gameplayId": "BOA-174",
    "copyLimit": 3,
    "effectText": "The equipped character gains +X Attack where X equals its Range."
  },
  {
    "id": "BOA-175",
    "name": "Sherwood Cloak",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Item",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Item"
    ],
    "image": "cards/BOA-175 Sherwood Cloak.jpg",
    "isSecret": false,
    "gameplayId": "BOA-175",
    "copyLimit": 3,
    "effectText": "The equipped Character takes 0 Battle Damage while attacking."
  },
  {
    "id": "BOA-176",
    "name": "Battering Ram",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 5,
    "atk": 1,
    "hp": 10,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Siege Weapon",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-176 Battering Ram.jpg",
    "isSecret": false,
    "gameplayId": "BOA-176",
    "copyLimit": 3,
    "effectText": "Whenever you move Battering Ram, you may destroy Target Construct within Range. Battering Ram gains +9 Attackwhile attacking a Stronghold or Construct."
  },
  {
    "id": "BOA-177",
    "name": "Catapult",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 4,
    "atk": 4,
    "hp": 7,
    "range": 4,
    "spd": 1,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Long Range Assault",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-177 Catapult.jpg",
    "isSecret": false,
    "gameplayId": "BOA-177",
    "copyLimit": 3,
    "effectText": "Catapult cannot attack Units or Constructs withtin a Range of 2. Catapult gains +3 Attack while attacking a Construct or Stronghold."
  },
  {
    "id": "BOA-178",
    "name": "Ballista",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Construct",
    "cost": 4,
    "atk": 5,
    "hp": 6,
    "range": 3,
    "spd": 1,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Piercing Strike",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-178 Ballista.jpg",
    "isSecret": false,
    "gameplayId": "BOA-178",
    "copyLimit": 3,
    "effectText": "Whenever Ballista deals excess damage to a Unit or Construct, you may deal the remaining damage to Target Unit or Construct adjacent to the Damaged card."
  },
  {
    "id": "BOA-179",
    "name": "Fortified Walls",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Construct",
    "cost": 3,
    "atk": 0,
    "hp": 10,
    "range": 0,
    "spd": 0,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Barrier of Protection",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-179- Fortified Walls.jpg",
    "isSecret": false,
    "gameplayId": "BOA-179",
    "copyLimit": 3,
    "effectText": "Fortified Walls Range, SPD, and ATK are always 0. This cannot be negated. Damage dealt to Fortified walls is reduced by half (rounded down)."
  },
  {
    "id": "BOA-180",
    "name": "Outpost",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 2,
    "atk": 0,
    "hp": 6,
    "range": 0,
    "spd": 0,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Farseek",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-180 Outpost.jpg",
    "isSecret": false,
    "gameplayId": "BOA-180",
    "copyLimit": 3,
    "effectText": "Outposts Range, SPD, and ATK are always 0. This cannot be negated. Units adjacent to Outpost gain +1 Range."
  },
  {
    "id": "BOA-181",
    "name": "Siege Tower",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Construct",
    "cost": 6,
    "atk": 0,
    "hp": 15,
    "range": 0,
    "spd": 1,
    "characteristics": [
      "Construct",
      "Mount"
    ],
    "effectName": "Breach",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-181 Siege Tower.jpg",
    "isSecret": false,
    "gameplayId": "BOA-181",
    "copyLimit": 3,
    "effectText": "Siege Towers Range and ATK are always 0. You may have any number of Characters mounted to Siege Tower. All Damage dealt to Characters Mounted to Siege Tower is dealt to it instead. While Siege Tower occupies your opponents Recruiting Area, characters mounted to Siege Tower deal Double Damage to Stongholds."
  },
  {
    "id": "BOA-182",
    "name": "Watch Tower",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 3,
    "atk": 0,
    "hp": 9,
    "range": 0,
    "spd": 0,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Stone Lookout",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-182 Watch Tower.jpg",
    "isSecret": false,
    "gameplayId": "BOA-182",
    "copyLimit": 3,
    "effectText": "Watch Towers Range, SPD, and ATK are always 0. This cannot be negated."
  },
  {
    "id": "BOA-183",
    "name": "Gargoyle",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Construct",
    "cost": 5,
    "atk": 5,
    "hp": 8,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Still of the Night",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-183 Gargoyle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-183",
    "copyLimit": 3,
    "effectText": "As long as Gargoyle is not a Character, it cannot move. Once per turn, you may Discard a card to have Gargoyle become a Character until the end of the turn."
  },
  {
    "id": "BOA-184",
    "name": "Arcane Barrier",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Construct",
    "cost": 3,
    "atk": 0,
    "hp": 5,
    "range": 3,
    "spd": 0,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Magical Shield",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-184 Arcane Barrier.jpg",
    "isSecret": false,
    "gameplayId": "BOA-184",
    "copyLimit": 3,
    "effectText": "Arcane Barriers SPD and ATK are always 0. This cannot be negated. You may play this Construct adjacent to a Wizard you control. Units you control in Arcane Barriers Range cannot be Targeted by opponents effects."
  },
  {
    "id": "BOA-185",
    "name": "Militia Camp",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 6,
    "atk": 0,
    "hp": 8,
    "range": 0,
    "spd": 0,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Prepare for War",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-185 Militia Camp.jpg",
    "isSecret": false,
    "gameplayId": "BOA-185",
    "copyLimit": 3,
    "effectText": "Militia Camps Range, SPD and ATK are always 0. This cannot be negated. At the end of each of your turns, you may put into play one Army adjacent to Militia Camp."
  },
  {
    "id": "BOA-186",
    "name": "Triremes Boat",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 4,
    "atk": 2,
    "hp": 7,
    "range": 2,
    "spd": 2,
    "characteristics": [
      "Construct",
      "Mount"
    ],
    "effectName": "Ride the Seas",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-186 Triremes Boat.jpg",
    "isSecret": false,
    "gameplayId": "BOA-186",
    "copyLimit": 3,
    "effectText": "You may have any number of Characters mounted to Triremes Boat. Triremes Boat gains +1 ATK for each Character Mounted to it."
  },
  {
    "id": "BOA-187",
    "name": "Ornithopter",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Construct",
    "cost": 3,
    "atk": 0,
    "hp": 3,
    "range": 2,
    "spd": 4,
    "characteristics": [
      "Construct",
      "Mount"
    ],
    "effectName": "To the Sky",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-187 Ornithopter.jpg",
    "isSecret": false,
    "gameplayId": "BOA-187",
    "copyLimit": 3,
    "effectText": "Ornithopters Range & SPD are always 0 unless it is mounted with a Character. This effect cannot be negated."
  },
  {
    "id": "BOA-188",
    "name": "Terbuchet",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 6,
    "atk": 9,
    "hp": 7,
    "range": 4,
    "spd": 1,
    "characteristics": [
      "Construct"
    ],
    "effectName": "Rain from Above",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-188 Trebuchet.jpg",
    "isSecret": false,
    "gameplayId": "BOA-188",
    "copyLimit": 3,
    "effectText": "Trebuchet cannot attack Units or Constructs within a Range of 2. Whenever Trebuchet attacks, it cannot move during its next turn. Trebuchet can attack Protected Units and Strongholds."
  },
  {
    "id": "BOA-189",
    "name": "Mantlet Shield",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Construct",
    "cost": 4,
    "atk": 0,
    "hp": 6,
    "range": 0,
    "spd": 2,
    "characteristics": [
      "Construct",
      "Mount"
    ],
    "effectName": "Mobile Protection",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-189 Mantlet Shield.jpg",
    "isSecret": false,
    "gameplayId": "BOA-189",
    "copyLimit": 3,
    "effectText": "Mantlet Shields Range and ATK are always 0. You may have any nuber of characters Mounted to Mantlet Shield. All Damage dealt to Characters Mounted to Mantlet Shield is dealt to it instead."
  },
  {
    "id": "BOA-190",
    "name": "Prison Caravan",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Construct",
    "cost": 3,
    "atk": 0,
    "hp": 6,
    "range": 0,
    "spd": 1,
    "characteristics": [
      "Construct",
      "Mount"
    ],
    "effectName": "Captured",
    "setCode": "BOA",
    "types": [
      "Construct"
    ],
    "image": "cards/BOA-190 Prison Caravan.jpg",
    "isSecret": false,
    "gameplayId": "BOA-190",
    "copyLimit": 3,
    "effectText": "Prison Caravan's ATK and Range are always 0. Whenever an opposing damaged character moves to an adjacent space to Prison Caravan, if this construct has no other Character mounting it, mount that Character to Prison Caravan. As long as that character is mounted to Prison Caravan, it cannot attack, move and its effects are negated."
  },
  {
    "id": "BOA-191",
    "name": "Camelot Soldier",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Soldier"
    ],
    "effectName": "March for Victory",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-191 Camelot Soldier.jpg",
    "isSecret": false,
    "gameplayId": "BOA-191",
    "copyLimit": 1,
    "effectText": "At the end of your turn, if you control a Unit with the Characteristics King, add one 'Camelot Soldier' to this Army Stack."
  },
  {
    "id": "BOA-192",
    "name": "Camelot Spearman",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "Army",
      "Soldier"
    ],
    "effectName": "Haste for Victory",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-192 Camelot Spearman.jpg",
    "isSecret": false,
    "gameplayId": "BOA-192",
    "copyLimit": 1,
    "effectText": "At the end of your turn, if you control a Unit with the Characteristics King, Camelot Spearman gains +1 SPD."
  },
  {
    "id": "BOA-193",
    "name": "Camelot Archer",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 2,
    "spd": 1,
    "characteristics": [
      "Army",
      "Soldier"
    ],
    "effectName": "Reach for Victory",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-193 Camelot Archer.jpg",
    "isSecret": false,
    "gameplayId": "BOA-193",
    "copyLimit": 1,
    "effectText": "At the end of your turn, if you control a Unit with the Characteristics King, Camelot Archer gains +1 Range."
  },
  {
    "id": "BOA-194",
    "name": "Zombies",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Undead"
    ],
    "effectName": "Undead Army",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-194 Zombie.jpg",
    "isSecret": false,
    "gameplayId": "BOA-194",
    "copyLimit": 1,
    "effectText": "Zombies deal 0 Damage while Blocking."
  },
  {
    "id": "BOA-195",
    "name": "Mummy",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Undead"
    ],
    "effectName": "Cursed Remains",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-195 Mummy.jpg",
    "isSecret": false,
    "gameplayId": "BOA-195",
    "copyLimit": 1,
    "effectText": "Mummy cannot be Targeted by your opponents effects."
  },
  {
    "id": "BOA-196",
    "name": "Vampire Bats",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 0,
    "characteristics": [
      "Army",
      "Animal",
      "Bat"
    ],
    "effectName": "Thirst for Blood",
    "setCode": "BOA",
    "types": [
      "Army",
      "Animal"
    ],
    "image": "cards/BOA-196 Vampire Bats.jpg",
    "isSecret": false,
    "gameplayId": "BOA-196",
    "copyLimit": 1,
    "effectText": "Vampire Bats SPD is equal to the number of other Units with Damage Counters on them +1."
  },
  {
    "id": "BOA-197",
    "name": "Spartan Soldier",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Warrior",
      "Spartan"
    ],
    "effectName": "The 300",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-197 Spartan Soldier.jpg",
    "isSecret": false,
    "gameplayId": "BOA-197",
    "copyLimit": 1,
    "effectText": "At the end of each turn, if you won a battle this turn, double the size of this Army."
  },
  {
    "id": "BOA-198",
    "name": "Kulonga Warrior",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Warrior",
      "Kulonga"
    ],
    "effectName": "Animal Hunters",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-198 Kulonga Warrior.jpg",
    "isSecret": false,
    "gameplayId": "BOA-198",
    "copyLimit": 1,
    "effectText": "Kulonga Warriors take no damage while attacking animals."
  },
  {
    "id": "BOA-199",
    "name": "Skeleton",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Warrior",
      "Undead"
    ],
    "effectName": "Rattling Bones",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-199 Skeleton.jpg",
    "isSecret": false,
    "gameplayId": "BOA-199",
    "copyLimit": 1,
    "effectText": "Skeleton has no additional effect."
  },
  {
    "id": "BOA-200",
    "name": "Persian Immortal",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Army",
    "cost": 0,
    "atk": 0,
    "hp": null,
    "range": 1,
    "spd": 1,
    "characteristics": [
      "Army",
      "Warrior",
      "Persian"
    ],
    "effectName": "The Immortal Army",
    "setCode": "BOA",
    "types": [
      "Army"
    ],
    "image": "cards/BOA-200 Persian Immortal.jpg",
    "isSecret": false,
    "gameplayId": "BOA-200",
    "copyLimit": 1,
    "effectText": "All Damage dealt to Persian Immortal is halved (rounded down)."
  },
  {
    "id": "BOA-201",
    "name": "Quest for the Grail",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Holy Quest",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-201Quest for the Grail.jpg",
    "isSecret": false,
    "gameplayId": "BOA-201",
    "copyLimit": 1,
    "effectText": "Reveal the top card of your Deck until you reveal an Item and Banish it. The first player to draw 3 cards in one turn takes control of that Item and Equips it to a Character the control. If they cannot, destroy that Item. Then Banish this event."
  },
  {
    "id": "BOA-202",
    "name": "Blood Moon Rises",
    "set": "Battle of Ages",
    "rarity": "Ultra Rare",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Call of the Night",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-202 Blood Moon Rises.jpg",
    "isSecret": false,
    "gameplayId": "BOA-202",
    "copyLimit": 1,
    "effectText": "At the end of each players turn, that player may choose 1 character from their Discard and put it into play revealedin their Recruiting Area. If they cannot, destroy this Event. Whenever a character dies, banish that Character."
  },
  {
    "id": "BOA-203",
    "name": "Tournament of Champions",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Combat Test",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-203 Tournament of Champions.jpg",
    "isSecret": false,
    "gameplayId": "BOA-203",
    "copyLimit": 1,
    "effectText": "Whenever a player wins a Battle, that player gains a victory counter. Whenever a player has 3 Victory Counters, that player draws 3 cards. Then remove all Victory counters from all players and destroy this Event."
  },
  {
    "id": "BOA-204",
    "name": "Storm at Sea",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Harsh Waves",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-204 Storm at Sea.jpg",
    "isSecret": false,
    "gameplayId": "BOA-204",
    "copyLimit": 1,
    "effectText": "Whenever a Character is revealed, its controller flips a coin. If tails, return that Character to its Owners hand. Whenever three or more characters are returned to hand due to this effect, banish this Event."
  },
  {
    "id": "BOA-205",
    "name": "Call of the Wild",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Primal Roar",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-205 Call of the Wild.jpg",
    "isSecret": false,
    "gameplayId": "BOA-205",
    "copyLimit": 1,
    "effectText": "Animals gain +3 Attack. Whenever there are more non-animal Units than Animals, destroy this event."
  },
  {
    "id": "BOA-206",
    "name": "Army March",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Power in Numbers",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-206 Army March.jpg",
    "isSecret": false,
    "gameplayId": "BOA-206",
    "copyLimit": 1,
    "effectText": "Armies gain +1 Speed. At the end of each players turn, if they attacked this turn, that player may put an Army into their Recruiting Area. If they did not attack this turn, destroy this Event."
  },
  {
    "id": "BOA-207",
    "name": "End the War",
    "set": "Battle of Ages",
    "rarity": "Rare",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "100 Years War Ends",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-207 End the War.jpg",
    "isSecret": false,
    "gameplayId": "BOA-207",
    "copyLimit": 1,
    "effectText": "At the end of each players turn, if that player did not attack this turn, they draw a card. If they did attack this turn, destroy this event."
  },
  {
    "id": "BOA-208",
    "name": "Dimension Portal",
    "set": "Battle of Ages",
    "rarity": "Super Rare",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Realms Intertwine",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-208 Dimension Portal.jpg",
    "isSecret": false,
    "gameplayId": "BOA-208",
    "copyLimit": 1,
    "effectText": "Whenever this event is played, each player reveals the top card of their deck until they reveal a Unit. Those Units are put into play in the Owners Recruiting Area revealed. Shuffle the rest of the revealed cards into their Respective Owners Deck. Destroy this Event."
  },
  {
    "id": "BOA-209",
    "name": "Battle of Thermopylae",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "The Battle Begins",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-209 Battle of Thermopylae.jpg",
    "isSecret": false,
    "gameplayId": "BOA-209",
    "copyLimit": 1,
    "effectText": "Units gain +3 ATK if their controller has the least amount of Units. Units lose -2 ATK if their controller has the most amount of Units. Whenever the player with the most Units doesn't play a Unit during a turn, destroy this Event."
  },
  {
    "id": "BOA-210",
    "name": "Battle of Naissus",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Event",
    "cost": 0,
    "atk": null,
    "hp": null,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "Overwhelming Calvary",
    "setCode": "BOA",
    "types": [
      "Event"
    ],
    "image": "cards/BOA-210 Battle of Naissus.jpg",
    "isSecret": false,
    "gameplayId": "BOA-210",
    "copyLimit": 1,
    "effectText": "Mounts gain +2 SPD while mounted. If neither player controls an Emperor or King, destroy this Event."
  },
  {
    "id": "BOA-211",
    "name": "Camelot",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-211Camelot.jpg",
    "isSecret": false,
    "gameplayId": "BOA-211",
    "copyLimit": 1,
    "effectText": "At the end of each of your turns, you may pay 3 Energy. If so, put into play one 'Camelot Soldier', one 'Camelot Spearman', or one 'Camelot Archer.' You can only activate this once per turn."
  },
  {
    "id": "BOA-212",
    "name": "Dracula's Castle",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-212 Dracula's Castle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-212",
    "copyLimit": 1,
    "effectText": "Once during each of your turns, whenever a Character you control is removed from the Battlefield and sent to the Discard Pile, you may pay 3 Energy. If so, return that Character to your hand."
  },
  {
    "id": "BOA-213",
    "name": "Frankenstein's Lab",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-213 Frankenstein's Castle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-213",
    "copyLimit": 1,
    "effectText": "At the end of each of your turns, you may send the top card of your Deck to the Discard Pile. If it is a Unit, you may remove one Damage from a Character you control."
  },
  {
    "id": "BOA-214",
    "name": "Merlin's Sanctum",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-214 Merlin's Sanctum.jpg",
    "isSecret": false,
    "gameplayId": "BOA-214",
    "copyLimit": 1,
    "effectText": "Whenever a Character you control uses and Action, draw a card. This only activates once per turn."
  },
  {
    "id": "BOA-215",
    "name": "Haunted Manor",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-215 Haunted Manor.jpg",
    "isSecret": false,
    "gameplayId": "BOA-215",
    "copyLimit": 1,
    "effectText": "Whenever a Unit is revealed that you don't control, you may pay 2 Energy. If so, its Onwer Discards a card from their hand. This only activates once per turn."
  },
  {
    "id": "BOA-216",
    "name": "Graveyard",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-216 Graveyard.jpg",
    "isSecret": false,
    "gameplayId": "BOA-216",
    "copyLimit": 1,
    "effectText": "Whenever a Unit you control dies, you may pay 2 energy to put into play one 'Skeleton' Army in your Recruiting Area. You can only activate this once per turn."
  },
  {
    "id": "BOA-217",
    "name": "Baba Yaga's Hut",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-217 Baba Yaga's Hut.jpg",
    "isSecret": false,
    "gameplayId": "BOA-217",
    "copyLimit": 1,
    "effectText": "Whenever an opponent draws their second card during a turn, you may deal 1 Damage to any Target Unit you don't control."
  },
  {
    "id": "BOA-218",
    "name": "African Jungle",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-218 African Jungle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-218",
    "copyLimit": 1,
    "effectText": "Once per turn when you reveal an Animal, you may look at the top card of your Deck. If it is an Animal, show it to your opponent and add it to your hand. Otherwise, put it on top or bottom of your Deck."
  },
  {
    "id": "BOA-219",
    "name": "Babylon",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-219 Babylon.jpg",
    "isSecret": false,
    "gameplayId": "BOA-219",
    "copyLimit": 1,
    "effectText": "Once per turn when you draw your first card during your turn, you may pay 3 energy. If so, draw an additional card."
  },
  {
    "id": "BOA-220",
    "name": "Persepolis",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-220 Persepolis.jpg",
    "isSecret": false,
    "gameplayId": "BOA-220",
    "copyLimit": 1,
    "effectText": "Whenever a Unit you control deals Damage to a Stronghold, draw a card."
  },
  {
    "id": "BOA-221",
    "name": "Sparta",
    "set": "Battle of Ages",
    "rarity": "Uncommon",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-221 Sparta.jpg",
    "isSecret": false,
    "gameplayId": "BOA-221",
    "copyLimit": 1,
    "effectText": "Whenever a Unit you control wins a Battle against a Unit with a higher Energy Cost, you may put into play one 'Spartan Soldier' army into your Recruiting Area."
  },
  {
    "id": "BOA-222",
    "name": "Pembroke Castle",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-222 Pembroke Castle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-222",
    "copyLimit": 1,
    "effectText": "All damage dealt to Pembroke Castle and Units in your Recruting Area is reduced by 1."
  },
  {
    "id": "BOA-223",
    "name": "Sherwood Forest",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-223 Sherwood Forest.jpg",
    "isSecret": false,
    "gameplayId": "BOA-223",
    "copyLimit": 1,
    "effectText": "Whenever an opponent Discards a card due to an effect you control, draw a card. This only activates once per turn."
  },
  {
    "id": "BOA-224",
    "name": "Nottingham Castle",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-224 Nottingham Castle.jpg",
    "isSecret": false,
    "gameplayId": "BOA-224",
    "copyLimit": 1,
    "effectText": "Your Units with a cost of 4 or higher cost one more to play. When you reveal a Unit witha Cost of 4 or more, draw a card."
  },
  {
    "id": "BOA-225",
    "name": "Davinci's Workshop",
    "set": "Battle of Ages",
    "rarity": "Common",
    "type": "Stronghold",
    "cost": null,
    "atk": null,
    "hp": 15,
    "range": null,
    "spd": null,
    "characteristics": [],
    "effectName": "",
    "setCode": "BOA",
    "types": [
      "Stronghold"
    ],
    "image": "cards/BOA-225 Davinci's Workshop.jpg",
    "isSecret": false,
    "gameplayId": "BOA-225",
    "copyLimit": 1,
    "effectText": "Discard one card: During this turn, the next Construct or Item you play cost 1 less. You can only activate this once per turn and only during your turn."
  },
  {
    "id": "BOA-226",
    "name": "King Arthur",
    "set": "Battle of Ages",
    "rarity": "Secret Rare",
    "type": "Character",
    "cost": 5,
    "atk": 6,
    "hp": 6,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "King",
      "Knight",
      "Brit"
    ],
    "effectName": "Chosen King",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-226 King Arthur.jpg",
    "isSecret": true,
    "gameplayId": "BOA-001",
    "sharedCardId": "KING_ARTHUR",
    "recruitAudio": {"voice":"../sounds/King Arthur.mp3","music":"../sounds/King Arthur 2.mp3","voiceVolume":1,"musicVolume":0.32,"duckBackgroundMusic":true},
    "variantOf": "BOA-001",
    "copyLimit": 3,
    "effectText": "Other Units you control gain +2 Attack and +1 Speed."
  },
  {
    "id": "BOA-227",
    "name": "Dracula",
    "set": "Battle of Ages",
    "rarity": "Secret Rare",
    "type": "Character",
    "cost": 6,
    "atk": 6,
    "hp": 8,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "Vampire",
      "Undead"
    ],
    "effectName": "Lord of the Dead",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-227 Dracula.jpg",
    "isSecret": true,
    "gameplayId": "BOA-020",
    "variantOf": "BOA-020",
    "copyLimit": 3,
    "effectText": "Whenever Dracula is revealed, you may put a Character from your Discard Pile into play Revealed and adjacent to Dracula."
  },
  {
    "id": "BOA-228",
    "name": "Tarzan",
    "set": "Battle of Ages",
    "rarity": "Secret Rare",
    "type": "Character",
    "cost": 5,
    "atk": 5,
    "hp": 6,
    "range": 1,
    "spd": 3,
    "characteristics": [],
    "effectName": "Beast Master",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-228 Tarzan.jpg",
    "isSecret": true,
    "gameplayId": "BOA-039",
    "variantOf": "BOA-039",
    "copyLimit": 3,
    "effectText": "Whenever Tarzan is revealed, you may put into play one Animal from your hand, adjacent to Tarzan without paying its cost."
  },
  {
    "id": "BOA-229",
    "name": "Alexander the Great",
    "set": "Battle of Ages",
    "rarity": "Secret Rare",
    "type": "Character",
    "cost": 10,
    "atk": 12,
    "hp": 10,
    "range": 2,
    "spd": 3,
    "characteristics": [
      "King",
      "Warrior",
      "Macedonian"
    ],
    "effectName": "Conqueror of Worlds",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-229 Alexander the Great.jpg",
    "isSecret": true,
    "gameplayId": "BOA-062",
    "variantOf": "BOA-062",
    "copyLimit": 3,
    "effectText": "Whenever Alexander the Great destroys a Unit or Construct by Battle, restore his Speed to 3. He can attack another Unit or Construct again this turn."
  },
  {
    "id": "BOA-230",
    "name": "Joan of Arc",
    "set": "Battle of Ages",
    "rarity": "Secret Rare",
    "type": "Character",
    "cost": 3,
    "atk": 3,
    "hp": 5,
    "range": 1,
    "spd": 2,
    "characteristics": [
      "French"
    ],
    "effectName": "Banner of Light",
    "setCode": "BOA",
    "types": [
      "Character"
    ],
    "image": "cards/BOA-230 Joan of Arc.jpg",
    "isSecret": true,
    "gameplayId": "BOA-077",
    "variantOf": "BOA-077",
    "copyLimit": 3,
    "effectText": "Whenever Joan of Arc is revealed, reveal all Units on the Battlefield. As long as you control Joan of Arc, Units cannot be concealed."
  }
];

  const VALID_TYPES = new Set([
    "Character", "Army", "Animal", "Construct", "Item",
    "Event", "Action", "Stronghold", "Unit"
  ]);

  function strings(value) {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return [...new Set(values.map(item => String(item).trim()).filter(Boolean))];
  }

  function normalizeEntry(source) {
    const card = { ...source };
    card.id = String(card.id || "").trim();
    card.name = String(card.name || card.id || "Unnamed Card").trim();
    card.types = strings(card.types?.length ? card.types : card.type);
    card.type = card.type || card.types[0] || "Unit";
    if (!card.types.includes(card.type)) card.types.unshift(card.type);
    card.characteristics = strings(card.characteristics);
    card.traits = strings(card.traits ?? card.trait);
    card.keywords = strings(card.keywords); // legacy compatibility only
    card.cost = Number(card.cost ?? 0);
    if (card.types.some((type) => String(type).toLowerCase() === "army")) {
      card.cost = 0;
      card.energyCost = 0;
      card.previewHideCost = true;
    }
    card.atk = Number(card.atk ?? card.attack ?? 0);
    card.attack = card.atk;
    card.hp = Number(card.hp ?? card.health ?? 0);
    card.health = card.hp;
    card.range = Number(card.range ?? 0);
    card.spd = Number(card.spd ?? card.speed ?? 0);
    card.speed = card.spd;
    card.gameplayId = card.gameplayId || card.id;
    card.databaseId = card.id;
    card.effectText = String(card.effectText ?? "");
    card.image = card.image ?? card.cardImage ?? null;
    card.cardImage = card.cardImage ?? card.image;
    card.copyLimit = Number.isFinite(Number(card.copyLimit)) ? Number(card.copyLimit) : 3;
    return card;
  }

  const cards = SOURCE_CARDS.map(normalizeEntry);
  const byId = new Map();
  const byGameplayId = new Map();
  const byName = new Map();

  for (const card of cards) {
    if (!byId.has(card.id)) byId.set(card.id, card);
    if (!byGameplayId.has(card.gameplayId)) byGameplayId.set(card.gameplayId, card);
    const key = card.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(card);
  }

  function getById(cardId) {
    const id = String(cardId ?? "").trim();
    return byId.get(id) ?? byGameplayId.get(id) ?? null;
  }

  function getByName(name, options = {}) {
    const matches = byName.get(String(name ?? "").trim().toLowerCase()) ?? [];
    return options.all ? [...matches] : matches[0] ?? null;
  }

  function getByType(type) {
    const wanted = String(type ?? "").trim().toLowerCase();
    return cards.filter(card => card.types.some(value => value.toLowerCase() === wanted));
  }

  function getByCharacteristic(characteristic) {
    const wanted = String(characteristic ?? "").trim().toLowerCase();
    return cards.filter(card => card.characteristics.some(value => value.toLowerCase() === wanted));
  }

  function validate(options = {}) {
    const errors = [];
    const warnings = [];
    const seenIds = new Set();
    const seenNames = new Map();

    for (const [index, card] of cards.entries()) {
      const label = card.id || `entry ${index + 1}`;
      if (!card.id) errors.push(`Entry ${index + 1} is missing an id.`);
      else if (seenIds.has(card.id)) errors.push(`Duplicate card id: ${card.id}`);
      else seenIds.add(card.id);

      const nameKey = card.name.toLowerCase();
      if (seenNames.has(nameKey) && seenNames.get(nameKey) !== card.gameplayId) {
        warnings.push(`Duplicate card name: ${card.name}`);
      } else seenNames.set(nameKey, card.gameplayId);

      if (!card.name) errors.push(`${label} is missing a name.`);
      if (!card.types.length) errors.push(`${label} is missing a card type.`);
      for (const type of card.types) {
        if (!VALID_TYPES.has(type)) warnings.push(`${label} uses unknown type: ${type}`);
      }
      if (!Number.isFinite(card.cost) || card.cost < 0) errors.push(`${label} has invalid cost.`);
      if (!card.image) warnings.push(`${label} is missing artwork.`);
      if (["Character", "Animal", "Construct", "Army", "Unit"].some(type => card.types.includes(type))) {
        for (const stat of ["atk", "hp", "range", "spd"]) {
          if (!Number.isFinite(card[stat])) errors.push(`${label} has invalid ${stat}.`);
        }
      }
    }

    const report = { valid: errors.length === 0, cardCount: cards.length, errors, warnings };
    if (options.log !== false) {
      const method = report.valid ? "info" : "error";
      console[method](`[WUS Card Database] ${cards.length} cards; ${errors.length} errors; ${warnings.length} warnings.`, report);
    }
    return report;
  }

  const api = Object.freeze({
    version: "19.9.7",
    cards,
    getById,
    getByName,
    getByType,
    getByCharacteristic,
    normalizeEntry,
    validate,
  });

  // Primary API and temporary compatibility exports used by older modules.
  global.WUSCardDatabase = api;
  global.WUS_CARD_DATABASE = cards;
  global.getCardDatabaseEntry = getById;
  global.getCardById = getById;
  global.getCardByName = getByName;
  global.getCardsByType = getByType;
  global.getCardsByCharacteristic = getByCharacteristic;

  // Validate once at startup. Missing asset files are intentionally not fetched here.
  global.WUS_CARD_DATABASE_REPORT = validate();
})(window);
