// Space Ship Sprites Homework
//
// A simple version of an inertial, thrusty,
// rotateable space ship a la "Asteroids"
/*

==================================
Part 1: Implement a "Sprite" type.
==================================

OVERVIEW:

Provide a constructor that takes an Image object defining the sprite,
and add a drawCentredAt(ctx, cx, cy, rotation) member function which
renders the sprite via the specified context, at the given centre-coords,
and at the desired angle of rotation (in radians).

The framework will call the constructor for you, as part of the supplied 
preload routine...

`g_shipSprite` is the global variable containing the resulting sprite.


Use this sprite to render a simple "spaceship" object, and implement a
mouse-handler which sets its position to that of the most recent mouse-click.

`g_ship` is the global variable containing the primary ship object.


Implement a drawWrappedCentredAt method which handles wrap-around
rendering of the sprite at the edges of the playfield, and modify
the Ship renderer to use that method.


==================================================
Part 2: Implement a thrust-driven Space-ship type.
==================================================

OVERVIEW:

The ship is controlled by forward and retro thrusters.
The ship can rotate freely in space (by, erm, "magic").

You can halt the ship at any time by pressing a "H".
You can also reset the ship to its original coords (and halt it) with "R".

Provide a toggle for gravity, and implement bouncing collision with the 
top and bottom of the playfield when gravity is active, otherwise implement 
standard wrap-around positional behaviour.

The framework also provides two "extra" ships, which imitate the primary one, 
but use update-deltas of half and quarter the size. This illustrates the
(subtle, but sometimes significant) effects of time-step size on behaviour.

The "extra" ships should be on by default, but can be toggled off/on with "E".

NB: More details, including the exact key-mappings to use, are included in
this Framework code. Read it carefully. Stick to the names you have been
given. They have been chosen for a reason. Marking will be strict on this.

Look for the "// YOUR STUFF HERE" markers and add your code in those places.

Create additional helper-functions as and when you need them.
*/

'use strict';

/* jshint browser: true, devel: true, globalstrict: true */

const g_canvas = document.getElementById('myCanvas');
const g_ctx = g_canvas.getContext('2d');

/*
0        1         2         3         4         5         6         7         8         9
123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
*/

// =================
// KEYBOARD HANDLING
// =================

const g_keys = [];

function handleKeydown(evt) {
  g_keys[evt.keyCode] = true;
}

function handleKeyup(evt) {
  g_keys[evt.keyCode] = false;
}

// Inspects, and then clears, a key's state
//
// This allows a keypress to be "one-shot" e.g. for toggles
// ..until the auto-repeat kicks in, that is.
//
function eatKey(keyCode) {
  const isDown = g_keys[keyCode];
  g_keys[keyCode] = false;
  return isDown;
}

window.addEventListener('keydown', handleKeydown);
window.addEventListener('keyup', handleKeyup);

// ==============
// MOUSE HANDLING
// ==============

function handleMouse(evt) {
  // If no button is being pressed, then ignore
  if (!evt.which) return;

  const x = evt.clientX - g_canvas.offsetLeft;
  const y = evt.clientY - g_canvas.offsetTop;

  g_ship.cx = x;
  g_ship.cy = y;
}

// Handle "down" and "move" events the same way.
window.addEventListener('mousedown', handleMouse);
window.addEventListener('mousemove', handleMouse);

// ============
// SPRITE STUFF
// ============

// Construct a "sprite" from the given `image`
//
function Sprite(image) {
  this.image = image;
  this.height = image.height;
  this.width = image.width;
}

Sprite.prototype.drawCentredAt = function (ctx, cx, cy, rotation = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-this.width / 2, -this.height / 2);
  ctx.drawImage(this.image, 0, 0);
  ctx.restore();
};

Sprite.prototype.collidesLeft = function (cx) {
  return cx - this.width / 2 < 0;
};

Sprite.prototype.collidesRight = function (cx) {
  const ctxWidth = g_ctx.canvas.clientWidth;
  return cx + this.width / 2 > ctxWidth;
};

Sprite.prototype.collidesUp = function (cy) {
  return cy - this.height / 2 < 0;
};

Sprite.prototype.collidesDown = function (cy) {
  const ctxHeight = g_ctx.canvas.clientHeight;
  return cy + this.height / 2 > ctxHeight;
};

