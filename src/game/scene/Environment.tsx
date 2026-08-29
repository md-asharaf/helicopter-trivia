import { Sky } from '@react-three/drei'

/**
 * Sunny Blue Sky with Sun Horizon Scatter & Distant Cumulus Clouds.
 * Matches the bright, clean daylight aesthetic of the reference flight game.
 */
export function Environment() {
  return (
    <>
      {/* Daylight Rayleigh Sky Dome with Sun Ahead on Horizon */}
      <Sky
        distance={450000}
        sunPosition={[0, 22, -180]} // Directly ahead on the horizon for glistening water reflection
        inclination={0.52}
        azimuth={0.5}
        turbidity={3.0}
        rayleigh={0.35}
        mieCoefficient={0.003}
        mieDirectionalG={0.92}
      />

      {/* Atmospheric depth haze for distant horizon blending */}
      <fog
        attach="fog"
        args={['#c8e6fa', 180, 560]}
      />

      {/* Distant fluffy horizon clouds */}
      <DistantHorizonClouds />
    </>
  )
}

function DistantHorizonClouds() {
  const clouds: Array<{ pos: [number, number, number]; scale: [number, number, number] }> = [
    { pos: [-140, 24, -280], scale: [28, 6, 18] },
    { pos: [-70, 28, -320], scale: [36, 8, 22] },
    { pos: [60, 26, -300], scale: [32, 7, 20] },
    { pos: [130, 22, -270], scale: [26, 6, 16] },
    { pos: [-180, 25, -200], scale: [24, 5, 15] },
    { pos: [170, 25, -210], scale: [25, 5, 15] },
  ]

  return (
    <group>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.9}
            metalness={0.0}
            flatShading={true}
          />
        </mesh>
      ))}
    </group>
  )
}
