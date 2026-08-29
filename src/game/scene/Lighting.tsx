/**
 * Bright Coastal Daylight Lighting.
 * Crisp sunlight, blue sky hemisphere fill, and sharp low-poly facet illumination.
 */
export function Lighting() {
  return (
    <>
      {/* Primary Key Light — Bright Horizon Sun */}
      <directionalLight
        position={[30, 85, -100]}
        intensity={2.8}
        color="#fffcf2"
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

      {/* Sky Blue & Island Meadow Ambient Fill */}
      <hemisphereLight
        args={['#c8e8fa', '#2d5e2e', 0.95]}
      />

      {/* Secondary Rim Fill Light */}
      <directionalLight
        position={[-50, 45, 50]}
        intensity={0.5}
        color="#bfe0f8"
      />

      {/* Ambient base */}
      <ambientLight intensity={0.35} />
    </>
  )
}
