import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface HelicopterMeshProps {
  isPlayer?: boolean
  crashed?: boolean
}

/**
 * Hyper-Detailed Procedural 3D Attack Helicopter Rig (AH-64 / Stealth Apache Style).
 * Built 100% with Three.js procedural primitives:
 * - High-speed spinning main rotor with semi-transparent motion blur disc
 * - Spinning tail rotor on vertical stabilizer fin
 * - Aerodynamic military fuselage & tinted cockpit glass canopy
 * - Twin weapon pylons with rocket pods & rotary minigun
 * - Twin landing skids & antenna probes
 * - Dynamic turbine exhaust glow & LED navigation strobe beacons
 * - Zero external FBX / texture file dependencies (100% instant 60 FPS loading)
 */
export function HelicopterMesh({ isPlayer = false, crashed = false }: HelicopterMeshProps) {
  const mainRotorRef = useRef<THREE.Group>(null)
  const tailRotorRef = useRef<THREE.Group>(null)
  const rotorBlurRef = useRef<THREE.Mesh>(null)
  const strobeRef = useRef<THREE.PointLight>(null)
  const exhaustLightRef = useRef<THREE.PointLight>(null)

  // Color schemes
  const hullColor = isPlayer ? '#0c2233' : '#23291f' // Stealth Navy vs Tactical Olive Drab
  const hullAccent = isPlayer ? '#0284c7' : '#78350f' // Cyan accent vs Desert brown
  const cockpitGlass = isPlayer ? '#00e5ff' : '#ff8c00'
  const emissiveGlow = isPlayer ? '#00f0ff' : '#ff5500'

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = state.clock.getElapsedTime()

    // 1. High-speed main rotor spin (35 rad/s)
    if (mainRotorRef.current) {
      mainRotorRef.current.rotation.y += (crashed ? 12 : 36) * dt
    }

    // 2. High-speed tail rotor spin (48 rad/s)
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += (crashed ? 15 : 48) * dt
    }

    // 3. Rotor motion blur disc opacity oscillation
    if (rotorBlurRef.current) {
      const mat = rotorBlurRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = crashed ? 0.05 : 0.22 + Math.sin(t * 20) * 0.05
    }

    // 4. Navigation strobe light blink (2 Hz pulse)
    if (strobeRef.current) {
      const blink = Math.sin(t * 12) > 0.4 ? (crashed ? 3.0 : 2.0) : 0.2
      strobeRef.current.intensity = blink
    }

    // 5. Engine exhaust glow flicker
    if (exhaustLightRef.current) {
      exhaustLightRef.current.intensity = crashed ? 4.0 : 1.2 + Math.sin(t * 30) * 0.4
    }
  })

  return (
    <group rotation={[0, Math.PI, 0]}>
      {/* ─── 1. MAIN FUSELAGE / CABIN ──────────────────────────────────── */}
      {/* Central armored cabin body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.7, 1.3, 3.8]} />
        <meshStandardMaterial
          color={hullColor}
          metalness={0.75}
          roughness={0.3}
          flatShading
        />
      </mesh>

      {/* Aerodynamic tapered nose section */}
      <mesh castShadow receiveShadow position={[0, -0.1, 2.3]}>
        <coneGeometry args={[0.82, 1.4, 6]} />
        <meshStandardMaterial
          color={hullAccent}
          metalness={0.7}
          roughness={0.32}
          flatShading
        />
      </mesh>

      {/* Forward chin sensor / FLIR turret */}
      <mesh position={[0, -0.45, 2.7]}>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={emissiveGlow}
          emissiveIntensity={crashed ? 0.2 : 0.8}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* ─── 2. COCKPIT CANOPY GLASS ─────────────────────────────────── */}
      <mesh position={[0, 0.45, 0.9]} rotation={[-Math.PI / 8, 0, 0]}>
        <boxGeometry args={[1.2, 0.75, 1.8]} />
        <meshStandardMaterial
          color={cockpitGlass}
          emissive={cockpitGlass}
          emissiveIntensity={crashed ? 0.3 : 0.6}
          roughness={0.1}
          metalness={0.95}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* Cockpit canopy frame divider */}
      <mesh position={[0, 0.52, 0.9]} rotation={[-Math.PI / 8, 0, 0]}>
        <boxGeometry args={[1.22, 0.06, 0.08]} />
        <meshStandardMaterial color="#050b14" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ─── 3. ENGINE NACELLES & TURBINES ───────────────────────────── */}
      {/* Port engine pod */}
      <mesh castShadow position={[-0.95, 0.35, -0.2]}>
        <cylinderGeometry args={[0.32, 0.36, 2.2, 10]} />
        <meshStandardMaterial color={hullAccent} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Starboard engine pod */}
      <mesh castShadow position={[0.95, 0.35, -0.2]}>
        <cylinderGeometry args={[0.32, 0.36, 2.2, 10]} />
        <meshStandardMaterial color={hullAccent} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Twin Engine Exhaust Nozzles */}
      <mesh position={[-0.95, 0.35, -1.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.3, 10]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff5500"
          emissiveIntensity={crashed ? 3.5 : 1.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.95, 0.35, -1.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.3, 10]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff5500"
          emissiveIntensity={crashed ? 3.5 : 1.8}
          roughness={0.3}
        />
      </mesh>

      {/* Dynamic Engine Exhaust Heat Light */}
      <pointLight
        ref={exhaustLightRef}
        position={[0, 0.35, -1.5]}
        color={isPlayer ? '#00e5ff' : '#ff6600'}
        intensity={1.2}
        distance={6}
        decay={2}
      />

      {/* ─── 4. MAIN ROTOR MAST & BLADES ─────────────────────────────── */}
      {/* Rotor Mast Hub */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.6, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Spinning Main Rotor Group */}
      <group ref={mainRotorRef} position={[0, 1.22, 0]}>
        {/* Swashplate / Rotor Head Hub */}
        <mesh>
          <cylinderGeometry args={[0.38, 0.38, 0.12, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Blade 1 & 2 (Fore / Aft Blade Pair) */}
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.28, 0.04, 6.8]} />
          <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Blade 3 & 4 (Port / Starboard Blade Pair) */}
        <mesh position={[0, 0.03, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.28, 0.04, 6.8]} />
          <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* High-visibility yellow blade tips */}
        <mesh position={[0, 0.035, 3.25]}>
          <boxGeometry args={[0.3, 0.045, 0.35]} />
          <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.035, -3.25]}>
          <boxGeometry args={[0.3, 0.045, 0.35]} />
          <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[3.25, 0.035, 0]}>
          <boxGeometry args={[0.35, 0.045, 0.3]} />
          <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[-3.25, 0.035, 0]}>
          <boxGeometry args={[0.35, 0.045, 0.3]} />
          <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* Main Rotor Motion Blur Disc */}
      <mesh ref={rotorBlurRef} position={[0, 1.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 3.4, 32]} />
        <meshBasicMaterial
          color={isPlayer ? '#00e5ff' : '#ffeedd'}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ─── 5. TAIL BOOM & TAIL ROTOR ──────────────────────────────── */}
      {/* Tapered Tail Boom */}
      <mesh castShadow receiveShadow position={[0, 0.15, -3.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.55, 3.2, 8]} />
        <meshStandardMaterial color={hullColor} metalness={0.75} roughness={0.3} flatShading />
      </mesh>

      {/* Vertical Tail Fin / Stabilizer */}
      <mesh castShadow position={[0, 0.85, -4.6]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.12, 1.5, 0.7]} />
        <meshStandardMaterial color={hullAccent} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Horizontal Stabilizer Winglet */}
      <mesh castShadow position={[0, 0.3, -4.2]}>
        <boxGeometry args={[1.5, 0.06, 0.5]} />
        <meshStandardMaterial color={hullAccent} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Spinning Tail Rotor Assembly */}
      <group ref={tailRotorRef} position={[0.16, 0.95, -4.7]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Tail blade pair */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.08, 0.02, 1.4]} />
          <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ─── 6. WEAPON PYLONS & WINGLETS ────────────────────────────── */}
      {/* Port Weapon Wing */}
      <mesh castShadow position={[-1.3, -0.05, 0.2]}>
        <boxGeometry args={[0.9, 0.1, 0.5]} />
        <meshStandardMaterial color={hullColor} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Starboard Weapon Wing */}
      <mesh castShadow position={[1.3, -0.05, 0.2]}>
        <boxGeometry args={[0.9, 0.1, 0.5]} />
        <meshStandardMaterial color={hullColor} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Port Rocket Launcher Pod (Multi-tube Cylinder) */}
      <group position={[-1.45, -0.22, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.9, 12]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Rocket pod nose cone */}
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.22, 0.2, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Starboard Rocket Launcher Pod */}
      <group position={[1.45, -0.22, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.9, 12]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.22, 0.2, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Chin-Mounted Gatling Minigun */}
      <group position={[0, -0.72, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 8]} />
          <meshStandardMaterial
            color={emissiveGlow}
            emissive={emissiveGlow}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      {/* ─── 7. TUBULAR LANDING SKIDS ───────────────────────────────── */}
      {/* Left Skid Runner */}
      <mesh castShadow position={[-0.95, -0.9, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3.4, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right Skid Runner */}
      <mesh castShadow position={[0.95, -0.9, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3.4, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Skid mounting struts */}
      <mesh position={[-0.8, -0.65, 0.8]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, -0.65, 0.8]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.8, -0.65, -0.8]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, -0.65, -0.8]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ─── 8. NAVIGATION STROBE LIGHT BEACON ──────────────────────── */}
      <pointLight
        ref={strobeRef}
        position={[0, 1.5, -4.6]}
        color={isPlayer ? '#00e5ff' : '#ff0033'}
        intensity={1.5}
        distance={10}
        decay={2}
      />
    </group>
  )
}
