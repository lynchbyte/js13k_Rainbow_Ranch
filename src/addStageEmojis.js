import * as THREE from 'three';
import { player } from './script.js';
import { createText } from './_helpers.js';

export class EmojiFactory {

    constructor(stage) {

        this.stage = stage;
        this.defaultParent = stage.scene;

    }

    _buildSprite(emojiChar, name, x, y, z, parent = this.defaultParent, sc, visible) {

        const textMesh = createText(emojiChar);
        const spriteMap = textMesh.material.map.clone();
        const spriteMat = new THREE.SpriteMaterial({

            map: spriteMap,
            transparent: true,
       
        });

        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(sc, sc, 1);
        sprite.name = name;
        sprite.position.set(x, y, z);

        parent.add(sprite);

        sprite.visible = visible;

        return sprite;
    }


    createDog() {
        return this._buildSprite('🐶', 'dog', 0.25, -0.125, -0.5, player.dolly, 0.125, true);
    }

    createDonkey(parent = this.defaultParent) {
        return this._buildSprite('🫏', 'donkey', 0, 0, 0, parent, 5, false);
    }

    createKeanu(parent = this.defaultParent) {
        return this._buildSprite('🦙', 'Keanu', 0, 0, 0, parent, 5, false);
    }

    createFlower(parent = this.defaultParent) {
        return this._buildSprite('🌷', 'flower', 0, -0.5, 0, parent, 2, false);
    }

    createFlower2(parent = this.defaultParent) {
        return this._buildSprite('🌻', 'flower2', 0.2, 0, 0.2, parent, 3, false);
    }


    /**
     * Scatters clones of a base sprite within a shape boundary, with an optional exclusion zone.
     * 
     * @param {THREE.Sprite} baseSprite - The original sprite to clone and hide.
     * @param {number} count - How many sprites to generate.
     * @param {Object} config - Configuration for the scattering boundary.
     * @param {THREE.Object3D} parent - The parent object to attach clones to.
     * @returns {THREE.Sprite[]} Array of the created scattered sprites.
     */
    scatterSprites(baseSprite, count, config = {}, parent = this.defaultParent) {

        // 1. Hide original sprite
        baseSprite.visible = false;

        // 2. Destructure config with defaults
        const {
            shape = 'rectangle', // 'rectangle' or 'circle'
            width = 10,          // total width for rectangle
            height = 10,         // total height for rectangle
            radius = 5,          // total radius for circle
            excludeWidth = 0,    // flatzone width (rectangle)
            excludeHeight = 0,   // flatzone height (rectangle)
            excludeRadius = 0,   // flatzone radius (circle)
            centerX = baseSprite.position.x,
            centerY = baseSprite.position.y,
            fixedZ = baseSprite.position.z,
            plane = 'xy'         // 'xy' for screen/billboard, 'xz' for ground
        } = config;

        const scatteredArray = [];

        for (let i = 0; i < count; i++) {
            const clone = baseSprite.clone();
            clone.visible = true; // Ensure clones are visible

            let offsetX = 0;
            let offset2ndAxis = 0; // Will be Y or Z depending on the chosen plane

            if (shape === 'circle') {
                // Uniformly distribute points in a circle (or ring if excludeRadius > 0)
                const minR2 = excludeRadius * excludeRadius;
                const maxR2 = radius * radius;
                const r = Math.sqrt(Math.random() * (maxR2 - minR2) + minR2);
                const angle = Math.random() * Math.PI * 2;

                offsetX = Math.cos(angle) * r;
                offset2ndAxis = Math.sin(angle) * r;

            } else {
                // Rectangle Logic (using rejection sampling to clear the flatzone)
                let validPoint = false;
                let attempts = 0;

                while (!validPoint && attempts < 100) {
                    offsetX = (Math.random() - 0.5) * width;
                    offset2ndAxis = (Math.random() - 0.5) * height;

                    if (excludeWidth === 0 && excludeHeight === 0) {
                        validPoint = true;
                    } else {
                        // Check if the point falls inside the forbidden flatzone
                        const inExclusionZone =
                            Math.abs(offsetX) < (excludeWidth / 2) &&
                            Math.abs(offset2ndAxis) < (excludeHeight / 2);

                        if (!inExclusionZone) validPoint = true;
                    }
                    attempts++;
                }
            }

            // 3. Apply coordinates based on the selected scatter plane
            if (plane === 'xy') {
                clone.position.set(centerX + offsetX, centerY + offset2ndAxis, fixedZ);
            } else if (plane === 'xz') {
                clone.position.set(centerX + offsetX, baseSprite.position.y, fixedZ + offset2ndAxis);
            }

            parent.add(clone);
            scatteredArray.push(clone);
        }

        return scatteredArray;
    }


}

//scatterSprites implementation

// Scenario 1: Scatter in a standard area (No Flatzone)
// const emojiFactory = new EmojiFactory(stage);
// const baseMushroom = emojiFactory.createMushroom();

// // Scatter 50 mushrooms in a circle radius of 8 around the original mushroom
// emojiFactory.scatterSprites(baseMushroom, 50, {
//     shape: 'circle',
//     radius: 8
// });

// Scenario 2: Scatter with a Flatzone (Exclusion Zone) in the middle
// const baseFlower = emojiFactory.createFlower();

// // Scatter 100 flowers in a 20x20 rectangle, but leave a 5x5 empty space in the middle
// emojiFactory.scatterSprites(baseFlower, 100, {
//     shape: 'rectangle',
//     width: 20,
//     height: 20,
//     excludeWidth: 5,
//     excludeHeight: 5
// });

// Scenario 3:Different Parent or Plane:
// If you want to scatter UFOs across the ground plane (X and Z coordinates) and attach them to a custom THREE.Group:
// const ufoGroup = new THREE.Group();
// stage.scene.add(ufoGroup);

// const baseUFO = emojiFactory.createUFO(ufoGroup);

// // Scatter in a ring on the X/Z ground plane
// emojiFactory.scatterSprites(baseUFO, 30, {
//     shape: 'circle',
//     radius: 15,
//     excludeRadius: 5,
//     plane: 'xz'
// }, ufoGroup); // Pass the custom parent here