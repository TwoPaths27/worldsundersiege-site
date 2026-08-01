"use strict";

/*
 * Worlds Under Siege — Audio Module
 *
 * Owns gameplay sound effects, ambience, end-game audio, playback helpers,
 * and browser audio priming. Other modules may call these shared functions
 * without managing Audio instances directly.
 */

const endGameAudio = {
  collapse: createGameAudio("../sounds/stronghold-collapse.mp3", 1),
  victory: createGameAudio("../sounds/victory-fanfare.mp3", 0.9),
  defeatVoice: createGameAudio("../sounds/defeat-voice.mp3", 0.86),
  defeatStinger: createGameAudio("../sounds/defeat-stinger.mp3", 0.86),
};

const GAMEPLAY_SFX_VOLUME = 0.78;
const gameplayAudio = {
  mouseClick: createGameAudio("../sounds/mouse-click.mp3", GAMEPLAY_SFX_VOLUME),
  energy: createGameAudio("../sounds/energy.mp3", GAMEPLAY_SFX_VOLUME),
  placement: createGameAudio("../sounds/placement.mp3", GAMEPLAY_SFX_VOLUME),
  move: createGameAudio("../sounds/move.mp3", GAMEPLAY_SFX_VOLUME),
  attack: createGameAudio("../sounds/attack.mp3", GAMEPLAY_SFX_VOLUME),
  death: createGameAudio("../sounds/death.mp3", GAMEPLAY_SFX_VOLUME),
  strongholdHit: createGameAudio("../sounds/stronghold-hit.mp3", GAMEPLAY_SFX_VOLUME),
};

const ambienceAudio = createGameAudio("../sounds/ambience.mp3", 0.25);
ambienceAudio.loop = true;
let ambienceStarted = false;
let endGameAudioPrimed = false;

function createGameAudio(source, volume) {
  const audio = new Audio(source);
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
}

function startAmbience() {
  if (ambienceStarted) return;
  ambienceStarted = true;

  try {
    const playback = ambienceAudio.play();
    if (playback?.catch) playback.catch(() => {});
  } catch {
    // Optional/missing sound files never interrupt gameplay.
  }
}

function playGameAudio(audio) {
  if (!audio) return Promise.resolve();

  audio.pause();
  audio.currentTime = 0;

  try {
    const playback = audio.play();
    return playback?.catch ? playback.catch(() => {}) : Promise.resolve();
  } catch {
    return Promise.resolve();
  }
}

function playGameAudioGroup(...tracks) {
  const playableTracks = tracks.filter(Boolean);

  playableTracks.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });

  // Start every track in the same JavaScript task so layered sounds stay synchronized.
  return Promise.allSettled(
    playableTracks.map((audio) => {
      try {
        const playback = audio.play();
        return playback?.catch ? playback.catch(() => {}) : Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    })
  );
}

function playOneShot(audio) {
  if (!audio) return;

  const instance = audio.cloneNode();
  instance.volume = audio.volume;
  instance.currentTime = 0;

  try {
    const playback = instance.play();
    if (playback?.catch) playback.catch(() => {});
  } catch {
    // Optional/missing sound files never interrupt gameplay.
  }
}

function playRepeatedSound(audio, count, interval = 150) {
  const repeatCount = Math.max(0, Math.floor(count));
  for (let index = 0; index < repeatCount; index += 1) {
    window.setTimeout(() => playOneShot(audio), index * interval);
  }
}

function primeEndGameAudio() {
  if (endGameAudioPrimed) return;
  endGameAudioPrimed = true;

  [...Object.values(endGameAudio), ...Object.values(gameplayAudio)].forEach((audio) => {
    const originalVolume = audio.volume;
    audio.volume = 0;
    audio.currentTime = 0;

    try {
      const playback = audio.play();
      if (playback?.then) {
        playback
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = originalVolume;
          })
          .catch(() => {
            audio.volume = originalVolume;
          });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = originalVolume;
      }
    } catch {
      audio.volume = originalVolume;
    }
  });
}



