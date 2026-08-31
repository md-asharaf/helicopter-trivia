import { Sky } from '@react-three/drei'

/**
 * Atmospheric Alpine Sky Dome with Rayleigh Scattering & Depth Haze (SKILL.md Law 1).
 * Seamless 360-degree daylight sky with zero pop-in artifacts.
 */
export function Environment() {
  return (
    <>
      {/* Daylight Rayleigh Sky Dome with Sun Ahead on Horizon */}
      <Sky
        distance={450000}
        sunPosition={[0, 26, -200]}
        inclination={0.52}
        azimuth={0.5}
        turbidity={2.4}
        rayleigh={0.42}
        mieCoefficient={0.005}
        mieDirectionalG={0.88}
      />

      {/* Atmospheric depth haze for seamless horizon blending */}
      <fog
        attach="fog"
        args={['#c2e3f8', 190, 680]}
      />
    </>
  )
}
