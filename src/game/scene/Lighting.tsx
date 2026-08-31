/**
 * Cinematic PBR Alpine Daylight Lighting (SKILL.md Law 1 & Law 3).
 * Balanced direct sunlight, sky hemisphere fill, and canyon bounce lighting.
 */
export function Lighting() {
  return (
    <>
      {/* Primary Key Light — Warm Alpine Sunlight */}
      <directionalLight
        position={[45, 85, -95]}
        intensity={2.1}
        color="#fffcf2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={450}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-bias={-0.0003}
      />

      {/* Sky Blue & Alpine Pine Ground Ambient Fill */}
      <hemisphereLight
        args={['#93c5fd', '#143c16', 0.92]}
      />

      {/* Secondary Fill Light from Canyon Horizon */}
      <directionalLight
        position={[-60, 48, 60]}
        intensity={0.45}
        color="#bae6fd"
      />

      {/* Ambient Fill Base */}
      <ambientLight intensity={0.28} color="#e0f2fe" />
    </>
  )
}
