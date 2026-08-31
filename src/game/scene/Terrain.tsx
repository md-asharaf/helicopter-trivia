import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const CHASE_SPEED = 32.0
const TERRAIN_BASE_Y = -14.0
const TREE_COUNT = 130
const ROCK_COUNT = 45
const CHUNK_SIZE = 420

interface TreeTransform {
  x: number
  y: number
  z: number
  scale: number
  rotY: number
}

interface RockTransform {
  x: number
  y: number
  z: number
  scale: number
  rotX: number
  rotY: number
}

interface TerrainProps {
  paused?: boolean
}

// Photorealistic Alpine Canyon Color Palette
const ALPINE_PALETTE = {
  // Glacier River & Coast
  deepRiver: [0.05, 0.42, 0.58] as [number, number, number],
  shallowRiver: [0.12, 0.58, 0.72] as [number, number, number],
  riverFoam: [0.92, 0.97, 1.00] as [number, number, number],
  riverSand: [0.78, 0.72, 0.56] as [number, number, number],
  wetPebbles: [0.42, 0.44, 0.42] as [number, number, number],

  // Valley & Alpine Meadows
  lushMeadow: [0.18, 0.48, 0.16] as [number, number, number],
  brightGrass: [0.26, 0.58, 0.20] as [number, number, number],
  forestGreen: [0.10, 0.32, 0.12] as [number, number, number],
  mossPatch: [0.22, 0.42, 0.14] as [number, number, number],

  // Mountain Cliffs & Rocky Ridges
  cliffSlate: [0.34, 0.35, 0.36] as [number, number, number],
  cragDark: [0.22, 0.24, 0.26] as [number, number, number],
  graniteHigh: [0.45, 0.46, 0.48] as [number, number, number],

  // High Altitude Glacier Snow / Frost
  snowGlacier: [0.92, 0.95, 0.98] as [number, number, number],
  snowCrevice: [0.75, 0.82, 0.90] as [number, number, number],
}

/**
 * Creates multi-tier realistic Low-Poly Conifer Pine Tree Geometry.
 */
function createRealisticPineTreeGeometry(): THREE.BufferGeometry {
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.8, 6)
  trunkGeo.translate(0, 0.4, 0)

  const tier1 = new THREE.ConeGeometry(1.05, 1.3, 6)
  tier1.translate(0, 1.25, 0)

  const tier2 = new THREE.ConeGeometry(0.82, 1.1, 6)
  tier2.translate(0, 1.95, 0)

  const tier3 = new THREE.ConeGeometry(0.58, 0.9, 6)
  tier3.translate(0, 2.55, 0)

  const tier4 = new THREE.ConeGeometry(0.32, 0.7, 6)
  tier4.translate(0, 3.05, 0)

  const merged = mergeGeometries([trunkGeo, tier1, tier2, tier3, tier4], false)
  if (!merged) return new THREE.ConeGeometry(1.0, 3.0, 6)
  return merged
}

/**
 * Creates jagged natural alpine boulder geometry.
 */
function createRockGeometry(): THREE.BufferGeometry {
  const geo = new THREE.DodecahedronGeometry(1.0, 1)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i)
    const vy = pos.getY(i)
    const vz = pos.getZ(i)
    const noise = 1.0 + Math.sin(vx * 4.0 + vy * 3.0) * 0.18 + Math.cos(vz * 5.0) * 0.14
    pos.setXYZ(i, vx * noise, vy * (noise * 0.8), vz * noise)
  }
  geo.computeVertexNormals()
  return geo
}

/**
 * Procedural Alpine Mountain Valley & Glacier River Elevation Formula.
 */
