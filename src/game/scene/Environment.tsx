import { Environment as DreiEnvironment } from '@react-three/drei'

/**
 * Photorealistic 360° Real-World Aerial Environment & HDR Lighting.
 * Uses real-world high-altitude panoramic skybox and PBR lighting reflections.
 */
export function Environment() {
  return (
    <>
      {/* 360° Real-World HDR Aerial Skybox & Environmental PBR Reflections */}
      <DreiEnvironment
        preset="sunset"
        background
        environmentIntensity={0.85}
      />

      {/* Atmospheric High-Altitude Depth Fog blending with the horizon */}
      <fog
        attach="fog"
        args={['#203244', 110, 420]}
      />
    </>
  )
}
