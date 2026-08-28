import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface ExplosionProps {
  position: THREE.Vector3
  type: 'correct' | 'wrong' | 'miss'
  onComplete?: () => void
}

const FIRE_PARTICLES = 36
const SMOKE_PARTICLES = 24
const SPARK_PARTICLES = 30
const DURATION = 1.6

/**
 * Hyper-realistic multi-stage Hollywood fire & explosion system.
 * Features expanding plasma fireball core, rising billowing dark smoke,
 * flying incandescent sparks, shockwave ring, and dynamic fireflash lighting.
 */
export function Explosion({ position, type, onComplete }: ExplosionProps) {
  const fireMeshRef = useRef<THREE.InstancedMesh>(null)
  const smokeMeshRef = useRef<THREE.InstancedMesh>(null)
  const sparkMeshRef = useRef<THREE.InstancedMesh>(null)
  const shockwaveRef = useRef<THREE.Mesh>(null)
  const fireLightRef = useRef<THREE.PointLight>(null)
  const startTime = useRef<number | null>(null)

  const isMiss = type === 'miss'
  const isCorrect = type === 'correct'

  // Fire particles: fast explosive expansion then decay
  const fireData = useMemo(
    () =>
      Array.from({ length: FIRE_PARTICLES }, () => {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const speed = 4.0 + Math.random() * 8.0
        return {
          pos: position.clone(),
          vel: new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed * 0.8 + 2.0,
            Math.sin(phi) * Math.sin(theta) * speed
          ),
          scale: 0.6 + Math.random() * 0.8,
          rotSpeed: (Math.random() - 0.5) * 6,
        }
      }),
    [position]
  )

  // Smoke particles: slower, expand larger, rise upward
  const smokeData = useMemo(
    () =>
      Array.from({ length: SMOKE_PARTICLES }, () => {
        const angle = Math.random() * Math.PI * 2
        const spread = 2.0 + Math.random() * 4.0
        return {
          pos: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)),
          vel: new THREE.Vector3(
            Math.cos(angle) * spread * 0.6,
            4.0 + Math.random() * 5.0,
            Math.sin(angle) * spread * 0.6
          ),
          maxScale: 2.2 + Math.random() * 2.0,
          rotSpeed: (Math.random() - 0.5) * 2,
        }
      }),
    [position]
  )

  // Incandescent sparks / embers: high velocity, gravity drop
  const sparkData = useMemo(
    () =>
      Array.from({ length: SPARK_PARTICLES }, () => {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const speed = 8.0 + Math.random() * 14.0
        return {
          pos: position.clone(),
          vel: new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed + 4.0,
            Math.cos(phi) * speed
          ),
          scale: 0.12 + Math.random() * 0.16,
        }
      }),
    [position]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime
    }

    const elapsed = state.clock.elapsedTime - startTime.current
    const progress = Math.min(elapsed / DURATION, 1.0)

    if (progress >= 1.0) {
      onComplete?.()
      return
    }

    // 1. Animate Fireball Core
    if (fireMeshRef.current) {
      fireData.forEach((f, i) => {
        f.pos.addScaledVector(f.vel, delta)
        f.vel.multiplyScalar(0.92)
        f.pos.y += delta * 1.5

        dummy.position.copy(f.pos)
        const fireScale = Math.sin(progress * Math.PI * 0.9) * f.scale * (1.2 - progress * 0.8)
        dummy.scale.setScalar(Math.max(0.001, fireScale))
        dummy.rotation.set(progress * f.rotSpeed, progress * f.rotSpeed * 0.7, 0)
        dummy.updateMatrix()
        fireMeshRef.current!.setMatrixAt(i, dummy.matrix)
      })
      fireMeshRef.current.instanceMatrix.needsUpdate = true
    }

    // 2. Animate Billowing Smoke Plume
    if (smokeMeshRef.current) {
      smokeData.forEach((s, i) => {
        s.pos.addScaledVector(s.vel, delta)
        s.vel.x *= 0.94
        s.vel.z *= 0.94
        s.vel.y *= 0.97

        dummy.position.copy(s.pos)
        const smokeScale = (progress * 0.8 + 0.2) * s.maxScale
        dummy.scale.setScalar(Math.max(0.001, smokeScale))
        dummy.rotation.set(0, progress * s.rotSpeed, 0)
        dummy.updateMatrix()
        smokeMeshRef.current!.setMatrixAt(i, dummy.matrix)
      })
      smokeMeshRef.current.instanceMatrix.needsUpdate = true
    }

    // 3. Animate Sparks / Embers
    if (sparkMeshRef.current) {
      sparkData.forEach((sp, i) => {
        sp.pos.addScaledVector(sp.vel, delta)
        sp.vel.y -= 14.0 * delta
        sp.vel.multiplyScalar(0.96)

        dummy.position.copy(sp.pos)
        const sparkScale = (1.0 - progress) * sp.scale
        dummy.scale.setScalar(Math.max(0.001, sparkScale))
        dummy.updateMatrix()
        sparkMeshRef.current!.setMatrixAt(i, dummy.matrix)
      })
      sparkMeshRef.current.instanceMatrix.needsUpdate = true
    }

    // 4. Shockwave Blast
    if (shockwaveRef.current) {
      const swScale = 1.0 + Math.pow(progress, 0.45) * 12.0
      shockwaveRef.current.scale.setScalar(swScale)
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1.0 - Math.pow(progress, 0.6))
    }

    // 5. Fire Lighting Flash
    if (fireLightRef.current) {
      const flash = Math.sin(progress * Math.PI) * (isCorrect ? 8.0 : 12.0) * (1.0 - progress)
      fireLightRef.current.intensity = Math.max(0, flash)
    }
  })

  const flameColor = isCorrect ? '#ffaa00' : isMiss ? '#888888' : '#ff4400'
  const sparkColor = isCorrect ? '#ffd700' : '#ffdd44'

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Fireball Core */}
      <instancedMesh ref={fireMeshRef} args={[undefined, undefined, FIRE_PARTICLES]}>
        <sphereGeometry args={[1.0, 7, 6]} />
        <meshStandardMaterial
          color={flameColor}
          emissive={flameColor}
          emissiveIntensity={3.5}
          roughness={0.2}
          transparent
          opacity={0.88}
        />
      </instancedMesh>

      {/* 2. Billowing Dark Smoke */}
      <instancedMesh ref={smokeMeshRef} args={[undefined, undefined, SMOKE_PARTICLES]}>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#1a1816"
          roughness={1.0}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </instancedMesh>

      {/* 3. Incandescent Flying Sparks */}
      <instancedMesh ref={sparkMeshRef} args={[undefined, undefined, SPARK_PARTICLES]}>
        <tetrahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial color={sparkColor} transparent opacity={0.95} />
      </instancedMesh>

      {/* 4. Shockwave Blast Ring */}
      <mesh ref={shockwaveRef} position={position.toArray()} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.8, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 5. Explosive Point Light Flash */}
      <pointLight
        ref={fireLightRef}
        position={position.toArray()}
        color={isCorrect ? '#ffbb22' : '#ff3300'}
        intensity={10}
        distance={28}
        decay={2}
      />
    </group>
  )
}