function getAlpineElevationAndColor(x: number, z: number): { height: number; color: [number, number, number] } {
  const absX = Math.abs(x)

  // S-curved Glacier Canyon River
  const riverCenter = Math.sin(z * 0.022) * 14.0 + Math.sin(z * 0.055) * 5.0
  const distToRiver = Math.abs(x - riverCenter)

  // 1. Glacier River Bed & Shimmering Blue Flow
  if (distToRiver < 4.2) {
    const wave = Math.sin(x * 2.5 + z * 1.8) * 0.5 + 0.5
    const col = wave > 0.7 ? ALPINE_PALETTE.riverFoam : wave > 0.35 ? ALPINE_PALETTE.shallowRiver : ALPINE_PALETTE.deepRiver
    return { height: 0.0, color: col }
  }

  // 2. Wet Pebbled Riverbank & Sandy Shore
  if (distToRiver < 6.8) {
    const bankT = (distToRiver - 4.2) / 2.6
    const col = bankT > 0.5 ? ALPINE_PALETTE.riverSand : ALPINE_PALETTE.wetPebbles
    return { height: 0.15 + bankT * 0.45, color: col }
  }

  // 3. Valley Basin (Near River Meadows)
  const valleyWidth = 32.0
  const valleyDist = distToRiver - 6.8

  if (valleyDist < valleyWidth) {
    const meadowNoise = Math.sin(x * 0.06) * Math.cos(z * 0.05) * 0.6 + Math.sin(x * 0.12 + z * 0.1) * 0.25
    const meadowH = 0.6 + (valleyDist / valleyWidth) * 1.8 + meadowNoise
    const col = meadowH > 1.8 ? ALPINE_PALETTE.forestGreen : meadowH > 1.0 ? ALPINE_PALETTE.lushMeadow : ALPINE_PALETTE.brightGrass
    return { height: meadowH, color: col }
  }

  // 4. Flanking Majestic Alpine Mountain Ridges (Left & Right Peaks)
  const mountainDist = valleyDist - valleyWidth
  const ridgeNoise1 = Math.sin(x * 0.035 + 0.8) * Math.cos(z * 0.028 + 0.4) * 4.8
  const ridgeNoise2 = Math.sin(x * 0.07 + z * 0.06) * 2.2
  const cragNoise = Math.sin(x * 0.15 + z * 0.18) * 0.8

  const baseSlope = mountainDist * 0.14
  let mountainH = Math.max(1.8, 2.4 + baseSlope + ridgeNoise1 + ridgeNoise2 + cragNoise)

  // Outer Edge Taper (Left & Right ends fade smoothly into the ocean water without abrupt cuts)
  if (absX > 130) {
    const taperProgress = Math.min(1.0, (absX - 130) / 45.0)
    mountainH = THREE.MathUtils.lerp(mountainH, -0.4, taperProgress)
    if (mountainH < 0.2) {
      return { height: mountainH, color: ALPINE_PALETTE.riverSand }
    }
    return { height: mountainH, color: ALPINE_PALETTE.graniteHigh }
  }

  // Elevation-Based Realistic Biome Coloring
  if (mountainH > 7.5) {
    // Snow-capped Glacier Peak
    const snowBleed = Math.sin(x * 0.3 + z * 0.2) * 0.4
    return { height: mountainH, color: mountainH + snowBleed > 8.2 ? ALPINE_PALETTE.snowGlacier : ALPINE_PALETTE.snowCrevice }
  }
  if (mountainH > 5.2) {
    // Rugged Slate & Basalt Cliffs
    return { height: mountainH, color: ALPINE_PALETTE.graniteHigh }
  }
  if (mountainH > 3.4) {
    // Rocky Cliff Transition with Mountain Shrubbery
    const rockVar = Math.sin(x * 0.2 + z * 0.2) > 0 ? ALPINE_PALETTE.cliffSlate : ALPINE_PALETTE.cragDark
    return { height: mountainH, color: rockVar }
  }

  // Dense Pine Forest Slope
  const col = Math.sin(x * 0.1 + z * 0.1) > 0.2 ? ALPINE_PALETTE.forestGreen : ALPINE_PALETTE.mossPatch
  return { height: mountainH, color: col }
}