Sprite.prototype.drawWrappedCentredAt = function (ctx, cx, cy, rotation) {
  const ctxWidth = ctx.canvas.clientWidth;
  const ctxHeight = ctx.canvas.clientHeight;
  let newX = false;

  this.drawCentredAt(ctx, cx, cy, rotation);

  if (this.collidesLeft) {
    newX = true;
    this.drawCentredAt(ctx, cx + ctxWidth, cy, rotation);
  }

  if (this.collidesRight) {
    newX = true;
    this.drawCentredAt(ctx, cx - ctxWidth, cy, rotation);
  }

  if (this.collidesUp) {
    this.drawCentredAt(ctx, cx, cy + ctxHeight, rotation);

    if (newX) {
      const offsetX = cx > ctxWidth / 2 ? cx - ctxWidth : cx + ctxWidth;
      this.drawCentredAt(ctx, offsetX, cy - ctxHeight, rotation);
    }
  }

  if (this.collidesDown) {
    this.drawCentredAt(ctx, cx, cy - ctxHeight, rotation);

    if (newX) {
      const offsetX = cx > ctxWidth / 2 ? cx - ctxWidth : cx + ctxWidth;
      this.drawCentredAt(ctx, offsetX, cy + ctxHeight, rotation);
    }
  }
};

// ==========
// SHIP STUFF
// ==========

// A generic contructor which accepts an arbitrary descriptor object
function Ship(descr) {
  for (const property in descr) {
    this[property] = descr[property];
  }

  // Remember my reset positions
  this.reset_cx = this.cx;
  this.reset_cy = this.cy;
  this.reset_rotation = this.rotation;
}

Ship.prototype.KEY_THRUST = keyCode('W');
Ship.prototype.KEY_RETRO = keyCode('S');
Ship.prototype.KEY_LEFT = keyCode('A');
Ship.prototype.KEY_RIGHT = keyCode('D');

// Initial, inheritable, default values
Ship.prototype.rotation = 0;
Ship.prototype.velX = 0;
Ship.prototype.velY = 0;

Ship.prototype.willCollideLeft = function () {
  return this.cx + this.velX < 0;
};

Ship.prototype.willCollideRight = function () {
  const ctxWidth = g_ctx.canvas.clientWidth;
  return this.cx + this.velX > ctxWidth;
};

Ship.prototype.willCollideUp = function () {
  return this.cy + this.velY < 0;
};

Ship.prototype.willCollideDown = function () {
  const ctxHeight = g_ctx.canvas.clientHeight;
  return this.cy + this.velY > ctxHeight;
};

Ship.prototype.update = function (du) {
  const thrust = this.computeThrustMag();

  // Apply thrust directionally, based on our rotation
  const accelX = +Math.sin(this.rotation) * thrust;
  let accelY = -Math.cos(this.rotation) * thrust;

  accelY += this.computeGravity();

  this.applyAccel(accelX, accelY, du);

  this.wrapPosition();

  if (thrust === 0 || g_allowMixedActions) {
    this.updateRotation(du);
  }
};

const NOMINAL_GRAVITY = 0.12;

Ship.prototype.computeGravity = function () {
  // If gravity is enabled, return the NOMINAL_GRAVITY value
  // See the "GAME-SPECIFIC DIAGNOSTICS" section for details.
  if (g_useGravity) return NOMINAL_GRAVITY;

  return 0;
};

const NOMINAL_THRUST = +0.2;
const NOMINAL_RETRO = -0.1;

Ship.prototype.computeThrustMag = function () {
  let thrust = 0;

  if (g_keys[this.KEY_THRUST]) {
    thrust += NOMINAL_THRUST;
  }

  if (g_keys[this.KEY_RETRO]) {
    thrust += NOMINAL_RETRO;
  }

  return thrust;
};

Ship.prototype.applyAccel = function (accelX, accelY, du) {
  // Apply the given acceleration, over the specified period,
  // and compute the resulting velocity and displacement.
  //
  // Remember, if gravity is enabled, you must also implement
  // some "bounce functionality" for top and bottom collisions.
  //
  // The effect of the bounce should be to reverse the
  // y-component of the velocity, and then reduce it by 10%
  this.velX = ((this.velX + accelX * du) + this.velX) / 2;
  this.velY = ((this.velY + accelY * du) + this.velY) / 2;

  // Somewhat messy but for this variant I also need the height of the sprite
  const ctxHeight = g_ctx.canvas.clientHeight;
  if (
    g_useGravity &&
    (this.cy + this.velY * du - g_shipSprite.height / 2 < 0 ||
      this.cy + this.velY * du + g_shipSprite.height / 2 > ctxHeight)
  ) {
    this.velY *= -0.9;
  }

  this.cx += this.velX * du;
  this.cy += this.velY * du;
};

