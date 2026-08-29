import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const CHASE_SPEED = 30.0
const TERRAIN_BASE_Y = -14.0 // Balanced aerial flight perspective
const TREE_COUNT = 95
const CHUNK_SIZE = 380 // Large 380-unit chunks extending 1100+ units into horizon

interface TreeTransform {
  x: number
  y: number
  z: number
  scale: number
}

interface TerrainProps {
  paused?: boolean
}

// Exact Reference Dogfight Color Palette
const PALETTE = {
  // Vibrant Coastal Water
  oceanBlue: [0.10, 0.36, 0.56] as [number, number, number],
  riverWater: [0.24, 0.58, 0.80] as [number, number, number],
  riverFoam: [0.90, 0.96, 1.00] as [number, number, number],
  sandyBeach: [0.86, 0.80, 0.62] as [number, number, number],

  // Farmland Patchwork (Right Side)
  cropGreen1: [0.24, 0.52, 0.16] as [number, number, number], // Lush crop
  cropGreen2: [0.32, 0.64, 0.22] as [number, number, number], // Bright meadow
  cropGreen3: [0.18, 0.40, 0.14] as [number, number, number], // Olive pasture
  cropWheatGold: [0.76, 0.66, 0.30] as [number, number, number], // Golden wheat
  cropHarvestTan: [0.60, 0.50, 0.26] as [number, number, number], // Harvest amber
  cropForest: [0.11, 0.28, 0.11] as [number, number, number], // Forest patch

  // Rolling Hills (Left Side)
  hillGreen: [0.22, 0.48, 0.16] as [number, number, number],
  hillCrestGreen: [0.28, 0.56, 0.20] as [number, number, number],
  rockSlate: [0.36, 0.35, 0.33] as [number, number, number],
}

/**
 * Creates neat, proportional 3D Low-Poly Conifer Pine Tree Geometry.
 */
function createRealisticPineTreeGeometry(): THREE.BufferGeometry {
  const trunkGeo = new THREE.CylinderGeometry(0.10, 0.14, 0.7, 5)
  trunkGeo.translate(0, 0.35, 0)

  const tier1 = new THREE.ConeGeometry(0.85, 1.1, 5)
  tier1.translate(0, 1.05, 0)

  const tier2 = new THREE.ConeGeometry(0.62, 0.9, 5)
  tier2.translate(0, 1.65, 0)

  const tier3 = new THREE.ConeGeometry(0.40, 0.7, 5)
  tier3.translate(0, 2.15, 0)

  const merged = mergeGeometries([trunkGeo, tier1, tier2, tier3], false)
  if (!merged) return new THREE.ConeGeometry(0.8, 2.2, 5)
  return merged
}

/**
 * Natural River & Organic Patchwork Farmland Elevation Generator.
 */
