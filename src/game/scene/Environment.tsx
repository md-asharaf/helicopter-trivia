import { Sky, Environment as DreiEnvironment } from '@react-three/drei'

/**
 * Ultra-realistic high-altitude mountain sky, HDRI ambient lighting & atmospheric haze.
 */
export function Environment() {
  return (
    <>
      {/* HDRI Environmental Reflections for PBR Metallic Surfaces & Water */}
      <DreiEnvironment preset="sunset" environmentIntensity={0.6} />

      {/* Sky dome with warm natural sunlight scatter */}
      <Sky
        distance={450000}
        sunPosition={[80, 50, -70]}
        inclination={0.52}
        azimuth={0.28}
        turbidity={5.5}
        rayleigh={0.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.85}
      />

      {/* Atmospheric depth haze fog */}
      <fog
        attach="fog"
        args={['#9fcbe4', 90, 320]}
      />

      {/* Distant majestic mountain ranges */}
      <DistantAlpineMountains />
    </>
  )
}

function DistantAlpineMountains() {
  const peaks: Array<{ pos: [number, number, number]; scale: [number, number, number]; isSnow: boolean }> = [
    { pos: [-170, -4, -220], scale: [60, 68, 48], isSnow: true },
    { pos: [-95, -4, -240], scale: [70, 82, 55], isSnow: true },
    { pos: [15, -4, -260], scale: [80, 92, 60], isSnow: true },
    { pos: [120, -4, -230], scale: [65, 75, 50], isSnow: true },
    { pos: [195, -4, -210], scale: [58, 65, 45], isSnow: true },
    // Flanking mountain ridges
    { pos: [-210, -4, -110], scale: [50, 56, 42], isSnow: false },
    { pos: [210, -4, -100], scale: [48, 54, 40], isSnow: false },
    { pos: [-220, -4, 30], scale: [52, 50, 44], isSnow: false },
    { pos: [220, -4, 40], scale: [50, 52, 42], isSnow: false },
  ]

  return (
    <group>
      {peaks.map((p, i) => {
        const peakRockColor = p.isSnow ? '#283236' : '#1c2e22'
        return (
          <group key={i} position={p.pos}>
            {/* Mountain base rock with smooth natural silhouette */}
            <mesh position={[0, p.scale[1] / 2, 0]}>
              <coneGeometry args={[p.scale[0], p.scale[1], 18]} />
              <meshStandardMaterial
                color={peakRockColor}
                roughness={0.92}
                metalness={0.04}
                flatShading={false}
              />
            </mesh>

            {/* Natural snow caps on high peaks */}
            {p.isSnow && (
              <mesh position={[0, p.scale[1] * 0.76, 0]}>
                <coneGeometry args={[p.scale[0] * 0.36, p.scale[1] * 0.48, 18]} />
                <meshStandardMaterial
                  color="#edf4fa"
                  roughness={0.65}
                  metalness={0.08}
                  flatShading={false}
                />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
