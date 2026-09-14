

import * as THREE from "three";

import { hand, unicorn, player, environmentCollisionBVH, emojiFactory, donkeyInst, audioManager } from "./script.js";
import { sfx } from "./audio.js";
import { addSkySphere, addRainbow, addTerrain, } from "./addStageComponents.js";
import { createExtrudedCanvasText } from "./_helpers.js";


export class Stage {

    constructor() {

        this.sizesWindowInner = {

            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)

        };

        //Audio
        this.listener = new THREE.AudioListener();
        this.listener.name = "Listener";
        this.listener.setMasterVolume(0.4);


        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFDAB9);//(0x7d77a1);

        this.camera = new THREE.PerspectiveCamera(
            50,
            this.sizesWindowInner.width / this.sizesWindowInner.height,
            0.1,
            1000
        );
        this.camera.near = 0.01;
        this.camera.position.set(-10, 52, 145);//0,52, 145
        this.camera.lookAt(0, 0, 0)

        // this.camera.position.set(0, 1.5, 0);
        //   this.camera.lookAt(0, 4, -70)

        this.camera.add(this.listener)
        this.scene.add(this.camera);

        this.timer = new THREE.Timer();

        const light = new THREE.HemisphereLight(0xfff0f0, 0x60606, 2);
        light.position.set(1, 1, 1);
        light.name = "Hemi Light"
        this.scene.add(light);

        const lightAmb = new THREE.AmbientLight(0x404040, 1);
        lightAmb.name = "Amb Light"
        this.scene.add(lightAmb);

        const dirLight = new THREE.DirectionalLight(0xfff0f0, 1.5);
        dirLight.position.set(120, 70, 50);
        dirLight.castShadow = true;
        dirLight.name = "Dir Light"
        this.scene.add(dirLight)

        dirLight.shadow.camera.top = 300;
        dirLight.shadow.camera.bottom = -300;
        dirLight.shadow.camera.left = -300;
        dirLight.shadow.camera.right = 300;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 300;

        // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
        // this.scene.add(dirLightHelper);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.sizesWindowInner.width, this.sizesWindowInner.height);
        this.renderer.setPixelRatio(this.sizesWindowInner.pixelRatio);
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.xr.enabled = true;

        document.body.appendChild(this.renderer.domElement);

        this.playWoofOnce = null; // Initialize the playWoofOnce variable

    }

    init() {

        const unicornSpriteMaterial = unicorn.createUnicornSpriteMaterial();
        ////

        //FOR GAME PIC
        // this.unicornMesh = new THREE.Sprite(unicornSpriteMaterial);
        // this.unicornMesh.scale.set(6, 6, 1);

        // this.unicornMesh.name = 'unicorn';

        // this.unicornMesh.position.set(0, 4, -60);
        // this.scene.add(this.unicornMesh);
        ////

        addSkySphere(this.scene);
        addRainbow(this.scene);
        addTerrain(this.scene);

        //addClouds(this.scene); //moved to dt/xr clicked
        //barn and fence added in script.js environment colliders

        for (let i = 0; i < 9; i++) {
            unicorn.createUnicorn(unicornSpriteMaterial);
        }

        // emojiFactory.createplayer.dog();  //in add dolly

        const baseFlower = emojiFactory.createFlower();
        const flowerGroup1 = new THREE.Group();

        emojiFactory.scatterSprites(baseFlower, 200, {
            shape: 'rectangle',
            width: 200,
            height: 200,
            excludeWidth: 140,
            excludeHeight: 140,
            plane: 'xz',

        },
            flowerGroup1);

        flowerGroup1.name = "Flower Group 1"
        this.scene.add(flowerGroup1)

        const baseFlower2 = emojiFactory.createFlower2();
        const flowerGroup2 = new THREE.Group();

        emojiFactory.scatterSprites(baseFlower2, 200, {
            shape: 'rectangle',
            width: 200,
            height: 200,
            excludeWidth: 140,
            excludeHeight: 140,
            plane: 'xz',

        },
            flowerGroup2);

        flowerGroup2.name = "Flower Group 2"
        this.scene.add(flowerGroup2)

        donkeyInst.addDonkeys();

        //add field title
        const titleText = createExtrudedCanvasText('Rainbow Ranch');
        titleText.material.side = THREE.DoubleSide;
        titleText.rotation.set(-Math.PI / 2, 0, 0)
        titleText.scale.set(75, 75, 1)
        titleText.position.set(0, 0, 40)

        this.scene.add(titleText)

        this.addResizeListener();

        this.playWoofOnce = audioManager.createTrigger(sfx.dogWoof, 0.3);

        console.log('scene init finished; ', this.scene)

        this.animate();

    }


    addResizeListener() {

        window.addEventListener('resize', () => {

            this.sizesWindowInner.width = window.innerWidth
            this.sizesWindowInner.height = window.innerHeight
            this.sizesWindowInner.pixelRatio = Math.min(window.devicePixelRatio, 2)

            this.camera.aspect = this.sizesWindowInner.width / this.sizesWindowInner.height
            this.camera.updateProjectionMatrix()

            this.renderer.setSize(this.sizesWindowInner.width, this.sizesWindowInner.height)
            this.renderer.setPixelRatio(this.sizesWindowInner.pixelRatio)

        })

    }


    animate() {

        this.renderer.setAnimationLoop(() => {

            this.timer.update();
            const deltaTime = this.timer.getDelta();
            const elapsedTime = this.timer.getElapsed();

            //donkey update movement
            if (player.playerGameStarted) {

                //dog woof
                if (player.dog && player.dog.userData.barkTimer > 0) {

                    // Decrement timer
                    player.dog.userData.barkTimer -= deltaTime;

                    // Normalize progress from 0 to 1 (prevents negative values at the end)
                    const progress = Math.max(0, player.dog.userData.barkTimer / 0.1);

                    // Math.sin(progress * Math.PI) creates a perfect arc from 0 -> 1 -> 0.
                    // Multiply by 0.05 to determine how big the scale "pop" gets.
                    const pop = Math.sin(progress * Math.PI) * 0.05;

                    // Base scale is 0.125 (from your JSON matrix)
                    const currentScale = 0.125 + pop;

                    player.dog.scale.set(currentScale, currentScale, 1);
                }

                // 1. Update Donkeys first so their AABBs are accurate
                if (donkeyInst && donkeyInst.donkeyMeshArr.length > 0) {
                    donkeyInst.update(elapsedTime, deltaTime, audioManager);
                }

                // 2. Update Unicorns and pass the donkey array for targeting/collisions
                if (unicorn && unicorn.unicornArr.length > 0) {
                    // Ensure we pass the donkey meshes, not the config array
                    unicorn.update(elapsedTime, deltaTime, donkeyInst.donkeyMeshArr);
                }

                if (elapsedTime >= 140 && !this.keanuSpawned) {
                    this.keanuSpawned = true;

                    const startPos = new THREE.Vector3(0, 50, -100);
                    const endPos = new THREE.Vector3(0, 1.5, 0);

                    donkeyInst.spawnKeanu(startPos, endPos);
                }

                for (const d of donkeyInst.donkeyMeshArr) {

                    if (d.name === 'KeanuDonkey' || !d.userData.hasAppeared || d.userData.isFleeing) continue;

                    //player.dog barking
                    if (player.dolly.position.distanceTo(d.position) < 5) {

                        this.playWoofOnce();

                        if (!player.dog.userData.barkTimer || player.dog.userData.barkTimer <= 0) {
                            player.dog.userData.barkTimer = 0.1;
                        }


                    }

                    //fleeing donkey
                    if (player.dolly.position.distanceTo(d.position) < 5) {

                        d.userData.isFleeing = true;
                        d.userData.isTargeted = false;

                        // Swap start and end destinations completely
                        const temp = d.userData.startPos;
                        d.userData.startPos = d.userData.endPos;
                        d.userData.endPos = temp;

                        //Reset progress to 0 to unlock the lerp
                        d.userData.progress = 0;
                    }
                }
            }

            //panoramic into
            if (player.lerping) {

                this.camera.position.lerp(player.homePosition, elapsedTime * 0.005);
                this.camera.quaternion.slerp(player.homeRotation, elapsedTime * 0.005);

            }

            //user input
            if (player.playerGameStarted && player.gameModeDT === false) {

                player.updateMovementHand(hand, environmentCollisionBVH, deltaTime);

            }

            else if (player.playerGameStarted && player.gameModeDT) {

                player.updateMovementDT(player.keys, environmentCollisionBVH, deltaTime);

            }

            //particle party
            if (unicorn.partyEffects && unicorn.partyEffects.length > 0) {


                for (let i = unicorn.partyEffects.length - 1; i >= 0; i--) {

                    const p = unicorn.partyEffects[i];
                    p.userData.age += deltaTime;

                    // Destroy after 2 seconds to free memory
                    if (p.userData.age > 2) {
                        this.scene.remove(p);
                        p.geometry.dispose();
                        p.material.dispose();
                        unicorn.partyEffects.splice(i, 1);
                        continue;
                    }

                    const positions = p.geometry.attributes.position.array;
                    const vels = p.userData.vels;

                    for (let j = 0; j < positions.length; j += 3) {
                        positions[j] += vels[j] * deltaTime;
                        positions[j + 1] += vels[j + 1] * deltaTime;
                        positions[j + 2] += vels[j + 2] * deltaTime;

                        // Apply gravity to the Y velocity
                        vels[j + 1] -= 25 * deltaTime;
                    }

                    p.geometry.attributes.position.needsUpdate = true;

                    // Rapid rainbow cycle + fade out
                    p.material.color.setHSL((performance.now() % 500) / 500, 1, 0.5);
                    p.material.opacity = 1 - (p.userData.age / 2);
                }
            }

            this.render();

        });
    }

    render() {

        this.renderer.render(this.scene, this.camera);

    }

}