function getElevationAndColor(x: number, z: number): { height: number; color: [number, number, number] } {
  const islandCoastline = 92.0 + Math.sin(z * 0.03) * 6.0
  const absX = Math.abs(x)

  // 1. Surrounding Ocean
  if (absX > islandCoastline) {
    const oceanSlope = Math.min(3.5, (absX - islandCoastline) * 0.45)
    return { height: -oceanSlope, color: PALETTE.oceanBlue }
  }

  // 2. Sandy Beaches along ocean coast
  if (absX > islandCoastline - 4.5) {
    return { height: 0.15, color: PALETTE.sandyBeach }
  }

  // 3. Central S-Curved Winding River (Gentle surface level)
  const riverCenter = Math.sin(z * 0.028) * 11.0 + Math.sin(z * 0.065) * 3.5
  const distToRiver = Math.abs(x - riverCenter)

  if (distToRiver < 3.8) {
    // Shimmering blue water surface
    const wave = Math.sin(x * 3.0 + z * 2.0) * 0.5 + 0.5
    const col = wave > 0.65 ? PALETTE.riverFoam : PALETTE.riverWater
    return { height: 0.0, color: col }
  }
  if (distToRiver < 5.8) {
    // Gentle sandy riverbank sloping slightly up
    const bankT = (distToRiver - 3.8) / 2.0
    return { height: 0.1 + bankT * 0.3, color: PALETTE.sandyBeach }
  }

  // 4. Left Side: Smooth Rolling Green Hills
  if (x < riverCenter - 5.8) {
    const hillDist = Math.abs(x - riverCenter + 5.8)
    const hillNoise = Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.035 + 0.8) * 2.0 +
                      Math.sin(x * 0.08 + z * 0.07) * 0.8
    const hillHeight = Math.max(0.4, 0.8 + (hillDist * 0.06) + hillNoise)

    let hillColor = PALETTE.hillGreen
    if (hillHeight > 3.2) {
      hillColor = PALETTE.rockSlate
    } else if (hillHeight > 2.0) {
      hillColor = PALETTE.hillCrestGreen
    }
    return { height: hillHeight, color: hillColor }
  }

  // 5. Right Side: Organic Patchwork Farmland Plots
  const jitterX = Math.sin(z * 0.08) * 2.5
  const jitterZ = Math.sin(x * 0.08) * 2.5
  const cellSizeX = 14.0
  const cellSizeZ = 16.0
  const cellX = Math.floor((x + jitterX + 200) / cellSizeX)
  const cellZ = Math.floor((z + jitterZ + 3000) / cellSizeZ)
  const cellHash = Math.abs(Math.sin(cellX * 31.7 + cellZ * 73.9))

  const farmUndulation = Math.sin(x * 0.03) * Math.cos(z * 0.025) * 0.8
  const farmHeight = Math.max(0.4, 0.7 + farmUndulation)

  let plotColor = PALETTE.cropGreen1
  if (cellHash < 0.22) {
    plotColor = PALETTE.cropGreen2
  } else if (cellHash < 0.42) {
    plotColor = PALETTE.cropWheatGold
  } else if (cellHash < 0.60) {
    plotColor = PALETTE.cropHarvestTan
  } else if (cellHash < 0.78) {
    plotColor = PALETTE.cropGreen3
  } else {
    plotColor = PALETTE.cropForest
  }

  return { height: farmHeight, color: plotColor }
}

function buildCoastalIslandData(size: number, subdivisions: number) {
  const geo = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const validTreePositions: TreeTransform[] = []

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)

    const { height, color } = getElevationAndColor(x, z)
    pos.setY(i, height)
    colors.push(color[0], color[1], color[2])

    // Balanced tree distribution across Left hills, Center riverbank, and Right farmland plots
    const absX = Math.abs(x)
    const riverCenter = Math.sin(z * 0.028) * 11.0 + Math.sin(z * 0.065) * 3.5
    const distToRiver = Math.abs(x - riverCenter)
    const treePseudo = Math.abs(Math.sin(x * 53.7 + z * 97.3))

    const isLeftHillZone = (x < riverCenter - 8.0 && height > 0.6 && height < 3.0)
    const isRiverbankZone = (distToRiver > 4.8 && distToRiver < 8.2)
    const isRightFarmZone = (x > riverCenter + 8.0 && absX < 80.0)

    const isTreeZone = isLeftHillZone || isRiverbankZone || isRightFarmZone

    if (
      isTreeZone &&
      absX < 82 &&
      distToRiver > 4.5 && // Never inside the water
      treePseudo < 0.065 &&
      validTreePositions.length < TREE_COUNT
    ) {
      validTreePositions.push({
        x,
        y: height,
        z,
        scale: 0.70 + (treePseudo * 10 % 1) * 0.35,
      })
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  return { geometry: geo, treeTransforms: validTreePositions }
}

/**
 * Exact Wings/Dogfight Coastal Island World with 3-Chunk Seamless Horizon Conveyor.
 * Ground extends 1100+ units into the horizon so the user NEVER sees the ground end or spawn late.
 */
