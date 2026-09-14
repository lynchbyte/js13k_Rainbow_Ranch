// classHand.js (Updated)
import * as THREE from 'three';

export class Hand {

  constructor(stage) {

    this.stage = stage;
    this.scene = stage.scene;
    this.renderer = stage.renderer;

    this.cubeGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);

    this.handDefaultColor = 0xFFB6C1;
    this.handPinchColor = 0xFF9966;
    this.handPointColor = 0x9370DB;
    this.handThumbsColor = 0xff0000;

    this.handMat1 = new THREE.MeshStandardMaterial({ color: this.handDefaultColor, roughness: 0.7 });
    this.handMat2 = new THREE.MeshStandardMaterial({ color: this.handDefaultColor, roughness: 0.7 });


    this.vec1 = new THREE.Vector3();
    this.vec2 = new THREE.Vector3();
    this.vec3 = new THREE.Vector3();

    this.hand1 = this.buildHand(0);
    this.hand2 = this.buildHand(1);

    // this.scene.add(this.hand1);
    // this.scene.add(this.hand2);

  }

  buildHand(index) {

    const hand = this.renderer.xr.getHand(index);

    hand.addEventListener('connected', (event) => {

      if (!event.data.hand) return;

      const handedness = event.data.handedness;

      hand.handedness = handedness;

      console.log(`Hand ${index} connected:`, handedness, event.data);

      const handMat = handedness === 'left' ? this.handMat1 : this.handMat2;

      if (handedness === 'left') {

        this.leftHand = hand;
        this.leftMat = this.handMat1;


      } else if (handedness === 'right') {

        this.rightHand = hand;
        this.rightMat = this.handMat2;

      }

      for (const jointName in hand.joints) {

        const jointGroup = hand.joints[jointName];
        jointGroup.clear();

        const mesh = new THREE.Mesh(this.cubeGeo, handMat);

        if (jointName === 'wrist') mesh.scale.set(2, 2, 2);
        else if (jointName.includes('tip')) mesh.scale.set(0.7, 0.7, 0.7);

        jointGroup.add(mesh);

      }

    });

    return hand;

  }


  isPinching(hand) {

    const thumbTip = hand.joints['thumb-tip'];
    const indexTip = hand.joints['index-finger-tip'];

    if (!thumbTip || !indexTip) return false;

    thumbTip.getWorldPosition(this.vec1);
    indexTip.getWorldPosition(this.vec2);

    const distance = this.vec1.distanceTo(this.vec2);

    return distance < 0.02;

  }

  isPointing(hand) {

    const wrist = hand.joints['wrist'];
    const indexTip = hand.joints['index-finger-tip'];
    const middleTip = hand.joints['middle-finger-tip'];

    if (!wrist || !indexTip || !middleTip) return false;

    wrist.getWorldPosition(this.vec1);


    indexTip.getWorldPosition(this.vec2);
    const indexDist = this.vec1.distanceTo(this.vec2);

    middleTip.getWorldPosition(this.vec2);
    const middleDist = this.vec1.distanceTo(this.vec2);

    if (indexDist < 0.01) return false;

    if (indexDist <= (middleDist * 1.3)) return false;

    return true;

  }

  isThumbsUp(hand) {

    if (!hand || !hand.joints || hand.visible === false) {

      return false;

    }

    const wrist = hand.joints['wrist'];
    const thumbTip = hand.joints['thumb-tip'];
    const thumbBase = hand.joints['thumb-phalanx-proximal'];

    const indexTip = hand.joints['index-finger-tip'];
    const middleTip = hand.joints['middle-finger-tip'];
    const ringTip = hand.joints['ring-finger-tip'];
    const pinkyTip = hand.joints['pinky-finger-tip'];

    if (!wrist || !thumbTip || !indexTip) return false;

    const wristPos = new THREE.Vector3();
    const thumbTipPos = new THREE.Vector3();
    const thumbBasePos = new THREE.Vector3();

    const indexPos = new THREE.Vector3();
    const middlePos = new THREE.Vector3();
    const ringPos = new THREE.Vector3();
    const pinkyPos = new THREE.Vector3();

    wrist.getWorldPosition(wristPos);
    thumbTip.getWorldPosition(thumbTipPos);
    thumbBase.getWorldPosition(thumbBasePos);
    indexTip.getWorldPosition(indexPos);
    middleTip.getWorldPosition(middlePos);
    ringTip.getWorldPosition(ringPos);
    pinkyTip.getWorldPosition(pinkyPos);

    const fistThreshold = 0.085;
    const isFist =
      indexPos.distanceTo(wristPos) < fistThreshold &&
      middlePos.distanceTo(wristPos) < fistThreshold &&
      ringPos.distanceTo(wristPos) < fistThreshold &&
      pinkyPos.distanceTo(wristPos) < fistThreshold;

    const thumbExtendedThreshold = 0.09;
    const isThumbExtended = thumbTipPos.distanceTo(wristPos) > thumbExtendedThreshold;

    const isPointingUp = thumbTipPos.y > (thumbBasePos.y + 0.03);

    return isFist && isThumbExtended && isPointingUp;

  }

  isCrossedArms(leftHand, rightHand) {
   
    if (!leftHand || !rightHand) return false;
    if (leftHand.visible === false || rightHand.visible === false) return false;

    const leftWrist = leftHand.joints['wrist'];
    const rightWrist = rightHand.joints['wrist'];

    const leftMid = leftHand.joints['middle-finger-tip'];
    const rightMid = rightHand.joints['middle-finger-tip'];

    if (!leftWrist || !rightWrist || !leftMid || !rightMid) return false;

    leftWrist.getWorldPosition(this.vec1);
    rightWrist.getWorldPosition(this.vec2);
    const wristDist = this.vec1.distanceTo(this.vec2);

    // ghost collision check (the 0,0,0 snap bug)
    if (wristDist < 0.005) {
      return false;
    }

    leftMid.getWorldPosition(this.vec1);
    rightMid.getWorldPosition(this.vec2);
    const tipDist = this.vec1.distanceTo(this.vec2);

    if (wristDist < 0.15 && tipDist > 0.25) {

      return true;
      
    }

    return false;
  }

}