import { Sky } from '@react-three/drei'

/**
 * Ultra-realistic high-altitude mountain sky & atmospheric haze environment.
 */
export function Environment() {
  return (
    <>
      {/* Sky dome with warm natural sunlight scatter */}
      <Sky
        distance={450000}
        sunPosition={[70, 45, -60]}
        inclination={0.52}
        azimuth={0.28}
        turbidity={6.5}
        rayleigh={0.65}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
      />

      {/* Atmospheric depth haze fog */}
      <fog
        attach="fog"
        args={['#a8d8f0', 70, 280]}
      />

      {/* Distant majestic mountain ranges */}
      <DistantAlpineMountains />
    </>
  )
}

function DistantAlpineMountains() {
  const peaks: Array<{ pos: [number, number, number]; scale: [number, number, number]; isSnow: boolean }> = [
    { pos: [-160, -6, -200], scale: [48, 55, 36], isSnow: true },
    { pos: [-90, -6, -220], scale: [55, 68, 42], isSnow: true },
    { pos: [10, -6, -240], scale: [62, 74, 48], isSnow: true },
    { pos: [110, -6, -210], scale: [52, 60, 38], isSnow: true },
    { pos: [180, -6, -190], scale: [45, 52, 34], isSnow: true },
    // Flanking mountain ridges
    { pos: [-190, -6, -90], scale: [42, 48, 38], isSnow: false },
    { pos: [190, -6, -80], scale: [40, 46, 36], isSnow: false },
    { pos: [-200, -6, 40], scale: [44, 42, 40], isSnow: false },
    { pos: [200, -6, 50], scale: [42, 44, 38], isSnow: false },
  ]

  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i} position={p.pos}>
          {/* Mountain base rock */}
          <mesh castShadow position={[0, p.scale[1] / 2, 0]}>
            <coneGeometry args={[p.scale[0], p.scale[1], 6]} />
            <meshStandardMaterial
              color={p.isSnow ? '#323d42' : '#273e28'}
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>

          {/* Snow cap on majestic peaks */}
          {p.isSnow && (
            <mesh position={[0, p.scale[1] * 0.78, 0]}>
              <coneGeometry args={[p.scale[0] * 0.38, p.scale[1] * 0.44, 6]} />
              <meshStandardMaterial color="#f0f6fa" roughness={0.6} metalness={0.1} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}