function buildAlpineTerrainChunkData(size: number, subdivisions: number) {
  const geo = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const validTreePositions: TreeTransform[] = []
  const validRockPositions: RockTransform[] = []

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)

    const { height, color } = getAlpineElevationAndColor(x, z)
    pos.setY(i, height)
    colors.push(color[0], color[1], color[2])

    // Procedural Tree & Rock Placement
    const riverCenter = Math.sin(z * 0.022) * 14.0 + Math.sin(z * 0.055) * 5.0
    const distToRiver = Math.abs(x - riverCenter)
    const pseudo = Math.abs(Math.sin(x * 61.7 + z * 93.3))
    const absX = Math.abs(x)

    // Tree placement along river meadows & pine slopes (height: 0.8 to 5.0, within safe boundaries)
    const isTreeZone = distToRiver > 6.2 && height > 0.6 && height < 5.4 && absX < 105
    if (isTreeZone && pseudo < 0.075 && validTreePositions.length < TREE_COUNT) {
      validTreePositions.push({
        x,
        y: height,
        z,
        scale: 0.75 + (pseudo * 10 % 1) * 0.45,
        rotY: pseudo * Math.PI * 2,
      })
    }

    // Rock boulders along riverbanks and rocky ledges
    const isRockZone = (distToRiver > 4.8 && distToRiver < 7.5) || (height > 3.8 && height < 7.0)
    if (isRockZone && absX < 110 && pseudo > 0.88 && validRockPositions.length < ROCK_COUNT) {
      validRockPositions.push({
        x,
        y: height + 0.2,
        z,
        scale: 0.5 + (pseudo * 10 % 1) * 0.6,
        rotX: pseudo * Math.PI,
        rotY: pseudo * Math.PI * 2,
      })
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  return {
    geometry: geo,
    treeTransforms: validTreePositions,
    rockTransforms: validRockPositions,
  }
}

/**
 * Majestic Alpine Mountain Canyon World with 3-Chunk Seamless Horizon Conveyor (SKILL.md Law 1 & 3).
 * Extends 1200+ units into the horizon with realistic alpine mountains, conifer pine forests,
 * and shimmering glacier river waters.
 */
