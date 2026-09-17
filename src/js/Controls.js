import * as THREE from 'three';

import { AXIS_INDEX } from './Moves.js';
import { AXIS_VECTORS, QUARTER } from './CubeView.js';
import { Draggable } from './Draggable.js';
import { History } from './History.js';

// Turns pointer and keyboard input into moves for the model, and asks the view to
// animate them. All the transform bookkeeping that used to live here now sits behind
// `CubeView`; all the layer and solved logic now sits on the `Cube` model.

const STILL = 0;
const PREPARING = 1;
const ROTATING = 2;
const ANIMATING = 3;

class Controls {
  constructor(game) {
    this.game = game;
    this.model = game.cube;
    this.view = game.cubeView;

    this.raycaster = new THREE.Raycaster();

    this.helper = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        depthWrite: false,
        transparent: true,
        opacity: 0,
        color: 0x0033ff,
      }),
    );
    this.helper.rotation.set(0, Math.PI / 4, 0);
    this.game.world.scene.add(this.helper);

    this.flipAxis = new THREE.Vector3();

    this.onSolved = () => {};
    this.onMove = () => {};

    this.momentum = [];
    this.history = new History();

    this.scramble = null;
    this.state = STILL;
    this.enabled = false;

    this.initDraggable();
  }

  enable() {
    this.draggable.enable();
    this.enabled = true;
  }

  disable() {
    this.draggable.disable();
    this.enabled = false;
  }

  initDraggable() {
    this.draggable = new Draggable(this.game.dom.game);

    this.draggable.onDragStart = (position) => {
      if (this.scramble !== null) return;
      if (this.state === PREPARING || this.state === ROTATING) return;

      this.gettingDrag = this.state === ANIMATING;

      const edgeIntersect = this.getIntersect(position.current, this.view.bounds, false);

      if (edgeIntersect !== false) {
        this.dragIntersect = this.getIntersect(position.current, this.view.cubes, true);
      }

      if (edgeIntersect !== false && this.dragIntersect !== false) {
        this.dragNormal = edgeIntersect.face.normal.round();
        this.flipType = 'layer';

        this.attach(this.helper, this.view.bounds);

        this.helper.rotation.set(0, 0, 0);
        this.helper.position.set(0, 0, 0);
        this.helper.lookAt(this.dragNormal);
        this.helper.translateZ(0.5);
        this.helper.updateMatrixWorld();

        this.detach(this.helper, this.view.bounds);
      } else {
        this.dragNormal = new THREE.Vector3(0, 0, 1);
        this.flipType = 'cube';

        this.helper.position.set(0, 0, 0);
        this.helper.rotation.set(0, Math.PI / 4, 0);
        this.helper.updateMatrixWorld();
      }

      const planeIntersect = this.getIntersect(position.current, this.helper, false);
      if (planeIntersect === false) return;

      this.dragCurrent = this.helper.worldToLocal(planeIntersect.point);
      this.dragTotal = new THREE.Vector3();
      this.state = this.state === STILL ? PREPARING : this.state;
    };

    this.draggable.onDragMove = (position) => {
      if (this.scramble !== null) return;
      if (this.state === STILL || (this.state === ANIMATING && this.gettingDrag === false)) return;

      const planeIntersect = this.getIntersect(position.current, this.helper, false);
      if (planeIntersect === false) return;

      const point = this.helper.worldToLocal(planeIntersect.point.clone());

      this.dragDelta = point.clone().sub(this.dragCurrent).setZ(0);
      this.dragTotal.add(this.dragDelta);
      this.dragCurrent = point;
      this.addMomentumPoint(this.dragDelta);

      if (this.state === PREPARING && this.dragTotal.length() > 0.05) {
        this.dragDirection = this.getMainAxis(this.dragTotal);

        if (this.flipType === 'layer') {
          const direction = new THREE.Vector3();
          direction[this.dragDirection] = 1;

          const worldDirection = this.helper.localToWorld(direction).sub(this.helper.position);
          const objectDirection = this.view.bounds.worldToLocal(worldDirection).round();

          this.flipAxis = objectDirection.cross(this.dragNormal).negate();

          const selection = this.layerFromIntersect();
          this.dragAxis = selection.axis;
          this.dragLayer = selection.coordinate;

          this.view.beginLayer(this.flipAxis, selection.layer);
        } else {
          const axis =
            this.dragDirection !== 'x'
              ? this.dragDirection === 'y' && position.current.x > this.game.world.width / 2
                ? 'z'
                : 'x'
              : 'y';

          this.flipAxis = new THREE.Vector3();
          this.flipAxis[axis] = 1 * (axis === 'x' ? -1 : 1);
        }

        this.flipAngle = 0;
        this.state = ROTATING;
      } else if (this.state === ROTATING) {
        const rotation = this.dragDelta[this.dragDirection];

        if (this.flipType === 'layer') {
          this.view.rotateLayerBy(rotation);
          this.flipAngle += rotation;
        } else {
          this.view.rotateBoundsBy(rotation);
          this.flipAngle += rotation;
        }
      }
    };

    this.draggable.onDragEnd = () => {
      if (this.scramble !== null) return;

      if (this.state !== ROTATING) {
        this.gettingDrag = false;
        this.state = STILL;
        return;
      }

      this.state = ANIMATING;

      const momentum = this.getMomentum()[this.dragDirection];
      const flip = Math.abs(momentum) > 0.05 && Math.abs(this.flipAngle) < Math.PI / 2;

      const angle = flip
        ? this.roundAngle(this.flipAngle + Math.sign(this.flipAngle) * (Math.PI / 4))
        : this.roundAngle(this.flipAngle);

      const delta = angle - this.flipAngle;

      if (this.flipType === 'layer') {
        const axis = this.dragAxis;
        const sign = Math.sign(this.flipAxis[axis]);
        const turns = Math.round((sign * angle) / QUARTER);
        const move = { axis, layer: this.dragLayer, turns };

        this.view.settleLayer(move, delta, false, () => {
          this.history.record(move);
          this.onMove();
          this.game.persistence.saveGame();

          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;

          this.checkIsSolved();
        });
      } else {
        this.view.settleCube(delta, () => {
          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;
        });
      }
    };
  }

  // The layer the current drag grabbed, in model terms.
  layerFromIntersect() {
    const piece = this.dragIntersect.object.parent;
    const name = piece.userData.name;
    const cell = this.model.byName.get(name).cell;
    const axis = this.getMainAxis(this.flipAxis);
    const coordinate = cell[AXIS_INDEX[axis]];

    return { axis, coordinate, layer: this.model.layer(axis, coordinate) };
  }

  // Animate a queue of moves, committing each to the model as it settles. Player
  // turns are recorded so they can be undone; scrambles and undos are not.
  animateMoves(moves, scramble, done, record = !scramble) {
    if (moves.length === 0) {
      done();
      return;
    }

    const move = moves.shift();

    this.state = ROTATING;

    this.view.turn(move, scramble, () => {
      if (record) this.history.record(move);

      this.animateMoves(moves, scramble, done, record);
    });
  }

  // Keyboard / programmatic layer turn from notation.
  notate(name) {
    if (this.state !== STILL) return;
    if (this.enabled !== true) return;

    this.animateMoves(this.model.localMoves(name), false, () => {
      this.state = STILL;
      this.onMove();
      this.game.persistence.saveGame();
      this.checkIsSolved();
    });
  }

  // Replay the inverse of the most recent turn, animated like any other move.
  undo() {
    if (this.state !== STILL) return;
    if (this.enabled !== true) return;

    const move = this.history.popInverse();

    if (!move) return;

    this.animateMoves(
      [move],
      false,
      () => {
        this.state = STILL;
        this.game.persistence.saveGame();
      },
      false,
    );
  }

  // Rotate the whole cube (view orientation only, no piece changes).
  rotate(axis, turns) {
    if (this.state !== STILL) return;
    if (this.enabled !== true) return;

    this.state = ROTATING;
    this.view.beginCubeRotate(AXIS_VECTORS[axis]);
    this.view.settleCube(turns * QUARTER, () => {
      this.state = STILL;
    });
  }

  scrambleCube() {
    if (this.scramble === null) this.scramble = this.game.scrambler.sequence.slice();

    if (this.scramble.length === 0) {
      this.scramble = null;
      this.game.persistence.saveGame();
      return;
    }

    this.animateMoves(this.scramble, true, () => {
      this.state = STILL;
      this.scramble = null;
      this.game.persistence.saveGame();
    });
  }

  checkIsSolved() {
    if (this.model.isSolved()) this.onSolved();
  }

  getIntersect(position, object, multiple) {
    this.raycaster.setFromCamera(
      this.draggable.convertPosition(position.clone()),
      this.game.world.camera,
    );

    const intersect = multiple
      ? this.raycaster.intersectObjects(object)
      : this.raycaster.intersectObject(object);

    return intersect.length > 0 ? intersect[0] : false;
  }

  getMainAxis(vector) {
    return Object.keys(vector).reduce((a, b) =>
      Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b,
    );
  }

  detach(child, parent) {
    child.applyMatrix4(parent.matrixWorld);
    parent.remove(child);
    this.game.world.scene.add(child);
  }

  attach(child, parent) {
    child.applyMatrix4(new THREE.Matrix4().copy(parent.matrixWorld).invert());
    this.game.world.scene.remove(child);
    parent.add(child);
  }

  addMomentumPoint(delta) {
    const time = Date.now();

    this.momentum = this.momentum.filter((moment) => time - moment.time < 500);

    if (delta !== false) this.momentum.push({ delta, time });
  }

  getMomentum() {
    const points = this.momentum.length;
    const momentum = new THREE.Vector2();

    this.addMomentumPoint(false);

    this.momentum.forEach((point, index) => {
      momentum.add(point.delta.multiplyScalar(index / points));
    });

    return momentum;
  }

  roundAngle(angle) {
    const round = Math.PI / 2;

    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round;
  }
}

export { Controls };
