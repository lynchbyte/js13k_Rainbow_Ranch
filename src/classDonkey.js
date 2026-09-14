import * as THREE from 'three';

import { emojiFactory, audioManager } from './script.js';
import { sfx } from './audio.js';


export class Donkey {

    constructor(stage) {

        this.stage = stage;
        this.scene = stage.scene;

        this.donkeyMeshArr = [];

        this.DonkeyArr = [
            { name: 'Donkey1', startPos: new THREE.Vector3(-140, 50, 0), endPos: new THREE.Vector3(-71, 1.5, 0), whenAppear: 20 },
            { name: 'Donkey2', startPos: new THREE.Vector3(140, 80, 35), endPos: new THREE.Vector3(71, 1.5, 55), whenAppear: 40 },
            { name: 'Donkey3', startPos: new THREE.Vector3(140, 50, -35), endPos: new THREE.Vector3(71, 1.5, 0), whenAppear: 50 },
            { name: 'Donkey4', startPos: new THREE.Vector3(-140, 50, -15), endPos: new THREE.Vector3(-71, 1.5, -55), whenAppear: 60 },
            { name: 'Donkey5', startPos: new THREE.Vector3(-55, 50, 140), endPos: new THREE.Vector3(55, 1.5, 71), whenAppear: 80 },
            { name: 'Donkey6', startPos: new THREE.Vector3(-140, 60, 0), endPos: new THREE.Vector3(-71, 1.5, 0), whenAppear: 100 },
            { name: 'Donkey7', startPos: new THREE.Vector3(-55, 50, 140), endPos: new THREE.Vector3(-55, 1.5, 71), whenAppear: 110 },
            { name: 'Donkey8', startPos: new THREE.Vector3(-140, 50, -45), endPos: new THREE.Vector3(-71, 1.5, -45), whenAppear: 120 }
        ];

        
        this.playBombOnce = audioManager.createTrigger(sfx.dkIncoming, 10);
        this.playHeeHawOnce = audioManager.createTrigger(sfx.dkHeeHaw, 10);
        this.playKeanuHarpOnce = audioManager.createTrigger(sfx.keanuHarp, 10);

    }

    addDonkeys() {

        const donkey = emojiFactory.createDonkey();
        donkey.material.depthTest = false;

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(64, 64, 64, 0, Math.PI * 2);
        ctx.fillStyle = '#420404';
        ctx.fill();

        const circleTexture = new THREE.CanvasTexture(canvas);

        const circleMat = new THREE.SpriteMaterial({ map: circleTexture });
        circleMat.depthTest = false;

        for (const config of this.DonkeyArr) {

            const donkeyClone = donkey.clone();
            donkeyClone.name = config.name;
            donkeyClone.position.copy(config.startPos);

            donkeyClone.userData.startPos = config.startPos;
            donkeyClone.userData.endPos = config.endPos;
            donkeyClone.userData.progress = 0;
            donkeyClone.userData.whenAppear = config.whenAppear;
            donkeyClone.userData.hasAppeared = false;
            donkeyClone.userData.isFleeing = false;
            donkeyClone.userData.heehawed = false;

            const bgCircle = new THREE.Sprite(circleMat.clone());

            bgCircle.position.set(0, 0.1, -0.1);

            bgCircle.renderOrder = 0;
            donkeyClone.renderOrder = 1;

            donkeyClone.add(bgCircle);

            donkeyClone.userData.aabb = new THREE.Box3();
            donkeyClone.visible = false;

            this.scene.add(donkeyClone);
            this.donkeyMeshArr.push(donkeyClone);

        }
    }

    spawnKeanu(startPos, endPos) {

        const keanu = emojiFactory.createKeanu();
        keanu.material.depthTest = false
        keanu.name = 'KeanuDonkey';
        keanu.position.copy(startPos);
        keanu.userData.startPos = startPos;
        keanu.userData.endPos = endPos;
        keanu.userData.progress = 0;

        keanu.userData.hasAppeared = true;
        keanu.userData.isTargeted = false;

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(64, 64, 64, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.fill();

        const circleTexture = new THREE.CanvasTexture(canvas);
        const circleMat = new THREE.SpriteMaterial({ map: circleTexture });

        const bgCircle = new THREE.Sprite(circleMat);
        //  bgCircle.scale.set(1.5, 1.5, 1); 
        bgCircle.position.set(0, 0.05, -0.1);
        bgCircle.renderOrder = 0;
        keanu.renderOrder = 1;
        keanu.add(bgCircle);

        keanu.userData.aabb = new THREE.Box3();
        keanu.visible = true;

        this.scene.add(keanu);

        this.donkeyMeshArr.push(keanu);

        if (audioManager) {

            audioManager.playSfx(sfx.keanuHarp);

        }

        console.log("Keanu has entered the chat.");
    }

    update(elapsedTime, deltaTime, audioManager) {

        for (const donkey of this.donkeyMeshArr) {

            //Rainbow llama for Keanu
            if (donkey.name === 'KeanuDonkey') {

                donkey.material.color.setHSL((performance.now() % 2000) / 2000, 1, 0.5);

            }

            if (!donkey.userData.hasAppeared && elapsedTime >= donkey.userData.whenAppear) {

                donkey.userData.hasAppeared = true;
                donkey.visible = true;
                if (donkey.name !== 'KeanuDonkey' && donkey.userData.heehawed === false) { //Keanu no bomb sound

                    this.playBombOnce();

                }
            }

            if (donkey.userData.hasAppeared) {

                // Only lerp if not reached the destination (progress < 1)
                if (donkey.userData.progress < 1) {
                    donkey.userData.progress += deltaTime * 0.1;

                    // Clamp to 1 
                    if (donkey.userData.progress > 1) donkey.userData.progress = 1;

                    donkey.position.lerpVectors(
                        donkey.userData.startPos,
                        donkey.userData.endPos,
                        donkey.userData.progress
                    );
                }

                donkey.userData.aabb.setFromObject(donkey);
            }

            const hasReachedEnd = donkey.position.distanceTo(donkey.userData.endPos) < 0.1;

            if (hasReachedEnd) {

                if (donkey.userData.isFleeing) {

                    donkey.visible = false;

                }

                else if (donkey.userData.heehawed === false) {
                    
                    if (audioManager) {

                        if (donkey.name !== 'KeanuDonkey') {

                            donkey.userData.heehawed = true;
                            this.playHeeHawOnce();

                        } else {

                            this.playKeanuHarpOnce();

                        }
                    }
                }
            }
        }

    }

}

