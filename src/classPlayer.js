import * as THREE from "three";

import { stage, emojiFactory, audioManager } from './script.js';
import { sfx } from './audio.js';
import { createText } from "./_helpers.js";

export class Player {

    constructor(stage) {

        this.stage = stage;
        this.scene = stage.scene;

        this.playerGameStarted = false;
        this.gameModeDT = true; // Desktop mode

        this.dolly = new THREE.Group();

        this.angularSpeed = 1;

        //desktop movement
        this.keys = { w: false, a: false, s: false, d: false };
        this.speedFactor = 25;
        this.homePosition = new THREE.Vector3(0, 0, 65);
        this.homeRotation = new THREE.Quaternion()
        this.lerping = false;

        this.moveSpeedVR = 0.2;

        //vr movement vectors
        this._movementVector = new THREE.Vector3();
        this._wristPos = new THREE.Vector3();
        this._targetJointPos = new THREE.Vector3();
        this._cameraPos = new THREE.Vector3();

        //bvh
        this.colliderHeight = 1.8;
        this.colliderWidth = 0.8;
        this.colliderDepth = 0.8;

        this.playerCollider = new THREE.Box3();
        this.playerColliderMesh = new THREE.Mesh(

            new THREE.BoxGeometry(this.colliderWidth, this.colliderHeight, this.colliderDepth),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5 })

        );

        this.playerColliderMesh.visible = false;
        this.dolly.add(this.playerColliderMesh);

        // new vectors for collision detection
        this._colliderCenter = new THREE.Vector3();
        this._colliderSize = new THREE.Vector3(this.colliderWidth, this.colliderHeight, this.colliderDepth);

        this._penetrationVector = new THREE.Vector3();

        // For the math inside _getPenetrationVector
        this._boxCenter1 = new THREE.Vector3();
        this._boxCenter2 = new THREE.Vector3();
        this._boxSize1 = new THREE.Vector3();
        this._boxSize2 = new THREE.Vector3();

        //audio
        this.playWoofOnce = audioManager.createTrigger(sfx.dogWoof, 0.3);

        this.dog = null;

    }

    addDolly() {

        this.stage.camera.position.set(0, 0, 0);
        this.stage.camera.rotation.set(0, 0, 0);

        this.stage.scene.remove(stage.camera);
        this.dolly.add(stage.camera);
        this.dolly.position.copy(this.homePosition);
        this.dolly.rotation.set(0, 0, 0);
        this.dolly.name = 'Dolly';
        this.scene.add(this.dolly);

        emojiFactory.createDog();
        this.dog = this.scene.getObjectByName('dog');
        this.playWoofOnce();


    }

    attachHands(handInstance) {

        if (handInstance.hand1 && handInstance.hand2) {

            this.dolly.add(handInstance.hand1);
            this.dolly.add(handInstance.hand2);

        }

    }

    addEventListenersDT() {

        onkeydown = onkeyup = (e) => {

            const k = { KeyQ: 'q', KeyW: 'w', ArrowUp: 'w', KeyE: 'e', KeyA: 'a', ArrowLeft: 'a', KeyS: 's', ArrowDown: 's', KeyD: 'd', ArrowRight: 'd' }[e.code];
            if (k) {
                this.keys[k] = e.type[3] == 'd'; // 'keydown'[3] === 'd', 'keyup'[3] === 'u'
                e.preventDefault();
            }

        };

    }


    updateMovementDT(keys, environmentCollisionBVH, deltaTime) {

        const moveSpeed = this.speedFactor * deltaTime;
        const rotateSpeed = this.angularSpeed * deltaTime;

        // Rotation (Q: +1, E: -1)
        this.dolly.rotation.y += ((keys.q || 0) - (keys.e || 0)) * rotateSpeed;


        // Forward/Backward (W: +1, S: -1)
        const fwd = (keys.w || 0) - (keys.s || 0);
        if (fwd) this.dolly.translateZ(-fwd * moveSpeed);

        // Strafe Right/Left (D: +1, A: -1)
        const str = (keys.d || 0) - (keys.a || 0);
        if (str) this.dolly.translateX(str * moveSpeed);

        this._colliderCenter.set(
            this.dolly.position.x,
            this.dolly.position.y + (this.colliderHeight / 2),
            this.dolly.position.z
        );

        this.playerCollider.setFromCenterAndSize(this._colliderCenter, this._colliderSize);

        const potentialColliders = environmentCollisionBVH.query(this.playerCollider);

        for (const envCollider of potentialColliders) {

            if (this.playerCollider.intersectsBox(envCollider)) {

                this._getPenetrationVector(this.playerCollider, envCollider, this._penetrationVector);

                this.dolly.position.add(this._penetrationVector);

                this.playerCollider.translate(this._penetrationVector);

            }

        }

    }


    updateMovementHand(hand, environmentCollisionBVH, deltaTime) {

        if (!hand) return;

        if (hand.isCrossedArms(hand.leftHand, hand.rightHand)) {

            // 1. Grab the active WebXR session directly from Three.js
            const session = stage.renderer.xr.getSession();

            if (session) {
                // 2. Gracefully end it, and wait for the Promise to resolve
                session.end().then(() => {
                    window.location.reload();
                });
            } else {
                // Fallback for desktop mode
                window.location.reload();
            }

            return;

            // window.location.reload();
            // return;

        }

        const rotateSpeed = this.angularSpeed * deltaTime;

        const processHandMovement = (handInstance, handMat) => {

            if (!handInstance || !handMat) return;

            const wrist = handInstance.joints['wrist'];
            if (!wrist) return;

            wrist.getWorldPosition(this._wristPos);
            this.stage.camera.getWorldPosition(this._cameraPos);

            // If the wrist is more than 0.3 meters below the headset, the arm is resting.
            const restingThreshold = this._cameraPos.y - 0.3;

            if (this._wristPos.y < restingThreshold) {

                handMat.color.setHex(hand.handDefaultColor);
                return;

            }

            if (hand.isPointing(handInstance)) {

                handMat.color.setHex(hand.handPointColor);

                const indexTip = handInstance.joints['index-finger-tip'];
                if (indexTip) {

                    indexTip.getWorldPosition(this._targetJointPos);

                    this._movementVector.subVectors(this._targetJointPos, this._wristPos);
                    this._movementVector.y = 0; // Prevent flying
                    this._movementVector.normalize();

                    this.dolly.position.addScaledVector(this._movementVector, this.moveSpeedVR);

                }
            }

            else if (hand.isThumbsUp(handInstance)) {

                handMat.color.setHex(hand.handThumbsColor);

                const indexKnuckle = handInstance.joints['index-finger-phalanx-proximal'];
                if (indexKnuckle) {

                    indexKnuckle.getWorldPosition(this._targetJointPos);

                    this._movementVector.subVectors(this._targetJointPos, this._wristPos);
                    this._movementVector.y = 0;
                    this._movementVector.normalize();

                    //backwards
                    this.dolly.position.addScaledVector(this._movementVector, -this.moveSpeedVR);

                }
            }

            else if (hand.isPinching(handInstance)) {

                handMat.color.setHex(hand.handPinchColor);
                const dir = handInstance.handedness === 'left' ? -1 : 1;

                this.dolly.rotation.y -= rotateSpeed * dir * 0.6; // Rotate left

            }

            else {

                handMat.color.setHex(hand.handDefaultColor);

            }
        };


        processHandMovement(hand.leftHand, hand.leftMat);
        processHandMovement(hand.rightHand, hand.rightMat);

        this._colliderCenter.set(
            this.dolly.position.x,
            this.dolly.position.y + (this.colliderHeight / 2),
            this.dolly.position.z
        );

        this.playerCollider.setFromCenterAndSize(this._colliderCenter, this._colliderSize);

        const potentialColliders = environmentCollisionBVH.query(this.playerCollider);

        for (const envCollider of potentialColliders) {

            if (this.playerCollider.intersectsBox(envCollider)) {

                this._getPenetrationVector(this.playerCollider, envCollider, this._penetrationVector);
                this.dolly.position.add(this._penetrationVector);
                this.playerCollider.translate(this._penetrationVector);

            }

        }

    }

    helperPlaneVR() {

        const helperText = createText('👆 - move forward,left or right  👍 - move backwards 👌 - rotate world 🙅🏻‍♀️ - stop / exit');
        helperText.material.side = THREE.DoubleSide;
        helperText.scale.set(0.4, 0.4, 1);
        helperText.position.set(0, -0.5, -1);

        this.dolly.add(helperText);

               

    }

    _getPenetrationVector(box1, box2, target) {

        box1.getCenter(this._boxCenter1);
        box2.getCenter(this._boxCenter2);
        box1.getSize(this._boxSize1);
        box2.getSize(this._boxSize2);

        // Calculate overlaps using the cached vectors
        const overlapX = (this._boxSize1.x / 2 + this._boxSize2.x / 2) - Math.abs(this._boxCenter1.x - this._boxCenter2.x);
        const overlapY = (this._boxSize1.y / 2 + this._boxSize2.y / 2) - Math.abs(this._boxCenter1.y - this._boxCenter2.y);
        const overlapZ = (this._boxSize1.z / 2 + this._boxSize2.z / 2) - Math.abs(this._boxCenter1.z - this._boxCenter2.z);

        if (overlapX < 0 || overlapY < 0 || overlapZ < 0) {
            target.set(0, 0, 0); // No overlap
            return;
        }

        if (overlapX < overlapY && overlapX < overlapZ) {
            target.set(overlapX * Math.sign(this._boxCenter1.x - this._boxCenter2.x), 0, 0);
        } else if (overlapY < overlapX && overlapY < overlapZ) {
            target.set(0, overlapY * Math.sign(this._boxCenter1.y - this._boxCenter2.y), 0);
        } else {
            target.set(0, 0, overlapZ * Math.sign(this._boxCenter1.z - this._boxCenter2.z));
        }
    }

}

