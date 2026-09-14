import * as THREE from 'three';
import { player, audioManager } from './script.js';
import { sfx } from './audio.js';
import { createText } from './_helpers.js';

export class Unicorn {

    constructor(stage) {

        this.stage = stage;
        this.scene = stage.scene;
        this.unicornMesh = null;
        this.unicornArr = [];

        this.playLoose = audioManager.createTrigger(sfx.losePowerDown, 10);
        this.playWin = audioManager.createTrigger(sfx.keanuWin, 3);

        this.donkeyWorldPos = new THREE.Vector3();

        this.partyPos = new THREE.Vector3(0, 1.5, 0);

    }

    createUnicornSpriteMaterial() {

        const unicorn = createText('🦄');
        const unicornMap = unicorn.material.map.clone();
        const spriteMat = new THREE.SpriteMaterial({

            map: unicornMap,
            color: 0xffffff,
            depthTest: false

        });
        return spriteMat;

    }

    createUnicorn(spriteMat) {

        this.unicornMesh = new THREE.Sprite(spriteMat);
        this.unicornMesh.scale.set(6, 6, 1);

        this.unicornMesh.name = 'unicorn';

        this.unicornMesh.position.set(
            (Math.random() - 0.5) * 120,
            Math.random() * 2,
            (Math.random() * 70 - 10)
        );

        this.unicornMesh.userData.homePos = this.unicornMesh.position.clone();

        this.unicornMesh.userData.startPos = this.unicornMesh.position.clone();
        this.unicornMesh.userData.progress = 0;
        this.unicornMesh.userData.currentTarget = null;

        // Unicorn wobble properties
        this.unicornMesh.userData.initialY = this.unicornMesh.position.y;
        this.unicornMesh.userData.phase = Math.random() * Math.PI * 2;
        this.unicornMesh.userData.speed = 8 + Math.random() * 4;

        this.unicornMesh.userData.aabb = new THREE.Box3();
        this.unicornMesh.userData.isDead = false;

        this.unicornArr.push(this.unicornMesh);
        this.scene.add(this.unicornMesh);

    }

