/**
 * Bright Coastal Daylight Lighting.
 * Balanced direct sunlight and sky hemisphere fill for rich, saturated colors without washout.
 */
export function Lighting() {
  return (
    <>
      {/* Primary Key Light — Crisp Sunlight */}
      <directionalLight
        position={[35, 75, -90]}
        intensity={1.65}
        color="#fffdf5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-bias={-0.0004}
      />

      {/* Sky Blue & Island Forest Ambient Fill */}
      <hemisphereLight
        args={['#8ec8f0', '#255220', 0.85]}
      />

      {/* Secondary Fill Light */}
      <directionalLight
        position={[-50, 45, 50]}
        intensity={0.4}
        color="#b0d8f6"
      />

      {/* Ambient base */}
      <ambientLight intensity={0.25} />
    </>
  )
}