/* Premium reveal presentation -------------------------------------------- */
const kingArthurRevealAudio = {
  voice: createGameAudio("../sounds/King Arthur.mp3", 1.0),
  music: createGameAudio("../sounds/King Arthur 2.mp3", 0.6),
};
const merlinRevealAudio = {
  voice: createGameAudio("../sounds/Merlin.mp3", 1.0),
  music: createGameAudio("../sounds/Merlin 2.mp3", 0.5),
};
const lancelotRevealAudio = {
  voice: createGameAudio("../sounds/Lancelot.mp3", 1.0),
  music: createGameAudio("../sounds/Lancelot 2.mp3", 0.6),
};
let premiumRevealPlaybackToken = 0;

function isKingArthurCard(card) {
  if (!card) return false;
  const identities = [card.databaseId, card.gameplayId, card.id, card.variantOf]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());
  return card.name === "King Arthur" || identities.some((id) =>
    id === "BOA-001" || id === "BOA-226" || id === "SD1-001"
  );
}

function isMerlinCard(card) {
  if (!card) return false;
  const identities = [card.databaseId, card.gameplayId, card.id, card.variantOf, card.sharedCardId]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());
  return card.name === "Merlin" || identities.includes("BOA-002") || identities.includes("MERLIN");
}

function isLancelotCard(card) {
  if (!card) return false;
  const identities = [card.databaseId, card.gameplayId, card.id, card.variantOf, card.sharedCardId]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());
  return card.name === "Sir Lancelot" || card.name === "Lancelot" ||
    identities.includes("BOA-003") || identities.includes("LANCELOT");
}

function fadeAudioVolume(audio, targetVolume, duration = 500) {
  if (!audio) return Promise.resolve();
  const startVolume = Number(audio.volume) || 0;
  const target = Math.max(0, Math.min(1, Number(targetVolume) || 0));
  const startedAt = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
      audio.volume = startVolume + (target - startVolume) * progress;
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

function waitForAudioToFinish(audio) {
  if (!audio) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      audio.removeEventListener("ended", finish);
      audio.removeEventListener("error", finish);
      resolve();
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    // Missing metadata/files must never leave ambience permanently ducked.
    window.setTimeout(finish, 30000);
  });
}

async function playPremiumRevealAudioPair(audioPair, { voiceVolume = 1, musicVolume = 0.5 } = {}) {
  const token = ++premiumRevealPlaybackToken;
  const normalAmbienceVolume = 0.25;

  await fadeAudioVolume(ambienceAudio, 0.07, 350);
  if (token !== premiumRevealPlaybackToken) return;

  const voice = audioPair.voice;
  const music = audioPair.music;
  voice.pause(); music.pause();
  voice.currentTime = 0; music.currentTime = 0;
  voice.volume = voiceVolume;
  music.volume = musicVolume;

  await playGameAudioGroup(voice, music);
  await Promise.allSettled([waitForAudioToFinish(voice), waitForAudioToFinish(music)]);

  if (token === premiumRevealPlaybackToken) {
    await fadeAudioVolume(ambienceAudio, normalAmbienceVolume, 900);
  }
}

async function playKingArthurRevealPresentation(unit) {
  if (!isKingArthurCard(unit)) return;
  return playPremiumRevealAudioPair(kingArthurRevealAudio, {
    voiceVolume: 1.0,
    musicVolume: 0.6,
  });
}

async function playMerlinRevealPresentation(unit) {
  if (!isMerlinCard(unit)) return;
  return playPremiumRevealAudioPair(merlinRevealAudio, {
    voiceVolume: 1.0,
    musicVolume: 0.5,
  });
}

async function playLancelotRevealPresentation(unit) {
  if (!isLancelotCard(unit)) return;
  return playPremiumRevealAudioPair(lancelotRevealAudio, {
    voiceVolume: 1.0,
    musicVolume: 0.6,
  });
}

if (typeof onGameEvent === "function") {
  onGameEvent("unitRevealed", (event) => {
    const unit = event?.payload?.unit;
    if (isKingArthurCard(unit)) playKingArthurRevealPresentation(unit);
    else if (isMerlinCard(unit)) playMerlinRevealPresentation(unit);
    else if (isLancelotCard(unit)) playLancelotRevealPresentation(unit);
  }, { priority: -10 });
}


document.addEventListener("pointerdown", startAmbience, { once: true });
