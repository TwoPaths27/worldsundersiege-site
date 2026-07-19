// Battle of Ages booster data — Step 1
// BOA-001 through BOA-227 only. SD1 cards are intentionally excluded.

const BOA_PACK_CARDS = [
  {
    "id": "BOA-001",
    "name": "King Arthur",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-001 King Arthur.jpg"
  },
  {
    "id": "BOA-002",
    "name": "Merlin",
    "rarity": "Super Rare",
    "image": "cards/BOA-002 Merlin.jpg"
  },
  {
    "id": "BOA-003",
    "name": "Sir Lancelot",
    "rarity": "Super Rare",
    "image": "cards/BOA-003 Sir Lancelot.jpg"
  },
  {
    "id": "BOA-004",
    "name": "Sir Yvain",
    "rarity": "Rare",
    "image": "cards/BOA-004 Sir Yvain.jpg"
  },
  {
    "id": "BOA-005",
    "name": "Sir Galahad",
    "rarity": "Uncommon",
    "image": "cards/BOA-005 Sir Galahad.jpg"
  },
  {
    "id": "BOA-006",
    "name": "Sir Kay",
    "rarity": "Common",
    "image": "cards/BOA-006 Sir Kay.jpg"
  },
  {
    "id": "BOA-007",
    "name": "Sir Lucan",
    "rarity": "Common",
    "image": "cards/BOA-007 Sir Lucan.jpg"
  },
  {
    "id": "BOA-008",
    "name": "Sir Gawain",
    "rarity": "Rare",
    "image": "cards/BOA-008 Sir Gawain.jpg"
  },
  {
    "id": "BOA-009",
    "name": "Sir Bedivere",
    "rarity": "Common",
    "image": "cards/BOA-009 Sir Bedivere.jpg"
  },
  {
    "id": "BOA-010",
    "name": "Sir Sagremore",
    "rarity": "Common",
    "image": "cards/BOA-010 Sir Sagremore.jpg"
  },
  {
    "id": "BOA-011",
    "name": "Lady of the Lake",
    "rarity": "Uncommon",
    "image": "cards/BOA-011 Lady of the Lake.jpg"
  },
  {
    "id": "BOA-012",
    "name": "Queen Guinevere",
    "rarity": "Common",
    "image": "cards/BOA-012 Queen Guinevere.jpg"
  },
  {
    "id": "BOA-013",
    "name": "Mordred",
    "rarity": "Super Rare",
    "image": "cards/BOA-013 Mordred.jpg"
  },
  {
    "id": "BOA-014",
    "name": "Sir Percival",
    "rarity": "Uncommon",
    "image": "cards/BOA-014 Sir Percival.jpg"
  },
  {
    "id": "BOA-015",
    "name": "Sir Bors",
    "rarity": "Uncommon",
    "image": "cards/BOA-015 Sir Bors.jpg"
  },
  {
    "id": "BOA-016",
    "name": "Sir Tristan",
    "rarity": "Common",
    "image": "cards/BOA-016 Sir Tristan.jpg"
  },
  {
    "id": "BOA-017",
    "name": "Sir Gareth",
    "rarity": "Common",
    "image": "cards/BOA-017 Sir Gareth.jpg"
  },
  {
    "id": "BOA-018",
    "name": "Sir Argavain",
    "rarity": "Uncommon",
    "image": "cards/BOA-018 Sir Argavain.jpg"
  },
  {
    "id": "BOA-019",
    "name": "Sir Gaheris",
    "rarity": "Common",
    "image": "cards/BOA-019 Sir Gaheris.jpg"
  },
  {
    "id": "BOA-020",
    "name": "Dracula",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-020 Dracula.jpg"
  },
  {
    "id": "BOA-021",
    "name": "Frankenstein's Monster",
    "rarity": "Super Rare",
    "image": "cards/BOA-021 Frankenstein's Monster.jpg"
  },
  {
    "id": "BOA-022",
    "name": "Yeti",
    "rarity": "Rare",
    "image": "cards/BOA-022 Yeti.jpg"
  },
  {
    "id": "BOA-023",
    "name": "Bertrand Calliet",
    "rarity": "Common",
    "image": "cards/BOA-023 Bertrand Calliet.jpg"
  },
  {
    "id": "BOA-024",
    "name": "Headless Horseman",
    "rarity": "Common",
    "image": "cards/BOA-024 Headless Horseman.jpg"
  },
  {
    "id": "BOA-025",
    "name": "Big Foot",
    "rarity": "Common",
    "image": "cards/BOA-025 Big Foot.jpg"
  },
  {
    "id": "BOA-026",
    "name": "Nosferatu",
    "rarity": "Uncommon",
    "image": "cards/BOA-026 Nosferatu.jpg"
  },
  {
    "id": "BOA-027",
    "name": "Van Helsing",
    "rarity": "Rare",
    "image": "cards/BOA-027 Van Helsing.jpg"
  },
  {
    "id": "BOA-028",
    "name": "Swamp Monster",
    "rarity": "Uncommon",
    "image": "cards/BOA-028 Swamp Monster.jpg"
  },
  {
    "id": "BOA-029",
    "name": "Boogeyman",
    "rarity": "Common",
    "image": "cards/BOA-029 Boogeyman.jpg"
  },
  {
    "id": "BOA-030",
    "name": "Nelly Butler",
    "rarity": "Rare",
    "image": "cards/BOA-030 Nelly Butler.jpg"
  },
  {
    "id": "BOA-031",
    "name": "Invisible Man",
    "rarity": "Common",
    "image": "cards/BOA-031 Invisible Man.jpg"
  },
  {
    "id": "BOA-032",
    "name": "Undead Widow",
    "rarity": "Uncommon",
    "image": "cards/BOA-032 Undead Widow.jpg"
  },
  {
    "id": "BOA-033",
    "name": "Dr Jekyl / Mr Hyde",
    "rarity": "Common",
    "image": "cards/BOA-033 Dr Jekyl.jpg"
  },
  {
    "id": "BOA-034",
    "name": "Dr Frankenstein",
    "rarity": "Common",
    "image": "cards/BOA-034 Dr Frankenstein.jpg"
  },
  {
    "id": "BOA-035",
    "name": "The Phantom",
    "rarity": "Rare",
    "image": "cards/BOA-035 The Phantom.jpg"
  },
  {
    "id": "BOA-036",
    "name": "Strigoi",
    "rarity": "Common",
    "image": "cards/BOA-036 Strigoi.jpg"
  },
  {
    "id": "BOA-037",
    "name": "Baba Yaga",
    "rarity": "Common",
    "image": "cards/BOA-037 Baba Yaga.jpg"
  },
  {
    "id": "BOA-038",
    "name": "Leshy",
    "rarity": "Rare",
    "image": "cards/BOA-038 Leshy.jpg"
  },
  {
    "id": "BOA-039",
    "name": "Tarzan",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-039 Tarzan.jpg"
  },
  {
    "id": "BOA-040",
    "name": "Mbonga",
    "rarity": "Rare",
    "image": "cards/BOA-040 Mbonga.jpg"
  },
  {
    "id": "BOA-041",
    "name": "Jane Porter",
    "rarity": "Uncommon",
    "image": "cards/BOA-041 Jane Porter.jpg"
  },
  {
    "id": "BOA-042",
    "name": "Professor Porter",
    "rarity": "Rare",
    "image": "cards/BOA-042 Professor Porter.jpg"
  },
  {
    "id": "BOA-043",
    "name": "William Clayton",
    "rarity": "Uncommon",
    "image": "cards/BOA-043 William Clayton.jpg"
  },
  {
    "id": "BOA-044",
    "name": "Rockoff",
    "rarity": "Uncommon",
    "image": "cards/BOA-044 Rockoff.jpg"
  },
  {
    "id": "BOA-045",
    "name": "Robin Hood",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-045 Robin Hood.jpg"
  },
  {
    "id": "BOA-046",
    "name": "Little John",
    "rarity": "Uncommon",
    "image": "cards/BOA-046 Little John.jpg"
  },
  {
    "id": "BOA-047",
    "name": "The Monk",
    "rarity": "Common",
    "image": "cards/BOA-047 The Monk.jpg"
  },
  {
    "id": "BOA-048",
    "name": "Guy of Gisborne",
    "rarity": "Rare",
    "image": "cards/BOA-048 Guy of Gisborne.jpg"
  },
  {
    "id": "BOA-049",
    "name": "Sheriff of Nottingham",
    "rarity": "Rare",
    "image": "cards/BOA-049 Sheriff of Nottingham.jpg"
  },
  {
    "id": "BOA-050",
    "name": "King Leonidas",
    "rarity": "Super Rare",
    "image": "cards/BOA-050 King Leonidas.jpg"
  },
  {
    "id": "BOA-051",
    "name": "Queen Gorgo",
    "rarity": "Uncommon",
    "image": "cards/BOA-051 Queen Gorgo.jpg"
  },
  {
    "id": "BOA-052",
    "name": "Dienkes",
    "rarity": "Common",
    "image": "cards/BOA-052 Dienkes.jpg"
  },
  {
    "id": "BOA-053",
    "name": "Demophilus",
    "rarity": "Uncommon",
    "image": "cards/BOA-053 Demophilus.jpg"
  },
  {
    "id": "BOA-054",
    "name": "Captain Ahab",
    "rarity": "Rare",
    "image": "cards/BOA-054 Captain Ahab.jpg"
  },
  {
    "id": "BOA-055",
    "name": "Ishmael",
    "rarity": "Common",
    "image": "cards/BOA-055 Ishmael.jpg"
  },
  {
    "id": "BOA-056",
    "name": "King Richard I",
    "rarity": "Super Rare",
    "image": "cards/BOA-056 King Richard I.jpg"
  },
  {
    "id": "BOA-057",
    "name": "William Marshal",
    "rarity": "Rare",
    "image": "cards/BOA-057 William Marshal.jpg"
  },
  {
    "id": "BOA-058",
    "name": "King Henry II",
    "rarity": "Uncommon",
    "image": "cards/BOA-058 King Henry II.jpg"
  },
  {
    "id": "BOA-059",
    "name": "Henry the Young",
    "rarity": "Common",
    "image": "cards/BOA-059 Henry the Young.jpg"
  },
  {
    "id": "BOA-060",
    "name": "King John",
    "rarity": "Common",
    "image": "cards/BOA-060 King John.jpg"
  },
  {
    "id": "BOA-061",
    "name": "Prince Louis VIII",
    "rarity": "Uncommon",
    "image": "cards/BOA-061 Prince Louis VIII.jpg"
  },
  {
    "id": "BOA-062",
    "name": "Alexander the Great",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-062 Alexander the Great.jpg"
  },
  {
    "id": "BOA-063",
    "name": "Aristotle",
    "rarity": "Super Rare",
    "image": "cards/BOA-063 Aristotle.jpg"
  },
  {
    "id": "BOA-064",
    "name": "Phillip II of Macedonia",
    "rarity": "Rare",
    "image": "cards/BOA-064 Phillip II of Macedonia.jpg"
  },
  {
    "id": "BOA-065",
    "name": "Olympias of Epirus",
    "rarity": "Rare",
    "image": "cards/BOA-065 Olympias of Epirus.jpg"
  },
  {
    "id": "BOA-066",
    "name": "Hephasteon",
    "rarity": "Rare",
    "image": "cards/BOA-066 Hephasteon.jpg"
  },
  {
    "id": "BOA-067",
    "name": "Perdiccas",
    "rarity": "Common",
    "image": "cards/BOA-067 Perdiccas.jpg"
  },
  {
    "id": "BOA-068",
    "name": "Cleitus the Black",
    "rarity": "Common",
    "image": "cards/BOA-068 Cleitus the Black.jpg"
  },
  {
    "id": "BOA-069",
    "name": "Arminius",
    "rarity": "Uncommon",
    "image": "cards/BOA-069 Arminius.jpg"
  },
  {
    "id": "BOA-070",
    "name": "Sun Tzu",
    "rarity": "Super Rare",
    "image": "cards/BOA-070 Sun Tzu.jpg"
  },
  {
    "id": "BOA-071",
    "name": "Attila the Hun",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-071 Attila the Hun.jpg"
  },
  {
    "id": "BOA-072",
    "name": "Boudica",
    "rarity": "Rare",
    "image": "cards/BOA-072 Boudica.jpg"
  },
  {
    "id": "BOA-073",
    "name": "Leonardo Da Vinci",
    "rarity": "Rare",
    "image": "cards/BOA-073 Leonardo Da Vinci.jpg"
  },
  {
    "id": "BOA-074",
    "name": "King Cyrus",
    "rarity": "Super Rare",
    "image": "cards/BOA-074 King Cyrus.jpg"
  },
  {
    "id": "BOA-075",
    "name": "King Xerxes I",
    "rarity": "Uncommon",
    "image": "cards/BOA-075 King Xerxes I.jpg"
  },
  {
    "id": "BOA-076",
    "name": "King Darius III",
    "rarity": "Uncommon",
    "image": "cards/BOA-076 King Darius III.jpg"
  },
  {
    "id": "BOA-077",
    "name": "Joan of Arc",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-077 Joan of Arc.jpg"
  },
  {
    "id": "BOA-078",
    "name": "King Charles VII",
    "rarity": "Super Rare",
    "image": "cards/BOA-078 King Charles VII.jpg"
  },
  {
    "id": "BOA-079",
    "name": "Jean De Dunois",
    "rarity": "Common",
    "image": "cards/BOA-079 Jean De Dunois.jpg"
  },
  {
    "id": "BOA-080",
    "name": "John Talbot",
    "rarity": "Rare",
    "image": "cards/BOA-080 John Talbot.jpg"
  },
  {
    "id": "BOA-081",
    "name": "Mothman",
    "rarity": "Uncommon",
    "image": "cards/BOA-081 Mothman.jpg"
  },
  {
    "id": "BOA-082",
    "name": "The Grim Reaper",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-082 The Grim Reaper.jpg"
  },
  {
    "id": "BOA-083",
    "name": "Ghengis Khan",
    "rarity": "Common",
    "image": "cards/BOA-083 Ghengis Khan.jpg"
  },
  {
    "id": "BOA-084",
    "name": "Mulan",
    "rarity": "Uncommon",
    "image": "cards/BOA-084 Mulan.jpg"
  },
  {
    "id": "BOA-085",
    "name": "Sun Wukong",
    "rarity": "Rare",
    "image": "cards/BOA-085 Sun Wukong.jpg"
  },
  {
    "id": "BOA-086",
    "name": "John Henry",
    "rarity": "Uncommon",
    "image": "cards/BOA-086 John Henry.jpg"
  },
  {
    "id": "BOA-087",
    "name": "Nostradamus",
    "rarity": "Rare",
    "image": "cards/BOA-087 Nostradamus.jpg"
  },
  {
    "id": "BOA-088",
    "name": "Ferdinand Magellan",
    "rarity": "Super Rare",
    "image": "cards/BOA-088 Ferdinand Magellan.jpg"
  },
  {
    "id": "BOA-089",
    "name": "Roland",
    "rarity": "Rare",
    "image": "cards/BOA-089 Roland.jpg"
  },
  {
    "id": "BOA-090",
    "name": "Napoleon Bonaparte",
    "rarity": "Uncommon",
    "image": "cards/BOA-090 Napoleon Bonaparte.jpg"
  },
  {
    "id": "BOA-091",
    "name": "Daredevil",
    "rarity": "Common",
    "image": "cards/BOA-091 Daredevil.jpg"
  },
  {
    "id": "BOA-092",
    "name": "Moby Dick",
    "rarity": "Super Rare",
    "image": "cards/BOA-092 Moby Dick.jpg"
  },
  {
    "id": "BOA-093",
    "name": "Kerchak",
    "rarity": "Rare",
    "image": "cards/BOA-093 Kerchak.jpg"
  },
  {
    "id": "BOA-094",
    "name": "Kala",
    "rarity": "Uncommon",
    "image": "cards/BOA-094 Kala.jpg"
  },
  {
    "id": "BOA-095",
    "name": "Gorilla",
    "rarity": "Common",
    "image": "cards/BOA-095 Gorilla.jpg"
  },
  {
    "id": "BOA-096",
    "name": "Tantor",
    "rarity": "Common",
    "image": "cards/BOA-096 Tantor.jpg"
  },
  {
    "id": "BOA-097",
    "name": "Jad-Bal-ja",
    "rarity": "Uncommon",
    "image": "cards/BOA-097 Jad-Bal-ja.jpg"
  },
  {
    "id": "BOA-098",
    "name": "Sabor",
    "rarity": "Uncommon",
    "image": "cards/BOA-098 Sabor.jpg"
  },
  {
    "id": "BOA-099",
    "name": "Gryf",
    "rarity": "Common",
    "image": "cards/BOA-099 Gryf.jpg"
  },
  {
    "id": "BOA-100",
    "name": "Mahar",
    "rarity": "Rare",
    "image": "cards/BOA-100 Mahar.jpg"
  },
  {
    "id": "BOA-101",
    "name": "Cafall",
    "rarity": "Common",
    "image": "cards/BOA-101 Cafall.jpg"
  },
  {
    "id": "BOA-102",
    "name": "Adar Cilgwri",
    "rarity": "Rare",
    "image": "cards/BOA-102 Adar Cilgwri.jpg"
  },
  {
    "id": "BOA-103",
    "name": "Horse",
    "rarity": "Common",
    "image": "cards/BOA-103 Horse.jpg"
  },
  {
    "id": "BOA-104",
    "name": "Armored Horse",
    "rarity": "Rare",
    "image": "cards/BOA-104 Armored Horse.jpg"
  },
  {
    "id": "BOA-105",
    "name": "Dragon",
    "rarity": "Rare",
    "image": "cards/BOA-105 Dragon.jpg"
  },
  {
    "id": "BOA-106",
    "name": "Lion",
    "rarity": "Uncommon",
    "image": "cards/BOA-106 Lion.jpg"
  },
  {
    "id": "BOA-107",
    "name": "Ziz",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-107 Ziz.jpg"
  },
  {
    "id": "BOA-108",
    "name": "Leviathan",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-108 Leviathan.jpg"
  },
  {
    "id": "BOA-109",
    "name": "Behemoth",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-109 Behemoth.jpg"
  },
  {
    "id": "BOA-110",
    "name": "Loch Ness Monster",
    "rarity": "Uncommon",
    "image": "cards/BOA-110 Loch Ness Monster.jpg"
  },
  {
    "id": "BOA-111",
    "name": "The Dragon King",
    "rarity": "Super Rare",
    "image": "cards/BOA-111 The Dragon King.jpg"
  },
  {
    "id": "BOA-112",
    "name": "The Kraken",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-112 The Kraken.jpg"
  },
  {
    "id": "BOA-113",
    "name": "Bunyip",
    "rarity": "Common",
    "image": "cards/BOA-113 Bunyip.jpg"
  },
  {
    "id": "BOA-114",
    "name": "Bucephalus",
    "rarity": "Rare",
    "image": "cards/BOA-114 Bucephalus.jpg"
  },
  {
    "id": "BOA-115",
    "name": "Black Shuck",
    "rarity": "Uncommon",
    "image": "cards/BOA-115 Black Shuck.jpg"
  },
  {
    "id": "BOA-116",
    "name": "Grail's Blessing",
    "rarity": "Uncommon",
    "image": "cards/BOA-116 Grail's Blessing.jpg"
  },
  {
    "id": "BOA-117",
    "name": "Last Stand",
    "rarity": "Common",
    "image": "cards/BOA-117 Last Stand.jpg"
  },
  {
    "id": "BOA-118",
    "name": "Charge!",
    "rarity": "Uncommon",
    "image": "cards/BOA-118 Charge!.jpg"
  },
  {
    "id": "BOA-119",
    "name": "Call to Arms",
    "rarity": "Common",
    "image": "cards/BOA-119 Call to Arms.jpg"
  },
  {
    "id": "BOA-120",
    "name": "Gift of the Lady",
    "rarity": "Rare",
    "image": "cards/BOA-120 Gift of the Lady.jpg"
  },
  {
    "id": "BOA-121",
    "name": "Merlin's Prophecy",
    "rarity": "Uncommon",
    "image": "cards/BOA-121 Merlin's Prophecy.jpg"
  },
  {
    "id": "BOA-122",
    "name": "Enchant Weapon",
    "rarity": "Common",
    "image": "cards/BOA-122 Enchant Weapon.jpg"
  },
  {
    "id": "BOA-123",
    "name": "Slay the Beast",
    "rarity": "Uncommon",
    "image": "cards/BOA-123 Slay the Beast.jpg"
  },
  {
    "id": "BOA-124",
    "name": "Divine Cleansing",
    "rarity": "Super Rare",
    "image": "cards/BOA-124 Divine Cleansing.jpg"
  },
  {
    "id": "BOA-125",
    "name": "Explosion!",
    "rarity": "Uncommon",
    "image": "cards/BOA-125 Explosion!.jpg"
  },
  {
    "id": "BOA-126",
    "name": "Reconstruct",
    "rarity": "Common",
    "image": "cards/BOA-126 Reconstruct.jpg"
  },
  {
    "id": "BOA-127",
    "name": "Call of the Night",
    "rarity": "Uncommon",
    "image": "cards/BOA-127 Call of the Night.jpg"
  },
  {
    "id": "BOA-128",
    "name": "Drink of Blood",
    "rarity": "Common",
    "image": "cards/BOA-128 Drink of Blood.jpg"
  },
  {
    "id": "BOA-129",
    "name": "Stake the Undead",
    "rarity": "Common",
    "image": "cards/BOA-129 Stake the Undead.jpg"
  },
  {
    "id": "BOA-130",
    "name": "Hidden in Mist",
    "rarity": "Common",
    "image": "cards/BOA-130 Hidden in Mist.jpg"
  },
  {
    "id": "BOA-131",
    "name": "Invasion of Night",
    "rarity": "Common",
    "image": "cards/BOA-131 Invasion of Night.jpg"
  },
  {
    "id": "BOA-132",
    "name": "Absorb Soul",
    "rarity": "Rare",
    "image": "cards/BOA-132 Absorb Soul.jpg"
  },
  {
    "id": "BOA-133",
    "name": "Raise the Dead",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-133 Raise the Dead.jpg"
  },
  {
    "id": "BOA-134",
    "name": "Zombie Plague",
    "rarity": "Rare",
    "image": "cards/BOA-134 Zombie Plague.jpg"
  },
  {
    "id": "BOA-135",
    "name": "It's Alive!",
    "rarity": "Rare",
    "image": "cards/BOA-135 It's Alive!.jpg"
  },
  {
    "id": "BOA-136",
    "name": "Stitch Together",
    "rarity": "Common",
    "image": "cards/BOA-136 Stitch Together.jpg"
  },
  {
    "id": "BOA-137",
    "name": "Duality",
    "rarity": "Common",
    "image": "cards/BOA-137 Duality.jpg"
  },
  {
    "id": "BOA-138",
    "name": "Split",
    "rarity": "Rare",
    "image": "cards/BOA-138 Split.jpg"
  },
  {
    "id": "BOA-139",
    "name": "Harsh Storm",
    "rarity": "Rare",
    "image": "cards/BOA-139 Harsh Storm.jpg"
  },
  {
    "id": "BOA-140",
    "name": "Navigator's Insight",
    "rarity": "Uncommon",
    "image": "cards/BOA-140 Navigator's Insight.jpg"
  },
  {
    "id": "BOA-141",
    "name": "Stand Your Ground",
    "rarity": "Rare",
    "image": "cards/BOA-141 Stand Your Ground.jpg"
  },
  {
    "id": "BOA-142",
    "name": "Aristotle's Philosophy",
    "rarity": "Rare",
    "image": "cards/BOA-142 Aristotle's Philosophy.jpg"
  },
  {
    "id": "BOA-143",
    "name": "Stealth Attack",
    "rarity": "Rare",
    "image": "cards/BOA-143 Stealth Attack.jpg"
  },
  {
    "id": "BOA-144",
    "name": "Cunning Thievery",
    "rarity": "Super Rare",
    "image": "cards/BOA-144 Cunning Thievery.jpg"
  },
  {
    "id": "BOA-145",
    "name": "Vine Swing",
    "rarity": "Common",
    "image": "cards/BOA-145 Vine Swing.jpg"
  },
  {
    "id": "BOA-146",
    "name": "Taking Aim",
    "rarity": "Common",
    "image": "cards/BOA-146 Taking Aim.jpg"
  },
  {
    "id": "BOA-147",
    "name": "Stampede!",
    "rarity": "Common",
    "image": "cards/BOA-147 Stampede!.jpg"
  },
  {
    "id": "BOA-148",
    "name": "Emperor's Greed",
    "rarity": "Common",
    "image": "cards/BOA-148 Emperor's Greed.jpg"
  },
  {
    "id": "BOA-149",
    "name": "Construction Plans",
    "rarity": "Common",
    "image": "cards/BOA-149 Construction Plans.jpg"
  },
  {
    "id": "BOA-150",
    "name": "Martyr",
    "rarity": "Uncommon",
    "image": "cards/BOA-150 Martyr.jpg"
  },
  {
    "id": "BOA-151",
    "name": "Break the Gates",
    "rarity": "Common",
    "image": "cards/BOA-151 Break the Gates.jpg"
  },
  {
    "id": "BOA-152",
    "name": "No Quarter",
    "rarity": "Super Rare",
    "image": "cards/BOA-152 No Quarter.jpg"
  },
  {
    "id": "BOA-153",
    "name": "March On",
    "rarity": "Uncommon",
    "image": "cards/BOA-153 March On.jpg"
  },
  {
    "id": "BOA-154",
    "name": "History Re-Written",
    "rarity": "Super Rare",
    "image": "cards/BOA-154 History Re-Written.jpg"
  },
  {
    "id": "BOA-155",
    "name": "Acrobatic Dodge",
    "rarity": "Common",
    "image": "cards/BOA-155 Acrobatic Dodge.jpg"
  },
  {
    "id": "BOA-156",
    "name": "Arcane Deflect",
    "rarity": "Uncommon",
    "image": "cards/BOA-156 Arcane Deflect.jpg"
  },
  {
    "id": "BOA-157",
    "name": "Spring the Trap",
    "rarity": "Uncommon",
    "image": "cards/BOA-157 Spring the Trap.jpg"
  },
  {
    "id": "BOA-158",
    "name": "Knighthood",
    "rarity": "Super Rare",
    "image": "cards/BOA-158 Knighthood.jpg"
  },
  {
    "id": "BOA-159",
    "name": "Moving Through Shadows",
    "rarity": "Common",
    "image": "cards/BOA-159 Moving Through Shadows.jpg"
  },
  {
    "id": "BOA-160",
    "name": "Clone Army",
    "rarity": "Super Rare",
    "image": "cards/BOA-160 Clone Army.jpg"
  },
  {
    "id": "BOA-161",
    "name": "Adventure Journal",
    "rarity": "Rare",
    "image": "cards/BOA-161 Adventure Journal.jpg"
  },
  {
    "id": "BOA-162",
    "name": "Harpoon Gun",
    "rarity": "Super Rare",
    "image": "cards/BOA-162 Harpoon Gun.jpg"
  },
  {
    "id": "BOA-163",
    "name": "Hoplon Shield",
    "rarity": "Common",
    "image": "cards/BOA-163 Hoplon Shield.jpg"
  },
  {
    "id": "BOA-164",
    "name": "Saddle",
    "rarity": "Rare",
    "image": "cards/BOA-164 Saddle.jpg"
  },
  {
    "id": "BOA-165",
    "name": "Crown of the King",
    "rarity": "Uncommon",
    "image": "cards/BOA-165 Crown of the King.jpg"
  },
  {
    "id": "BOA-166",
    "name": "Excalibur",
    "rarity": "Rare",
    "image": "cards/BOA-166 Excalibur.jpg"
  },
  {
    "id": "BOA-167",
    "name": "The Holy Grail",
    "rarity": "Uncommon",
    "image": "cards/BOA-167 The Holy Grail.jpg"
  },
  {
    "id": "BOA-168",
    "name": "Pridewin Shield",
    "rarity": "Rare",
    "image": "cards/BOA-168 Pridewin Shield.jpg"
  },
  {
    "id": "BOA-169",
    "name": "Spear of Longinus",
    "rarity": "Super Rare",
    "image": "cards/BOA-169 Spear of Longinus.jpg"
  },
  {
    "id": "BOA-170",
    "name": "Lance of Lancelot",
    "rarity": "Uncommon",
    "image": "cards/BOA-170 Lance of Lancelot.jpg"
  },
  {
    "id": "BOA-171",
    "name": "Coffin Bed",
    "rarity": "Uncommon",
    "image": "cards/BOA-171 Coffin Bed.jpg"
  },
  {
    "id": "BOA-172",
    "name": "Elixir of Madness",
    "rarity": "Rare",
    "image": "cards/BOA-172 Elixir of Madness.jpg"
  },
  {
    "id": "BOA-173",
    "name": "Mummy's Tomb",
    "rarity": "Common",
    "image": "cards/BOA-173 Mummy's Tomb.jpg"
  },
  {
    "id": "BOA-174",
    "name": "Yew Longbow",
    "rarity": "Common",
    "image": "cards/BOA-174 Yew Longbow.jpg"
  },
  {
    "id": "BOA-175",
    "name": "Sherwood Cloak",
    "rarity": "Uncommon",
    "image": "cards/BOA-175 Sherwood Cloak.jpg"
  },
  {
    "id": "BOA-176",
    "name": "Battering Ram",
    "rarity": "Common",
    "image": "cards/BOA-176 Battering Ram.jpg"
  },
  {
    "id": "BOA-177",
    "name": "Catapult",
    "rarity": "Common",
    "image": "cards/BOA-177 Catapult.jpg"
  },
  {
    "id": "BOA-178",
    "name": "Ballista",
    "rarity": "Uncommon",
    "image": "cards/BOA-178 Ballista.jpg"
  },
  {
    "id": "BOA-179",
    "name": "Fortified Walls",
    "rarity": "Super Rare",
    "image": "cards/BOA-179- Fortified Walls.jpg"
  },
  {
    "id": "BOA-180",
    "name": "Outpost",
    "rarity": "Common",
    "image": "cards/BOA-180 Outpost.jpg"
  },
  {
    "id": "BOA-181",
    "name": "Siege Tower",
    "rarity": "Rare",
    "image": "cards/BOA-181 Siege Tower.jpg"
  },
  {
    "id": "BOA-182",
    "name": "Watch Tower",
    "rarity": "Common",
    "image": "cards/BOA-182 Watch Tower.jpg"
  },
  {
    "id": "BOA-183",
    "name": "Gargoyle",
    "rarity": "Rare",
    "image": "cards/BOA-183 Gargoyle.jpg"
  },
  {
    "id": "BOA-184",
    "name": "Arcane Barrier",
    "rarity": "Super Rare",
    "image": "cards/BOA-184 Arcane Barrier.jpg"
  },
  {
    "id": "BOA-185",
    "name": "Militia Camp",
    "rarity": "Common",
    "image": "cards/BOA-185 Militia Camp.jpg"
  },
  {
    "id": "BOA-186",
    "name": "Triremes Boat",
    "rarity": "Common",
    "image": "cards/BOA-186 Triremes Boat.jpg"
  },
  {
    "id": "BOA-187",
    "name": "Ornithopter",
    "rarity": "Rare",
    "image": "cards/BOA-187 Ornithopter.jpg"
  },
  {
    "id": "BOA-188",
    "name": "Trebuchet",
    "rarity": "Common",
    "image": "cards/BOA-188 Trebuchet.jpg"
  },
  {
    "id": "BOA-189",
    "name": "Mantlet Shield",
    "rarity": "Common",
    "image": "cards/BOA-189 Mantlet Shield.jpg"
  },
  {
    "id": "BOA-190",
    "name": "Prison Caravan",
    "rarity": "Uncommon",
    "image": "cards/BOA-190 Prison Caravan.jpg"
  },
  {
    "id": "BOA-191",
    "name": "Camelot Soldier",
    "rarity": "Common",
    "image": "cards/BOA-191 Camelot Soldier.jpg"
  },
  {
    "id": "BOA-192",
    "name": "Camelot Spearman",
    "rarity": "Common",
    "image": "cards/BOA-192 Camelot Spearman.jpg"
  },
  {
    "id": "BOA-193",
    "name": "Camelot Archer",
    "rarity": "Common",
    "image": "cards/BOA-193 Camelot Archer.jpg"
  },
  {
    "id": "BOA-194",
    "name": "Zombie",
    "rarity": "Common",
    "image": "cards/BOA-194 Zombie.jpg"
  },
  {
    "id": "BOA-195",
    "name": "Mummy",
    "rarity": "Common",
    "image": "cards/BOA-195 Mummy.jpg"
  },
  {
    "id": "BOA-196",
    "name": "Vampire Bats",
    "rarity": "Common",
    "image": "cards/BOA-196 Vampire Bats.jpg"
  },
  {
    "id": "BOA-197",
    "name": "Spartan Soldier",
    "rarity": "Common",
    "image": "cards/BOA-197 Spartan Soldier.jpg"
  },
  {
    "id": "BOA-198",
    "name": "Kulonga Warrior",
    "rarity": "Common",
    "image": "cards/BOA-198 Kulonga Warrior.jpg"
  },
  {
    "id": "BOA-199",
    "name": "Skeleton",
    "rarity": "Common",
    "image": "cards/BOA-199 Skeleton.jpg"
  },
  {
    "id": "BOA-200",
    "name": "Persian Immortal",
    "rarity": "Common",
    "image": "cards/BOA-200 Persian Immortal.jpg"
  },
  {
    "id": "BOA-201",
    "name": "Quest for the Grail",
    "rarity": "Common",
    "image": "cards/BOA-201Quest for the Grail.jpg"
  },
  {
    "id": "BOA-202",
    "name": "Blood Moon Rises",
    "rarity": "Ultra Rare",
    "image": "cards/BOA-202 Blood Moon Rises.jpg"
  },
  {
    "id": "BOA-203",
    "name": "Tournament of Champions",
    "rarity": "Uncommon",
    "image": "cards/BOA-203 Tournament of Champions.jpg"
  },
  {
    "id": "BOA-204",
    "name": "Storm at Sea",
    "rarity": "Uncommon",
    "image": "cards/BOA-204 Storm at Sea.jpg"
  },
  {
    "id": "BOA-205",
    "name": "Call of the Wild",
    "rarity": "Common",
    "image": "cards/BOA-205 Call of the Wild.jpg"
  },
  {
    "id": "BOA-206",
    "name": "Army March",
    "rarity": "Common",
    "image": "cards/BOA-206 Army March.jpg"
  },
  {
    "id": "BOA-207",
    "name": "End the War",
    "rarity": "Rare",
    "image": "cards/BOA-207 End the War.jpg"
  },
  {
    "id": "BOA-208",
    "name": "Dimension Portal",
    "rarity": "Super Rare",
    "image": "cards/BOA-208 Dimension Portal.jpg"
  },
  {
    "id": "BOA-209",
    "name": "Battle of Thermopylae",
    "rarity": "Uncommon",
    "image": "cards/BOA-209 Battle of Thermopylae.jpg"
  },
  {
    "id": "BOA-210",
    "name": "Battle of Naissus",
    "rarity": "Common",
    "image": "cards/BOA-210 Battle of Naissus.jpg"
  },
  {
    "id": "BOA-211",
    "name": "Camelot",
    "rarity": "Common",
    "image": "cards/BOA-211Camelot.jpg"
  },
  {
    "id": "BOA-212",
    "name": "Dracula's Castle",
    "rarity": "Uncommon",
    "image": "cards/BOA-212 Dracula's Castle.jpg"
  },
  {
    "id": "BOA-213",
    "name": "Frankenstein's Castle",
    "rarity": "Common",
    "image": "cards/BOA-213 Frankenstein's Castle.jpg"
  },
  {
    "id": "BOA-214",
    "name": "Merlin's Sanctum",
    "rarity": "Uncommon",
    "image": "cards/BOA-214 Merlin's Sanctum.jpg"
  },
  {
    "id": "BOA-215",
    "name": "Haunted Manor",
    "rarity": "Uncommon",
    "image": "cards/BOA-215 Haunted Manor.jpg"
  },
  {
    "id": "BOA-216",
    "name": "Graveyard",
    "rarity": "Common",
    "image": "cards/BOA-216 Graveyard.jpg"
  },
  {
    "id": "BOA-217",
    "name": "Baba Yaga's Hut",
    "rarity": "Uncommon",
    "image": "cards/BOA-217 Baba Yaga's Hut.jpg"
  },
  {
    "id": "BOA-218",
    "name": "African Jungle",
    "rarity": "Common",
    "image": "cards/BOA-218 African Jungle.jpg"
  },
  {
    "id": "BOA-219",
    "name": "Babylon",
    "rarity": "Uncommon",
    "image": "cards/BOA-219 Babylon.jpg"
  },
  {
    "id": "BOA-220",
    "name": "Persepolis",
    "rarity": "Common",
    "image": "cards/BOA-220 Persepolis.jpg"
  },
  {
    "id": "BOA-221",
    "name": "Sparta",
    "rarity": "Uncommon",
    "image": "cards/BOA-221 Sparta.jpg"
  },
  {
    "id": "BOA-222",
    "name": "Pembroke Castle",
    "rarity": "Common",
    "image": "cards/BOA-222 Pembroke Castle.jpg"
  },
  {
    "id": "BOA-223",
    "name": "Sherwood Forest",
    "rarity": "Common",
    "image": "cards/BOA-223 Sherwood Forest.jpg"
  },
  {
    "id": "BOA-224",
    "name": "Nottingham Castle",
    "rarity": "Common",
    "image": "cards/BOA-224 Nottingham Castle.jpg"
  },
  {
    "id": "BOA-225",
    "name": "Davinci's Workshop",
    "rarity": "Common",
    "image": "cards/BOA-225 Davinci's Workshop.jpg"
  },
  {
    "id": "BOA-226",
    "name": "King Arthur",
    "rarity": "Secret Rare",
    "image": "cards/BOA-226 King Arthur.jpg"
  },
  {
    "id": "BOA-227",
    "name": "Dracula",
    "rarity": "Secret Rare",
    "image": "cards/BOA-227 Dracula.jpg"
  }
];

const BOA_PACK_CONFIG = {
  set: "BOA",
  setName: "Battle of Ages",
  commonsPerPack: 6,
  uncommonsPerPack: 4,
  premiumSlotsPerPack: 2,
  premiumOdds: {
    secret: 1 / 48,
    ultraRare: 1 / 8,
    superRare: 1 / 4
  }
};