    spawnParty(startPos) {

        const geo = new THREE.BufferGeometry();
        const count = 250;
        const positions = new Float32Array(count * 3);
        const vels = [];

        for (let i = 0; i < count * 3; i += 3) {

            positions[i] = startPos.x;
            positions[i + 1] = startPos.y;
            positions[i + 2] = startPos.z;

            // X, Y, Z velocities (with an upward bias on Y)
            vels.push(
                (Math.random() - 0.5) * 40,
                (Math.random() * 15) + 20,
                (Math.random() - 0.5) * 40
            );
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // cycle the color in the render loop
        const mat = new THREE.PointsMaterial({ size: 0.6, transparent: true });
        const points = new THREE.Points(geo, mat);

        points.userData = { vels: vels, age: 0 };

        this.scene.add(points);


        if (!this.partyEffects) this.partyEffects = [];
        this.partyEffects.push(points);

    }

    repeatParty(startPos, bursts = 5, delayMs = 300) {
        let count = 0;
        const timer = setInterval(() => {
            this.spawnParty(startPos);
            count++;
            if (count >= bursts) clearInterval(timer);
        }, delayMs);
    }



    update(elapsedTime, deltaTime, activeDonkeys) {

        for (let i = this.unicornArr.length - 1; i >= 0; i--) {
            const unicorn = this.unicornArr[i];

            // ==========================================
            // STATE 1 & 2: CAPTURED OR ESCAPED
            // ==========================================
            if (unicorn.userData.isCaptured) {

                // STATE 1 (Escaped): 
                if (!unicorn.userData.targetDonkey || !unicorn.userData.targetDonkey.visible) {
                    unicorn.visible = false;
                    this.unicornArr.splice(i, 1);
                    continue;
                }

                // STATE 2 (Captured): 
                unicorn.position.copy(unicorn.userData.targetDonkey.position);
                unicorn.position.set(unicorn.position.x + 4, unicorn.position.y + 4, unicorn.position.z); // Offset to sit on its back


                continue;
            }

            // ==========================================
            // STATE 3: HUNTING (Normal movement logic)
            // ==========================================
            const { phase, speed } = unicorn.userData;

            //EXCLUSIVE TARGETING
            if (!unicorn.userData.targetDonkey || !unicorn.userData.targetDonkey.visible) {
                unicorn.userData.targetDonkey = null;

                for (const donkey of activeDonkeys) {
                    if (donkey.userData.hasAppeared && donkey.visible && !donkey.userData.isTargeted && donkey.position.y < 1.6) {
                        donkey.userData.isTargeted = true;
                        unicorn.userData.targetDonkey = donkey;
                        break;
                    }
                }
            }

            //DROP FLEEING TARGETS
            if (unicorn.userData.targetDonkey && unicorn.userData.targetDonkey.userData.isFleeing) {
                unicorn.userData.targetDonkey = null;
            }

            //SET DESTINATION
            const dest = unicorn.userData.targetDonkey ? unicorn.userData.targetDonkey.position : unicorn.userData.homePos;

            //DETECT TARGET SWAP
            if (unicorn.userData.currentTarget !== unicorn.userData.targetDonkey) {

                unicorn.userData.currentTarget = unicorn.userData.targetDonkey;
                unicorn.userData.startPos.set(unicorn.position.x, unicorn.userData.initialY, unicorn.position.z);
                unicorn.userData.progress = 0;

            }

            //LERP MOVEMENT
            if (unicorn.userData.progress < 1) {

                unicorn.userData.progress += deltaTime * 0.1;
                if (unicorn.userData.progress > 1) unicorn.userData.progress = 1;

                unicorn.position.x = THREE.MathUtils.lerp(unicorn.userData.startPos.x, dest.x, unicorn.userData.progress);
                unicorn.position.z = THREE.MathUtils.lerp(unicorn.userData.startPos.z, dest.z, unicorn.userData.progress);
                unicorn.userData.initialY = THREE.MathUtils.lerp(unicorn.userData.startPos.y, dest.y, unicorn.userData.progress);

            }

            //APPLY WOBBLE
            unicorn.position.y = unicorn.userData.initialY + Math.sin(elapsedTime * speed + phase) * 0.1;

            //UPDATE AABB
            unicorn.userData.aabb.setFromObject(unicorn);

            // ==========================================
            // COLLISION CHECK
            // ==========================================
            if (unicorn.userData.targetDonkey
                && unicorn.userData.aabb.intersectsBox(unicorn.userData.targetDonkey.userData.aabb)) {

                console.log(`BAM! ${unicorn.userData.targetDonkey.name} caught ${unicorn.name}!`);

                unicorn.userData.isCaptured = true;

                if (unicorn.userData.targetDonkey.name !== 'KeanuDonkey') {

                    this.playLoose();
                    const hitDonkey = unicorn.userData.targetDonkey;

                    hitDonkey.children[0].material.color.setHex(0x000000);
                    hitDonkey.userData.isFleeing = true;

                    const originalSpawn = hitDonkey.userData.startPos.clone();

                    hitDonkey.userData.startPos.copy(hitDonkey.position);
                    hitDonkey.userData.endPos.copy(originalSpawn);
                    hitDonkey.userData.progress = 0;


                } else {

                    this.playWin();
                    this.repeatParty(this.partyPos, 5, 300);

                    setTimeout(() => {

                        const gameOverText = createText('✨✨ Game Over  ✨✨');
                        gameOverText.material.side = THREE.DoubleSide;
                        gameOverText.scale.set(0.6, 0.6, 1);
                        gameOverText.position.set(0, -0.25, -1);

                        player.dolly.add(gameOverText);

                    }, 3000);

                }
            }
        }
    }


}