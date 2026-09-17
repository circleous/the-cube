const SHIFT = 16;

const FACES = {
  82: 'R',
  76: 'L',
  85: 'U',
  68: 'D',
  70: 'F',
  66: 'B',
};

const ROTATIONS = {
  88: 'x',
  89: 'y',
  90: 'z',
};

class Keyboard {

  constructor( game ) {

    this.game = game;
    this.shift = false;

    this.keydown = this.keydown.bind( this );
    this.keyup = this.keyup.bind( this );

    window.addEventListener( 'keydown', this.keydown, false );
    window.addEventListener( 'keyup', this.keyup, false );

  }

  keydown( e ) {

    if ( e.keyCode === SHIFT ) this.shift = true;
    if ( e.repeat ) return;

    if ( FACES[ e.keyCode ] ) {

      const modifier = ( this.shift ) ? `'` : ``;
      const move = this.game.scrambler.convertMove( FACES[ e.keyCode ] + modifier );

      this.game.controls.keyboardMove( 'LAYER', this.toLocalMove( move ), () => {} );

    } else if ( ROTATIONS[ e.keyCode ] ) {

      const axis = ROTATIONS[ e.keyCode ];
      const angle = ( this.shift ? 1 : -1 ) * Math.PI / 2;

      this.game.controls.keyboardMove( 'CUBE', { axis, angle }, () => {} );

    }

  }

  toLocalMove( move ) {

    // Notation is read from the camera, so the move has to be rotated into
    // whichever way the cube currently faces before it reaches the controls.
    const orientation = this.game.cube.object.quaternion.clone().inverse();

    const worldAxis = new THREE.Vector3();
    worldAxis[ move.axis ] = 1;

    const localAxis = worldAxis.applyQuaternion( orientation ).round();
    const axis = this.game.controls.getMainAxis( localAxis );
    const sign = Math.sign( localAxis[ axis ] );

    const position = move.position.clone().applyQuaternion( orientation ).round();

    return { position, axis, angle: sign * move.angle };

  }

  keyup( e ) {

    if ( e.keyCode === SHIFT ) this.shift = false;

  }

}

export { Keyboard };
