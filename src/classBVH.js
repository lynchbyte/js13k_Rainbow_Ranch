import * as THREE from "three";

export class CollisionBVH {

    constructor(colliders) {

        if (!Array.isArray(colliders) || colliders.some(c => !(c instanceof THREE.Box3))) {

            this.colliders = [];
            this.nodes = [];
            return;

        }

        this.colliders = colliders;
        this.nodes = [];
        this.colliderIndices = Array.from({ length: colliders.length }, (_, i) => i);
        if (this.colliders.length > 0) {

            this.build(0, this.colliderIndices.length - 1, 0, this.colliderIndices);

        } else {

           this._showMessage("LeanCollisionBVH: No colliders to build BVH.", 3000);

        }

    }


    build(colliderStart, colliderEnd, depth, colliderIndices) {

        const nodeIndex = this.nodes.length;
        this.nodes.push({});

        const bounds = new THREE.Box3();
        const colliderCentroids = [];

        for (let i = colliderStart; i <= colliderEnd; i++) {
            const originalColliderIndex = colliderIndices[i];
            const colliderBox = this.colliders[originalColliderIndex];
            bounds.union(colliderBox);

            const centroid = new THREE.Vector3();
            colliderBox.getCenter(centroid);
            colliderCentroids.push({ centroid, originalIndex: originalColliderIndex, currentArrayIdx: i });
        }

        this.nodes[nodeIndex].min = bounds.min;
        this.nodes[nodeIndex].max = bounds.max;

        const numColliders = colliderEnd - colliderStart + 1;
      
        const MAX_COLLIDERS_PER_LEAF = 4;
        const MAX_DEPTH = 15; 

        if (numColliders <= MAX_COLLIDERS_PER_LEAF || depth >= MAX_DEPTH) {
    
            this.nodes[nodeIndex].isLeaf = true;
            this.nodes[nodeIndex].colliderStart = colliderStart;
            this.nodes[nodeIndex].colliderEnd = colliderEnd;
            this.nodes[nodeIndex].left = -1; 
            this.nodes[nodeIndex].right = -1;
            return nodeIndex;
        }

        const size = new THREE.Vector3().subVectors(bounds.max, bounds.min);
        let axis = 0; // 0 for X, 1 for Y, 2 for Z
        if (size.y > size.x) axis = 1;
        if (size.z > size.getComponent(axis)) axis = 2;


        colliderCentroids.sort((a, b) => a.centroid.getComponent(axis) - b.centroid.getComponent(axis));

        const reorderedColliderIndices = new Array(numColliders);

        for (let i = 0; i < numColliders; i++) {

            reorderedColliderIndices[i] = colliderCentroids[i].originalIndex;

        }

        for (let i = 0; i < numColliders; i++) {
            colliderIndices[colliderStart + i] = reorderedColliderIndices[i];
        }

        const mid = colliderStart + Math.floor(numColliders / 2) - 1;

        this.nodes[nodeIndex].isLeaf = false;
        this.nodes[nodeIndex].left = this.build(colliderStart, mid, depth + 1, colliderIndices);
        this.nodes[nodeIndex].right = this.build(mid + 1, colliderEnd, depth + 1, colliderIndices);

        return nodeIndex;
    }


    query(testBox) {

        const results = [];
        if (this.nodes.length === 0) return results;

        const stack = [0];

        while (stack.length > 0) {
            const nodeIdx = stack.pop();
            const node = this.nodes[nodeIdx];

            const nodeBox = new THREE.Box3(node.min, node.max);
            if (!testBox.intersectsBox(nodeBox)) {

                continue;

            }

            if (node.isLeaf) {

                for (let i = node.colliderStart; i <= node.colliderEnd; i++) {

                    const originalColliderIndex = this.colliderIndices[i];


                    results.push(this.colliders[originalColliderIndex]);

                }

            } else {

                stack.push(node.left);
                stack.push(node.right);
            }
        }

        return results;

    }

}
