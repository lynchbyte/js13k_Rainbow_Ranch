import * as THREE from "three"

import { gradientMateriail, rainbowMaterial, addCloud } from "./_helpers.js";

const world = {

  width: 300,
  height: 150,
  moveDown: -1.5,
  flatZone: 22, // distance from center where terrain is flat


};

export function addSkySphere(scene) {

  const geometry = new THREE.SphereGeometry(world.width / 2 + 20, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);

  const skyMat = gradientMateriail("peachpuff", "LightGoldenRodYellow");
  skyMat.side = THREE.BackSide

  const mesh = new THREE.Mesh(geometry, skyMat);

  mesh.position.set(0, world.moveDown, 0);

  mesh.name = "Sky";

  scene.add(mesh);

}

export function addRainbow(scene) {

  const geo = new THREE.RingGeometry(20, 50, 32, 6, 0, 3.14);
  const rainbowMat = rainbowMaterial();

  const mesh = new THREE.Mesh(geo, rainbowMat);

  mesh.position.set(0, 0, -world.width / 2 + 25);

  mesh.name = "Rainbow";

  scene.add(mesh);

}

export function addClouds(scene) {

  const cloudGroup = new THREE.Group();

  const cloudGeo = addCloud();
  cloudGeo.rotateY(Math.PI / 2);

  const cloudMatl = new THREE.MeshStandardMaterial({
    color: 'lavender',
    flatShading: true,
    transparent: true,
    opacity: 0.35,
    roughness: 0.5,
    metalness: 0.4
  });

  let mesh;

  for (let i = 0; i < 12; i++) {

    mesh = new THREE.Mesh(cloudGeo, cloudMatl);

    mesh.rotation.set(0, i * 0.5, 0);

    mesh.translateX(world.width / 3 + Math.random() * 5);
    mesh.translateY(Math.max(25, Math.random() * 100));
    mesh.scale.set(15, 15, Math.max(8, Math.random() * 15));

    cloudGroup.add(mesh);

  }

  cloudGroup.name = "Clouds Group"

  scene.add(cloudGroup);

}

export function addTerrain(scene) {
  const color1 = new THREE.Color(0x6D6794); // hill tops 
  const color2 = new THREE.Color(0x8ff5a5); // valleys/flat 


  const geometry = new THREE.PlaneGeometry(world.width, world.width, 15, 15);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position.array;
  const colors = new Float32Array(positions.length);

  const vertex = new THREE.Vector3();
  const vertexColor = new THREE.Color();

  const flatCenterPos = new THREE.Vector3();

  for (let i = 0; i < positions.length; i += 3) {

    vertex.fromArray(positions, i);

    vertex.x += Math.random() * 10 - 5;
    vertex.z += Math.random() * 10 - 5;

    const distance = (vertex.distanceTo(flatCenterPos) / 5) - world.flatZone;
    vertex.y = Math.random() * Math.max(0, distance * 3);
       
    vertex.toArray(positions, i);


    if (vertex.y > 1.5) {
      vertexColor.copy(color1);
    } else {
      vertexColor.copy(color2);
    }

    vertexColor.toArray(colors, i);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({

    vertexColors: true,
    flatShading: true 

  });

  const terrainMesh = new THREE.Mesh(geometry, material);

  terrainMesh.position.set(0, world.moveDown + 0.1, 0);

  terrainMesh.receiveShadow = true;

  terrainMesh.name = "Terrain";

  scene.add(terrainMesh);

}



export function addBarn(stage, position = new THREE.Vector3(0, world.moveDown + 5, -55)) {

  const colliders = [];
  const barnWall = 20;
  const barnGroup = new THREE.Group();

  const barnGeo = new THREE.BoxGeometry(barnWall, 10, barnWall);
  const barnMat = new THREE.MeshStandardMaterial({

    color: new THREE.Color(0xFF1493),
    roughness: 0.8,
    metalness: 0.2,
    flatShading: true,
    side: THREE.DoubleSide

  });

  const barnMesh = new THREE.Mesh(barnGeo, barnMat);

  const roofGeo = new THREE.ConeGeometry(barnWall * 0.85, 5, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 'DarkSlateGray' });
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = 7.5;
  roofMesh.rotateY(Math.PI / 4);

  const barnDoorGeo = new THREE.BoxGeometry(4, 6, 0.1);
  const barnDoorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x90646F) });
  const barnDoorMesh = new THREE.Mesh(barnDoorGeo, barnDoorMat);
  barnDoorMesh.position.set(0, -3, barnWall / 2 + 0.25);

  barnMesh.castShadow = true

  barnGroup.add(barnMesh, roofMesh, barnDoorMesh);

  barnGroup.position.copy(position);

  barnGroup.name = "Barn Group"
  stage.scene.add(barnGroup);

  barnGroup.updateMatrixWorld(true);

  barnDoorMesh.userData.aabb = new THREE.Box3().setFromObject(barnDoorMesh);

  const barnBox = new THREE.Box3().setFromObject(barnMesh);
  colliders.push(barnBox);

  return colliders;

}

