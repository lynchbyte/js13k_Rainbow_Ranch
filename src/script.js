import { Stage } from "./classStage.js";
export const stage = new Stage();

import { AudioManager } from "./audio.js";
export const audioManager = new AudioManager(stage);

import { Hand } from './classHand.js';
export const hand = new Hand(stage);

import { Unicorn } from "./classUnicorn.js";
export const unicorn = new Unicorn(stage);

import { CollisionBVH } from "./classBVH.js";
import { addFence, addBarn  } from "./addStageComponents.js";

//const environmentColliders= addFence(stage);

const fenceColliders = addFence(stage);
const barnColliders = addBarn(stage);
const environmentColliders = fenceColliders.concat(barnColliders);

export const environmentCollisionBVH = new CollisionBVH(environmentColliders);

import { Player } from "./classPlayer.js";
export const player = new Player(stage);

import { Landing } from "./classLanding.js";
export const landing = new Landing(stage);

import vertShader from "./rainbowShader/vertex.glsl";
import fragShader from "./rainbowShader/fragment.glsl";
export { vertShader, fragShader };

import { EmojiFactory } from "./addStageEmojis.js";
export const emojiFactory = new EmojiFactory(stage); 

import { Donkey } from "./classDonkey.js";
export const donkeyInst = new Donkey(stage);

stage.init();
audioManager.initSong();