Ship.prototype.reset = function () {
  this.cx = this.reset_cx;
  this.cy = this.reset_cy;
  this.rotation = this.reset_rotation;

  this.halt();
};

Ship.prototype.halt = function () {
  this.velX = 0;
  this.velY = 0;
};

const NOMINAL_ROTATE_RATE = 0.1;

Ship.prototype.updateRotation = function (du) {
  if (g_keys[this.KEY_LEFT]) {
    this.rotation -= NOMINAL_ROTATE_RATE * du;
  }
  if (g_keys[this.KEY_RIGHT]) {
    this.rotation += NOMINAL_ROTATE_RATE * du;
  }
};

Ship.prototype.wrapPosition = function () {
  const canvasHeight = g_ctx.canvas.clientHeight;
  const canvasWidth = g_ctx.canvas.clientWidth;

  // Don't let the ship's centre-coordinates fall outside
  // the bounds of the playfield.
  if (this.willCollideDown()) {
    this.cy -= canvasHeight;
  }

  if (this.willCollideUp()) {
    this.cy += canvasHeight;
  }

  if (this.willCollideLeft()) {
    this.cx += canvasWidth;
  }

  if (this.willCollideRight()) {
    this.cx -= canvasWidth;
  }
};

Ship.prototype.render = function (ctx) {
  // NB: The preloaded ship sprite object is called `g_shipSprite`
  g_shipSprite.drawWrappedCentredAt(ctx, this.cx, this.cy, this.rotation);
};

// -------------------
// CONSTRUCT THE SHIPS
// -------------------

const g_ship = new Ship({
  cx: 140,
  cy: 200,
});

const g_extraShip1 = new Ship({
  cx: 200,
  cy: 200,
});

const g_extraShip2 = new Ship({
  cx: 260,
  cy: 200,
});

// =====
// UTILS
// =====

function clearCanvas(ctx) {
  // var prevfillStyle = ctx.fillStyle;
  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // ctx.fillStyle = prevfillStyle;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function fillCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function fillBox(ctx, x, y, w, h, style) {
  const oldStyle = ctx.fillStyle;
  ctx.fillStyle = style;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = oldStyle;
}

function keyCode(keyChar) {
  return keyChar.charCodeAt(0);
}

// =============
// GATHER INPUTS
// =============

function gatherInputs() {
  // Nothing to do here!
  // The event handlers do everything we need for now.
}

// =================
// UPDATE SIMULATION
// =================

// We take a very layered approach here...
//
// The primary `update` routine handles generic stuff such as
// pausing, single-step, and time-handling.
//
// It then delegates the game-specific logic to `updateSimulation`

// --------------------------
// GAME-SPECIFIC UPDATE LOGIC
// --------------------------

function updateSimulation(du) {
  processDiagnostics();

  g_ship.update(du);

  if (!g_useExtras) return;

  g_extraShip1.update(du / 2);
  g_extraShip1.update(du / 2);

  g_extraShip2.update(du / 4);
  g_extraShip2.update(du / 4);
  g_extraShip2.update(du / 4);
  g_extraShip2.update(du / 4);
}

// -------------------------
// GAME-SPECIFIC DIAGNOSTICS
// -------------------------

let g_allowMixedActions = true;
let g_useExtras = true;
let g_useGravity = false;

const KEY_EXTRAS = keyCode('E');
const KEY_GRAVITY = keyCode('G');
const KEY_MIXED = keyCode('M');

const KEY_HALT = keyCode('H');
const KEY_RESET = keyCode('R');

function processDiagnostics() {
  // Handle these simple diagnostic options,
  // as defined by the KEY identifiers above.
  if (eatKey(KEY_EXTRAS)) g_useExtras = !g_useExtras;
  if (eatKey(KEY_GRAVITY)) g_useGravity = !g_useGravity;
  if (eatKey(KEY_MIXED)) g_allowMixedActions = !g_allowMixedActions;

  if (g_keys[KEY_HALT]) {
    g_ship.halt();
    g_extraShip1.halt();
    g_extraShip2.halt();
  }

  if (g_keys[KEY_RESET]) {
    g_ship.reset();
    g_extraShip1.reset();
    g_extraShip2.reset();
  }
}

// --------------------
// GENERIC UPDATE LOGIC
// --------------------

