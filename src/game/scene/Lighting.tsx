/**
 * Cinematic High-Altitude Sun & Sky Lighting.
 * Features warm golden directional sunlight, sky blue hemisphere ambient fill,
 * and soft ground bounce lighting.
 */
export function Lighting() {
  return (
    <>
      {/* Primary Key Light — Warm Alpine Sun */}
      <directionalLight
        position={[70, 95, -40]}
        intensity={2.6}
        color="#fff5e4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0004}
      />

      {/* Sky Blue & Alpine Pine Meadow Ambient Fill */}
      <hemisphereLight
        args={['#a8dcf8', '#2d4b24', 0.85]}
      />

      {/* Subtle secondary fill for cockpit/fuselage shadows */}
      <directionalLight
        position={[-60, 40, 60]}
        intensity={0.6}
        color="#cce6f8"
      />

      {/* Ambient base */}
      <ambientLight intensity={0.25} />
    </>
  )
}
