import { Sky } from '@react-three/drei'

/**
 * Cinematic High-Altitude Aerial Military Sky & Atmospheric Environment.
 * Clean, majestic open sky with warm sunlight and horizon haze.
 */
export function Environment() {
  return (
    <>
      {/* Physical Rayleigh/Mie Sky Dome with Sunset Sun Angle */}
      <Sky
        distance={450000}
        sunPosition={[120, 38, -100]}
        inclination={0.55}
        azimuth={0.25}
        turbidity={4.0}
        rayleigh={0.55}
        mieCoefficient={0.005}
        mieDirectionalG={0.88}
      />

      {/* High-Altitude Horizon Atmospheric Fog */}
      <fog
        attach="fog"
        args={['#7eb5d6', 160, 480]}
      />
    </>
  )
}