export function addFence(stage) {

  const scene = stage.scene;

  const fenceHeight = 5; 

  const fenceLength = 140;

  const fenceThickness = 1 

  const fenceWire = 0.05

  //for visible fence wire
  const fence_Mat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const fence_Geometry = new THREE.BoxGeometry(fenceWire, fenceWire, fenceLength);

  for (let i = 0; i < 4; i++) {

    const fenceWireMesh = new THREE.Mesh(fence_Geometry, fence_Mat);

    fenceWireMesh.castShadow = true;
    //  fenceWireMesh.visible = false;

    const angle = (i * Math.PI) / 2;
    fenceWireMesh.rotation.y = angle;

    const offset = fenceLength / 2;
    const posX = Math.cos(angle) * offset;
    const posZ = -Math.sin(angle) * offset;

    const posY = -0.2;
    fenceWireMesh.position.set(posX, posY, posZ);

    const fenceWireMesh_Lower = fenceWireMesh.clone();
    fenceWireMesh_Lower.translateY(-0.6)

    fenceWireMesh.name = "Fence Wire 1"
    fenceWireMesh_Lower.name = "Fence Wire 2"

    scene.add(fenceWireMesh, fenceWireMesh_Lower);

  }

  //for visible fence posts
  const spacing = 3;  
  const half = fenceLength / 2;


  const postsPerSide = fenceLength / spacing;
  const totalPosts = postsPerSide * 4;
 
  const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8); // 1.5m tall post
  const fencePostMesh = new THREE.InstancedMesh(postGeo, fence_Mat, totalPosts);

  const dummy = new THREE.Object3D();
  let index = 0;

  function addPost(x, z) {
    // Assuming origin  (0,0,0) 
    dummy.position.set(x, world.moveDown / 2, z);
    dummy.updateMatrix();
    fencePostMesh.setMatrixAt(index++, dummy.matrix);
  }


  for (let x = -half; x < half; x += spacing) {
    addPost(x, -half);
  }
 
  for (let z = -half; z < half; z += spacing) {
    addPost(half, z);
  }

  for (let x = half; x > -half; x -= spacing) {
    addPost(x, half);
  }

  for (let z = half; z > -half; z -= spacing) {
    addPost(-half, z);
  }

  fencePostMesh.instanceMatrix.needsUpdate = true;
  fencePostMesh.castShadow = true;

  fencePostMesh.name = "Fence Posts"
  scene.add(fencePostMesh);


  //for colliders
  const colliders = [];

  const fenceBVH_Material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x000000), wireframe: true });

  const fenceBVH_Geometry = new THREE.BoxGeometry(fenceThickness, fenceHeight, fenceLength);

  for (let i = 0; i < 4; i++) {

    const fenceBVH_Mesh = new THREE.Mesh(fenceBVH_Geometry, fenceBVH_Material);

    fenceBVH_Mesh.visible = false;

    const angle = (i * Math.PI) / 2;
    fenceBVH_Mesh.rotation.y = angle;

    const offset = fenceLength / 2;
    const posX = Math.cos(angle) * offset;
    const posZ = -Math.sin(angle) * offset;

    const posY = fenceHeight / 2 + world.moveDown;
    fenceBVH_Mesh.position.set(posX, posY, posZ);
    fenceBVH_Mesh.name = 'Fence AABB Box'
    scene.add(fenceBVH_Mesh);

    const fenceBox = new THREE.Box3().setFromObject(fenceBVH_Mesh);

    colliders.push(fenceBox);

  }

  return colliders;

}