export function Terrain({ paused = false }: TerrainProps) {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const mesh3Ref = useRef<THREE.Mesh>(null)

  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)
  const forest3Ref = useRef<THREE.InstancedMesh>(null)

  const rock1Ref = useRef<THREE.InstancedMesh>(null)
  const rock2Ref = useRef<THREE.InstancedMesh>(null)
  const rock3Ref = useRef<THREE.InstancedMesh>(null)

  const riverWaterRef = useRef<THREE.Mesh>(null)

  const size = CHUNK_SIZE
  const subdivisions = 110

  const pineTreeGeo = useMemo(() => createRealisticPineTreeGeometry(), [])
  const rockGeo = useMemo(() => createRockGeometry(), [])

  const { geometry, treeTransforms, rockTransforms } = useMemo(
    () => buildAlpineTerrainChunkData(size, subdivisions),
    [size, subdivisions]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }, delta) => {
    if (paused) return
    const dt = Math.min(delta, 0.1)
    const t = clock.getElapsedTime()

    const meshes = [mesh1Ref.current, mesh2Ref.current, mesh3Ref.current]
    const forests = [forest1Ref.current, forest2Ref.current, forest3Ref.current]
    const rocks = [rock1Ref.current, rock2Ref.current, rock3Ref.current]

    if (!meshes[0] || !meshes[1] || !meshes[2]) return

    // Move all 3 chunks forward
    meshes.forEach((mesh) => {
      if (mesh) mesh.position.z += CHASE_SPEED * dt
    })

    // Seamless Conveyor Loop:
    // If any chunk crosses behind camera (z >= size), move it far back ahead of all chunks
    meshes.forEach((mesh) => {
      if (mesh && mesh.position.z >= size) {
        let minZ = Infinity
        meshes.forEach((m) => {
          if (m && m !== mesh && m.position.z < minZ) minZ = m.position.z
        })
        mesh.position.z = minZ - size
      }
    })

    // Sync tree instances with terrain chunks + subtle wind sway
    forests.forEach((forest, chunkIdx) => {
      const parentMesh = meshes[chunkIdx]
      if (forest && parentMesh) {
        forest.position.z = parentMesh.position.z

        treeTransforms.forEach((tr, i) => {
          const sway = Math.sin(t * 2.5 + tr.x * 0.1) * 0.03
          dummy.position.set(tr.x, tr.y, tr.z)
          dummy.scale.setScalar(tr.scale)
          dummy.rotation.set(sway, tr.rotY, sway * 0.5)
          dummy.updateMatrix()
          forest.setMatrixAt(i, dummy.matrix)
        })
        forest.instanceMatrix.needsUpdate = true
      }
    })

    // Sync rock instances
    rocks.forEach((rockMesh, chunkIdx) => {
      const parentMesh = meshes[chunkIdx]
      if (rockMesh && parentMesh) {
        rockMesh.position.z = parentMesh.position.z

        rockTransforms.forEach((rk, i) => {
          dummy.position.set(rk.x, rk.y, rk.z)
          dummy.scale.setScalar(rk.scale)
          dummy.rotation.set(rk.rotX, rk.rotY, 0)
          dummy.updateMatrix()
          rockMesh.setMatrixAt(i, dummy.matrix)
        })
        rockMesh.instanceMatrix.needsUpdate = true
      }
    })

    // Animate shimmering glacier river water
    if (riverWaterRef.current) {
      const mat = riverWaterRef.current.material as THREE.MeshStandardMaterial
      mat.roughness = 0.12 + Math.sin(t * 2.0) * 0.04
    }
  })

  return (
    <group>
      {/* Chunk 1: Near / Mid Ground */}
      <mesh
        ref={mesh1Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.68}
          metalness={0.06}
          flatShading
        />
      </mesh>

      {/* Chunk 2: Mid / Ahead Ground */}
      <mesh
        ref={mesh2Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, -size]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.68}
          metalness={0.06}
          flatShading
        />
      </mesh>

      {/* Chunk 3: Deep Horizon Horizon Buffer (z = -840) */}
      <mesh
        ref={mesh3Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, -size * 2]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.68}
          metalness={0.06}
          flatShading
        />
      </mesh>

      {/* Endless Shimmering Glacier River & Coastal Ocean Plane */}
      <mesh
        ref={riverWaterRef}
        position={[0, TERRAIN_BASE_Y - 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial
          color="#087f9c"
          roughness={0.14}
          metalness={0.88}
        />
      </mesh>

      {/* ─── PINE FOREST INSTANCES (3 CHUNKS) ─────────────────────────── */}
      <instancedMesh
        ref={forest1Ref}
        args={[pineTreeGeo, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, 0]}
        castShadow
      >
        <meshStandardMaterial color="#143c16" roughness={0.78} flatShading />
      </instancedMesh>

      <instancedMesh
        ref={forest2Ref}
        args={[pineTreeGeo, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size]}
        castShadow
      >
        <meshStandardMaterial color="#143c16" roughness={0.78} flatShading />
      </instancedMesh>

      <instancedMesh
        ref={forest3Ref}
        args={[pineTreeGeo, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size * 2]}
        castShadow
      >
        <meshStandardMaterial color="#143c16" roughness={0.78} flatShading />
      </instancedMesh>

      {/* ─── ROCK BOULDER INSTANCES (3 CHUNKS) ───────────────────────── */}
      <instancedMesh
        ref={rock1Ref}
        args={[rockGeo, undefined, rockTransforms.length]}
        position={[0, TERRAIN_BASE_Y, 0]}
        castShadow
      >
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </instancedMesh>

      <instancedMesh
        ref={rock2Ref}
        args={[rockGeo, undefined, rockTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size]}
        castShadow
      >
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </instancedMesh>

      <instancedMesh
        ref={rock3Ref}
        args={[rockGeo, undefined, rockTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size * 2]}
        castShadow
      >
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  )
}