// The "nominal interval" is the one that all of our time-based units are
// calibrated to e.g. a velocity unit is "pixels per nominal interval"
//
const NOMINAL_UPDATE_INTERVAL = 16.666;

// Dt means "delta time" and is in units of the timer-system (i.e. milliseconds)
//
let g_prevUpdateDt = null;

// Du means "delta u", where u represents time in multiples of our nominal interval
//
let g_prevUpdateDu = null;

// Track odds and evens for diagnostic / illustrative purposes
//
let g_isUpdateOdd = false;

function update(dt) {
  // Get out if skipping (e.g. due to pause-mode)
  //
  if (shouldSkipUpdate()) return;

  // Remember this for later
  //
  let original_dt = dt;

  // Warn about very large dt values -- they may lead to error
  //
  if (dt > 200) {
    console.log('Big dt =', dt, ': CLAMPING TO NOMINAL');
    dt = NOMINAL_UPDATE_INTERVAL;
  }

  // If using variable time, divide the actual delta by the "nominal" rate,
  // giving us a conveniently scaled "du" to work with.
  //
  let du = dt / NOMINAL_UPDATE_INTERVAL;

  updateSimulation(du);

  g_prevUpdateDt = original_dt;
  g_prevUpdateDu = du;

  g_isUpdateOdd = !g_isUpdateOdd;
}

// Togglable Pause Mode
//
const KEY_PAUSE = 'P'.charCodeAt(0);
const KEY_STEP = 'O'.charCodeAt(0);

let g_isUpdatePaused = false;

function shouldSkipUpdate() {
  if (eatKey(KEY_PAUSE)) {
    g_isUpdatePaused = !g_isUpdatePaused;
  }
  return g_isUpdatePaused && !eatKey(KEY_STEP);
}

// =================
// RENDER SIMULATION
// =================

// We take a very layered approach here...
//
// The primary `render` routine handles generic stuff such as
// the diagnostic toggles (including screen-clearing).
//
// It then delegates the game-specific logic to `gameRender`

// -----------------------
// GAME-SPECIFIC RENDERING
// -----------------------

function renderSimulation(ctx) {
  g_ship.render(ctx);

  if (!g_useExtras) return;

  g_extraShip1.render(ctx);
  g_extraShip2.render(ctx);
}

// -----------------
// GENERIC RENDERING
// -----------------

let g_doClear = true;
let g_doBox = false;
let g_undoBox = false;
let g_doFlipFlop = false;
let g_doRender = true;

let g_frameCounter = 1;

const TOGGLE_CLEAR = 'C'.charCodeAt(0);
const TOGGLE_BOX = 'B'.charCodeAt(0);
const TOGGLE_UNDO_BOX = 'U'.charCodeAt(0);
const TOGGLE_FLIPFLOP = 'F'.charCodeAt(0);
// Mind this bind
const TOGGLE_RENDER = 'R'.charCodeAt(0);

function render(ctx) {
  // Process various option toggles
  //
  if (eatKey(TOGGLE_CLEAR)) g_doClear = !g_doClear;
  if (eatKey(TOGGLE_BOX)) g_doBox = !g_doBox;
  if (eatKey(TOGGLE_UNDO_BOX)) g_undoBox = !g_undoBox;
  if (eatKey(TOGGLE_FLIPFLOP)) g_doFlipFlop = !g_doFlipFlop;

  // Don't toggle rendering in this exercise,
  // because we're going to "steal" that key to implement "reset" instead.
  //if (eatKey(TOGGLE_RENDER)) g_doRender = !g_doRender;

  // I've pulled the clear out of `renderSimulation()` and into
  // here, so that it becomes part of our "diagnostic" wrappers
  //
  if (g_doClear) clearCanvas(ctx);

  // The main purpose of the box is to demonstrate that it is
  // always deleted by the subsequent "undo" before you get to
  // see it...
  //
  // i.e. double-buffering prevents flicker!
  //
  if (g_doBox) fillBox(ctx, 200, 200, 50, 50, 'red');

  // The core rendering of the actual game / simulation
  //
  if (g_doRender) renderSimulation(ctx);

  // This flip-flip mechanism illustrates the pattern of alternation
  // between frames, which provides a crude illustration of whether
  // we are running "in sync" with the display refresh rate.
  //
  // e.g. in pathological cases, we might only see the "even" frames.
  //
  if (g_doFlipFlop) {
    let boxX = 250,
      boxY = g_isUpdateOdd ? 100 : 200;

    // Draw flip-flop box
    fillBox(ctx, boxX, boxY, 50, 50, 'green');

    // Display the current frame-counter in the box...
    ctx.fillText(g_frameCounter % 1000, boxX + 10, boxY + 20);
    // ..and its odd/even status too
    let text = g_frameCounter % 2 ? 'odd' : 'even';
    ctx.fillText(text, boxX + 10, boxY + 40);
  }

  // Optional erasure of diagnostic "box",
  // to illustrate flicker-proof double-buffering
  //
  if (g_undoBox) ctx.clearRect(200, 200, 50, 50);

  ++g_frameCounter;
}

