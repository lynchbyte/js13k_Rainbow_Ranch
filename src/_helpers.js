import * as THREE from "three";
import { vertShader, fragShader } from "./script.js";

const extrudeSettings = {
    steps: 4,
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4
};


export function rainbowMaterial() {

    const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        vertexShader: vertShader,
        fragmentShader: fragShader
    });

    return material;
}


export function gradientMateriail(colbtm, coltop) {

    const material = new THREE.ShaderMaterial({

        uniforms: {
            color1: { value: new THREE.Color(colbtm) },
            color2: { value: new THREE.Color(coltop) }
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 color1; uniform vec3 color2; varying vec2 vUv; void main() { gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0); }`
    });

    return material;

}


export function addCloud() {

    const cloudShape = new THREE.Shape()

        .moveTo(0.88, -0.15)
        .lineTo(0.99, -0.07)
        .lineTo(1.01, 0.03)
        .lineTo(0.97, 0.14)
        .lineTo(0.86, 0.21)
        .lineTo(0.75, 0.19)
        .lineTo(0.68, 0.30)
        .lineTo(0.56, 0.37)
        .lineTo(0.35, 0.37)
        .lineTo(0.28, 0.29)
        .lineTo(0.23, 0.23)
        .lineTo(0.12, 0.27)
        .lineTo(0.03, 0.20)
        .lineTo(-0.05, 0.10)
        .lineTo(-0.05, -0.02)
        .lineTo(0.00, -0.09)
        .lineTo(0.12, -0.20)
        .lineTo(0.25, -0.17)
        .lineTo(0.28, -0.24)
        .lineTo(0.37, -0.28)
        .lineTo(0.44, -0.27)
        .lineTo(0.49, -0.24)
        .lineTo(0.58, -0.30)
        .lineTo(0.70, -0.28)
        .lineTo(0.81, -0.27)

    const cloudGeo = new THREE.ExtrudeGeometry(cloudShape, extrudeSettings);
    cloudGeo.center();

    return cloudGeo

}


export function createText(message, font = 'serif') {

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', {

        willReadFrequently: true

    });

    let metrics = null;
    const textHeight = 128;
    context.font = 'normal ' + textHeight + 'px ' + font;
    metrics = context.measureText(message);
    const textWidth = metrics.width;

    canvas.width = textWidth;
    canvas.height = textHeight;

    context.font = 'normal ' + textHeight * 0.75 + 'px ' + font//0.75 for emojis wierdness
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(message, textWidth / 2, textHeight / 2);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({

        map: texture,
        transparent: true

    });

    const geometry = new THREE.PlaneGeometry((0.125 * textWidth) / textHeight, 0.125);

    const plane = new THREE.Mesh(geometry, material);

    return plane

}

export function createExtrudedCanvasText(message, font = 'serif') {

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const textHeight = 128;
    
    context.font = 'bold ' + textHeight + 'px ' + font;
    const textWidth = context.measureText(message).width;
    canvas.width = textWidth;
    canvas.height = textHeight;
    
    context.font = 'bold ' + textHeight * 0.75 + 'px ' + font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    context.fillStyle = '#40a04e'; 
    context.fillText(message, textWidth / 2, textHeight / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    // alphaTest forces pixels to be solid or empty, fixing depth-sorting 
    // and allowing scene lights to cast accurate shadows.
    const material = new THREE.MeshStandardMaterial({

        map: texture,
        alphaTest: 0.5,
        roughness: 0.4,
        metalness: 0.2

    });

    const widthRatio = (0.125 * textWidth) / textHeight;
    const geometry = new THREE.PlaneGeometry(widthRatio, 0.125);

    const layers = 20;     
    const depth = 0.5;   
    
    const mesh = new THREE.InstancedMesh(geometry, material, layers);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "TitleText"

    const matrix = new THREE.Matrix4();

    for (let i = 0; i < layers; i++) {
        
        const zOffset = (i / layers) * -depth;
        matrix.setPosition(0, 0, zOffset);
        mesh.setMatrixAt(i, matrix);

    }

    return mesh;
}





