/**
 * Central configuration for the game.
 * All magic numbers live here — never scattered through components.
 */
export const GAME_CONFIG = {
  scoring: {
    correct: 100,
    wrong: -10,
    miss: -10,
  },
  bomb: {
    /** Forward launch speed added to player velocity */
    launchSpeed: 6,
    /** Downward kick on drop */
    dropKick: -3,
    /** Max flight time in ms before auto-miss */
    timeoutMs: 8000,
    /** Number of trail positions stored */
    trailLength: 50,
    /** Collision sphere radius for bomb */
    radius: 1.2,
  },
  flight: {
    /** Max horizontal speed (units/s) */
    speed: 10,
    /** Lateral speed */
    lateralSpeed: 8,
    /** Vertical speed */
    verticalSpeed: 4,
    /** How quickly the helicopter reaches target velocity */
    acceleration: 3.5,
    /** Maximum bank angle in radians */
    bankAngle: 0.35,
    /** Pitch angle during forward/backward movement */
    pitchAngle: 0.2,
    /** Player's starting altitude */
    startAltitude: 20,
  },
  camera: {
    /** Lerp factor (lower = more lag) */
    followLag: 0.06,
    /** Distance behind player */
    distance: 16,
    /** Height above player */
    height: 6,
    /** Horizontal offset (right of player) */
    sideOffset: 0,
    /** Camera shake duration in ms */
    shakeDuration: 500,
    /** Camera shake magnitude */
    shakeMagnitude: 0.18,
    /** Bomb follow lerp */
    bombFollowLag: 0.04,
  },
  enemy: {
    /** Base patrol speed */
    speed: 3.5,
    /** Altitude sinusoidal variance */
    altitudeVariance: 2.5,
    /** Radius of patrol circle */
    waypointRadius: 30,
    /** How tightly helicopters bank during turns */
    bankFactor: 0.5,
    /** Number of patrol waypoints per helicopter */
    waypointCount: 6,
    /** Collision sphere radius */
    colliderRadius: 1.8,
  },
  world: {
    /** Terrain size */
    terrainSize: 300,
    /** Terrain subdivisions (higher = more detail but slower) */
    terrainSubdivisions: 64,
    /** Maximum terrain height */
    terrainMaxHeight: 6,
    /** Number of cloud instances */
    cloudCount: 28,
    /** Fog near distance */
    fogNear: 100,
    /** Fog far distance */
    fogFar: 280,
  },
  gameplay: {
    /** Delay in ms before next question starts after resolution */
    questionTransitionDelay: 2800,
    /** How long result overlay shows before auto-dismiss */
    resultDisplayDuration: 2500,
    /** Rotor spin speed (radians/s) for main rotor */
    mainRotorSpeed: 18,
    /** Tail rotor spin speed */
    tailRotorSpeed: 25,
  },
} as const