// =============
// PRELOAD STUFF
// =============

let g_shipSprite;

function preloadStuff_thenCall(completionCallback) {
  let g_shipImage = new Image();

  g_shipImage.onload = function () {
    g_shipSprite = new Sprite(g_shipImage);
    completionCallback();
  };

  g_shipImage.src = 'https://notendur.hi.is/~pk/308G/images/ship.png';
}

// ========
// MAINLOOP
// ========

// The mainloop is one big object with a fairly small public interface
// (e.g. init, iter, gameOver), and a bunch of private internal helper methods.
//
// The "private" members are identified as such purely by the naming convention
// of having them begin with a leading underscore. A more robust form of privacy,
// with genuine name-hiding *is* possible in JavaScript (via closures), but I
// haven't adopted it here.
//
const g_main = {
  // "Frame Time" is a (potentially high-precision) frame-clock for animations
  _frameTime_ms: null,
  _frameTimeDelta_ms: null,
};

// Perform one iteration of the mainloop
g_main.iter = function (frameTime) {
  // Use the given frameTime to update all of our game-clocks
  this._updateClocks(frameTime);

  // Perform the iteration core to do all the "real" work
  this._iterCore(this._frameTimeDelta_ms);

  // Diagnostics, such as showing current timer values etc.
  this._debugRender(g_ctx);

  // Request the next iteration if needed
  if (!this._isGameOver) this._requestNextIteration();
};

g_main._updateClocks = function (frameTime) {
  // First-time initialisation
  if (this._frameTime_ms === null) this._frameTime_ms = frameTime;

  // Track frameTime and its delta
  this._frameTimeDelta_ms = frameTime - this._frameTime_ms;
  this._frameTime_ms = frameTime;
};

g_main._iterCore = function (dt) {
  // Handle QUIT
  if (requestedQuit()) {
    this.gameOver();
    return;
  }

  gatherInputs();
  update(dt);
  render(g_ctx);
};

g_main._isGameOver = false;

g_main.gameOver = function () {
  this._isGameOver = true;
  console.log('gameOver: quitting...');
};

// Simple voluntary quit mechanism
//
const KEY_QUIT = 'Q'.charCodeAt(0);
function requestedQuit() {
  return g_keys[KEY_QUIT];
}

// Annoying shim for Firefox and Safari
window.requestAnimationFrame =
  window.requestAnimationFrame || // Chrome
  window.mozRequestAnimationFrame || // Firefox
  window.webkitRequestAnimationFrame; // Safari

// This needs to be a "global" function, for the "window" APIs to callback to
function mainIterFrame(frameTime) {
  g_main.iter(frameTime);
}

g_main._requestNextIteration = function () {
  window.requestAnimationFrame(mainIterFrame);
};

// Mainloop-level debug-rendering

const TOGGLE_TIMER_SHOW = 'T'.charCodeAt(0);

g_main._doTimerShow = false;

g_main._debugRender = function (ctx) {
  if (eatKey(TOGGLE_TIMER_SHOW)) this._doTimerShow = !this._doTimerShow;

  if (!this._doTimerShow) return;

  const y = 350;
  ctx.fillText('FT ' + this._frameTime_ms, 50, y + 10);
  ctx.fillText('FD ' + this._frameTimeDelta_ms, 50, y + 20);
  ctx.fillText('UU ' + g_prevUpdateDu, 50, y + 30);
  ctx.fillText('FrameSync ON', 50, y + 40);
};

g_main.init = function () {
  // Grabbing focus is good, but it sometimes screws up jsfiddle,
  // so it's a risky option during "development"
  //
  //window.focus(true);

  // We'll be working on a black background here,
  // so let's use a fillStyle which works against that...
  //
  g_ctx.fillStyle = 'white';

  this._requestNextIteration();
};

function mainInit() {
  g_main.init();
}

preloadStuff_thenCall(mainInit);