export function Terrain({ paused = false }: TerrainProps) {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const mesh3Ref = useRef<THREE.Mesh>(null)

  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)
  const forest3Ref = useRef<THREE.InstancedMesh>(null)

  const size = CHUNK_SIZE
  const subdivisions = 96

  const pineTreeGeo = useMemo(() => createRealisticPineTreeGeometry(), [])

  const { geometry, treeTransforms } = useMemo(
    () => buildCoastalIslandData(size, subdivisions),
    [size, subdivisions]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (paused) return
    const meshes = [mesh1Ref.current, mesh2Ref.current, mesh3Ref.current]
    const forests = [forest1Ref.current, forest2Ref.current, forest3Ref.current]

    if (!meshes[0] || !meshes[1] || !meshes[2]) return

    // Move all 3 chunks forward
    meshes.forEach((mesh) => {
      if (mesh) mesh.position.z += CHASE_SPEED * delta
    })

    // Seamless Infinite Conveyor Loop:
    // If any chunk crosses behind the camera (z >= size), move it far back ahead of all chunks
    meshes.forEach((mesh) => {
      if (mesh && mesh.position.z >= size) {
        let minZ = Infinity
        meshes.forEach((m) => {
          if (m && m !== mesh && m.position.z < minZ) minZ = m.position.z
        })
        mesh.position.z = minZ - size
      }
    })

    // Sync tree instances with terrain chunks
    forests.forEach((forest, chunkIdx) => {
      const parentMesh = meshes[chunkIdx]
      if (forest && parentMesh) {
        forest.position.z = parentMesh.position.z

        treeTransforms.forEach((t, i) => {
          dummy.position.set(t.x, t.y, t.z)
          dummy.scale.setScalar(t.scale)
          dummy.rotation.y = (i * 1.3) % (Math.PI * 2)
          dummy.updateMatrix()
          forest.setMatrixAt(i, dummy.matrix)
        })
        forest.instanceMatrix.needsUpdate = true
      }
    })
  })

  return (
    <group>
      {/* Chunk 1: Near / Mid Ground */}
      <mesh
        ref={mesh1Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.70}
          metalness={0.04}
          flatShading={true}
        />
      </mesh>

      {/* Chunk 2: Mid / Ahead Ground */}
      <mesh
        ref={mesh2Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, -size]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.70}
          metalness={0.04}
          flatShading={true}
        />
      </mesh>

      {/* Chunk 3: Deep Horizon Pre-Spawn Buffer (z = -760) */}
      <mesh
        ref={mesh3Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, -size * 2]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.70}
          metalness={0.04}
          flatShading={true}
        />
      </mesh>

      {/* Endless Vibrant Coastal Blue Ocean Plane */}
      <mesh position={[0, TERRAIN_BASE_Y - 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial
          color="#1b5a86"
          roughness={0.10}
          metalness={0.88}
        />
      </mesh>

      {/* Pine Trees Chunk 1 */}
      <instancedMesh
        ref={forest1Ref}
        args={[pineTreeGeo, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, 0]}
        castShadow
      >
        <meshStandardMaterial color="#184a1a" roughness={0.80} flatShading={true} />
      </instancedMesh>

      {/* Pine Trees Chunk 2 */}
      <instancedMesh
        ref={forest2Ref}
        args={[pineTreeGeo, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size]}
        castShadow
      >
        <meshStandardMaterial color="#184a1a" roughness={0.80} flatShading={true} />
      </instancedMesh>

      {/* Pine Trees Chunk 3 */}
      <instancedMesh
        ref={forest3Ref}
        args={[pineTreeGeo, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size * 2]}
        castShadow
      >
        <meshStandardMaterial color="#184a1a" roughness={0.80} flatShading={true} />
      </instancedMesh>
    </group>
  )
}
