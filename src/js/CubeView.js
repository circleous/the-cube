import * as THREE from 'three';

import { RoundedBoxGeometry } from './plugins/RoundedBoxGeometry.js';
import { RoundedPlaneGeometry } from './plugins/RoundedPlaneGeometry.js';
import { Easing, Tween } from './Tween.js';

// The three.js side of the puzzle: every mesh, the transform graph, and the turn
// animations. This is the only module that knows about `THREE`, meshes or tweens.
// It reads logical state from the `Cube` model and writes it back when a turn
// settles, so the model stays the single source of truth.

const QUARTER = Math.PI / 2;

const FACE_INDEX = { L: 0, R: 1, D: 2, U: 3, B: 4, F: 5 };

const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

function orientationToQuaternion(orientation) {
  const matrix = new THREE.Matrix4().set(
    orientation[0],
    orientation[1],
    orientation[2],
    0,
    orientation[3],
    orientation[4],
    orientation[5],
    0,
    orientation[6],
    orientation[7],
    orientation[8],
    0,
    0,
    0,
    0,
    1,
  );

  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

function quaternionToOrientation(quaternion) {
  const elements = new THREE.Matrix4().makeRotationFromQuaternion(quaternion).elements;

  return [
    elements[0],
    elements[4],
    elements[8],
    elements[1],
    elements[5],
    elements[9],
    elements[2],
    elements[6],
    elements[10],
  ].map((value) => (Math.round(value) === 0 ? 0 : Math.round(value)));
}

class CubeView {
  constructor(game, model) {
    this.game = game;
    this.model = model;

    this.geometry = {
      pieceCornerRadius: 0.12,
      edgeCornerRoundness: 0.15,
      edgeScale: 0.82,
      edgeDepth: 0.01,
    };

    this.flipConfig = 0;
    this.flipEasings = [Easing.Power.Out(3), Easing.Sine.Out(), Easing.Back.Out(1.5)];
    this.flipSpeeds = [125, 200, 300];

    this.holder = new THREE.Object3D();
    this.animator = new THREE.Object3D();
    this.object = new THREE.Object3D();
    this.group = new THREE.Object3D();

    this.holder.add(this.animator);
    this.animator.add(this.object);
    this.object.add(this.group);

    // Invisible box: the raycast proxy for face drags, and the accumulator for
    // whole-cube rotations (the original rotated this and copied it to `object`).
    this.bounds = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        depthWrite: false,
        transparent: true,
        opacity: 0,
        color: 0x0033ff,
      }),
    );

    this.game.world.scene.add(this.holder);
    this.game.world.scene.add(this.bounds);

    this.objects = new Map();
    this.pieces = [];
    this.stickers = [];
    this.cubes = [];

    this.flipAxis = new THREE.Vector3();
    this.sizeGenerated = 0;
  }

  // Rebuild the meshes from the model. Called on start and whenever the size changes.
  build() {
    this.pieces.forEach((piece) => this.object.remove(piece));

    this.objects.clear();
    this.pieces = [];
    this.stickers = [];
    this.cubes = [];

    const { size } = this.model;
    const scale = size === 2 ? 1.25 : size === 3 ? 1 : 3 / size;
    this.object.scale.set(scale, scale, scale);

    const boundsScale = size === 2 ? 0.825 : 1;
    this.bounds.scale.set(boundsScale, boundsScale, boundsScale);

    this.generateModel();

    this.holder.traverse((node) => {
      if (node.frustumCulled) node.frustumCulled = false;
    });

    this.updateColors(this.game.themes.getColors());
    this.sizeGenerated = size;
  }

  generateModel() {
    const pieceSize = 1 / 3;
    const mainMaterial = new THREE.MeshLambertMaterial();
    const pieceGeometry = new RoundedBoxGeometry(pieceSize, this.geometry.pieceCornerRadius, 3);
    const edgeGeometry = RoundedPlaneGeometry(
      pieceSize,
      this.geometry.edgeCornerRoundness,
      this.geometry.edgeDepth,
    );

    this.model.pieces.forEach((modelPiece) => {
      const piece = new THREE.Object3D();
      const pieceCube = new THREE.Mesh(pieceGeometry, mainMaterial.clone());

      piece.userData.name = modelPiece.name;
      piece.userData.cube = pieceCube;
      piece.add(pieceCube);

      modelPiece.stickers.forEach((sticker) => {
        const index = FACE_INDEX[sticker.name];
        const distance = pieceSize / 2;
        const edge = new THREE.Mesh(edgeGeometry, mainMaterial.clone());

        edge.position.set(
          distance * [-1, 1, 0, 0, 0, 0][index],
          distance * [0, 0, -1, 1, 0, 0][index],
          distance * [0, 0, 0, 0, -1, 1][index],
        );
        edge.rotation.set(
          (Math.PI / 2) * [0, 0, 1, -1, 0, 0][index],
          (Math.PI / 2) * [-1, 1, 0, 0, 2, 0][index],
          0,
        );
        edge.scale.set(this.geometry.edgeScale, this.geometry.edgeScale, this.geometry.edgeScale);
        edge.name = sticker.name;

        piece.add(edge);
        this.stickers.push(edge);
      });

      piece.position.set(...this.model.toWorld(modelPiece.cell));
      piece.quaternion.copy(orientationToQuaternion(modelPiece.orientation));

      this.pieces.push(piece);
      this.cubes.push(pieceCube);
      this.objects.set(modelPiece.name, piece);
      this.object.add(piece);
    });
  }

  syncPiece(name) {
    const piece = this.model.byName.get(name);
    const object = this.objects.get(name);

    if (!piece || !object) return;

    object.position.set(...this.model.toWorld(piece.cell));
    object.quaternion.copy(orientationToQuaternion(piece.orientation));
  }

  syncAll() {
    this.model.pieces.forEach((piece) => this.syncPiece(piece.name));
    this.syncOrientation();
  }

  // Render the whole-cube orientation stored on the model.
  syncOrientation() {
    this.object.quaternion.copy(orientationToQuaternion(this.model.orientation));
    this.bounds.quaternion.copy(this.object.quaternion);
  }

  // Read the settled whole-cube rotation back out of the scene graph.
  syncOrientationFromObject() {
    this.model.setOrientation(quaternionToOrientation(this.object.quaternion));
  }

  updateColors(colors) {
    this.pieces.forEach((piece) => piece.userData.cube.material.color.setHex(colors.P));
    this.stickers.forEach((edge) => edge.material.color.setHex(colors[edge.name]));
  }

  reset() {
    this.bounds.rotation.set(0, 0, 0);
    this.holder.rotation.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.animator.rotation.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
  }

  resize(force = false) {
    const size = this.game.preferences.ranges.size.value;

    if (size !== this.sizeGenerated || force) {
      this.model.setSize(size);
      this.build();

      this.game.saved = false;
      this.game.timer.reset();
      this.game.persistence.clearGame();
    }
  }

  // --- layer turns -----------------------------------------------------------

  beginLayer(axisVector, layer) {
    this.flipAxis.copy(axisVector);
    this.group.rotation.set(0, 0, 0);

    layer.forEach((name) => {
      const object = this.objects.get(name);
      if (object) this.group.add(object);
    });
  }

  rotateLayerBy(angle) {
    this.group.rotateOnAxis(this.flipAxis, angle);
  }

  // Animate one layer move to completion, then commit it to the model.
  turn(move, scramble, callback) {
    this.beginLayer(AXIS_VECTORS[move.axis], this.model.layer(move.axis, move.layer));
    this.settleLayer(move, move.turns * QUARTER, scramble, callback);
  }

  settleLayer(move, rotation, scramble, callback) {
    const config = scramble ? 0 : this.flipConfig;
    const bounce = config === 2 ? this.bounceCube() : () => {};

    this.rotationTween = new Tween({
      easing: this.flipEasings[config],
      duration: this.flipSpeeds[config],
      onUpdate: (tween) => {
        const deltaAngle = tween.delta * rotation;

        this.group.rotateOnAxis(this.flipAxis, deltaAngle);
        bounce(tween.value, deltaAngle, rotation);
      },
      onComplete: () => {
        this.commitLayer(move);
        if (callback) callback();
      },
    });
  }

  commitLayer(move) {
    const affected = this.model.apply(move);

    affected.forEach((name) => {
      const object = this.objects.get(name);

      this.group.remove(object);
      this.object.add(object);
      this.syncPiece(name);
    });

    this.group.rotation.set(0, 0, 0);
    this.syncOrientation();
  }

  bounceCube() {
    let fixDelta = true;

    return (progress, delta, rotation) => {
      if (progress >= 1) {
        if (fixDelta) {
          delta = (progress - 1) * rotation;
          fixDelta = false;
        }

        this.object.rotateOnAxis(this.flipAxis, delta);
      }
    };
  }

  // --- whole-cube rotations --------------------------------------------------

  beginCubeRotate(axisVector) {
    this.flipAxis.copy(axisVector);
  }

  rotateBoundsBy(angle) {
    this.bounds.rotateOnWorldAxis(this.flipAxis, angle);
    this.object.rotation.copy(this.bounds.rotation);
  }

  settleCube(rotation, callback) {
    const config = this.flipConfig;
    const easing = [Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2)][config];
    const duration = [100, 150, 350][config];

    this.rotationTween = new Tween({
      easing,
      duration,
      onUpdate: (tween) => {
        this.bounds.rotateOnWorldAxis(this.flipAxis, tween.delta * rotation);
        this.object.rotation.copy(this.bounds.rotation);
      },
      onComplete: () => {
        this.bounds.rotation.setFromVector3(
          this.snapRotation(new THREE.Vector3().setFromEuler(this.bounds.rotation)),
        );
        this.object.rotation.copy(this.bounds.rotation);
        this.syncOrientationFromObject();

        if (callback) callback();
      },
    });
  }

  roundAngle(angle) {
    const round = Math.PI / 2;

    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round;
  }

  snapRotation(vector) {
    return vector.set(
      this.roundAngle(vector.x),
      this.roundAngle(vector.y),
      this.roundAngle(vector.z),
    );
  }
}

export { CubeView, AXIS_VECTORS, QUARTER };
