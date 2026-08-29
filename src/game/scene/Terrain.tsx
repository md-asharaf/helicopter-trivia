import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const CHASE_SPEED = 32.0
const TREE_COUNT = 140
const TERRAIN_BASE_Y = -6.0

interface TreeTransform {
  x: number
  y: number
  z: number
  scale: number
}

interface TerrainProps {
  paused?: boolean
}

// Low-Poly Patchwork Palette (Matching the reference dogfight game)
const PALETTE = {
  ocean: [0.08, 0.28, 0.44] as [number, number, number],
  sand: [0.82, 0.76, 0.56] as [number, number, number],
  cropGreen1: [0.28, 0.48, 0.20] as [number, number, number],
  cropGreen2: [0.22, 0.38, 0.16] as [number, number, number],
  cropGreen3: [0.36, 0.56, 0.24] as [number, number, number],
  cropGold: [0.55, 0.52, 0.26] as [number, number, number],
  forest: [0.13, 0.26, 0.11] as [number, number, number],
  cliffRock: [0.34, 0.36, 0.34] as [number, number, number],
  riverWater: [0.12, 0.34, 0.48] as [number, number, number],
}

function getElevationAndColor(x: number, z: number): { height: number; color: [number, number, number] } {
  const islandHalfWidth = 62.0
  const absX = Math.abs(x)

  // 1. Ocean beyond island borders
  if (absX > islandHalfWidth) {
    const depth = Math.min(6.0, (absX - islandHalfWidth) * 0.8)
    return { height: -depth, color: PALETTE.ocean }
  }

  // 2. Sandy beach coastlines
  if (absX > islandHalfWidth - 4.5) {
    return { height: 0.3, color: PALETTE.sand }
  }

  // 3. Central winding river channel
  const riverCenter = Math.sin(z * 0.035) * 6.5
  const distToRiver = Math.abs(x - riverCenter)

  if (distToRiver < 3.2) {
    return { height: -0.8, color: PALETTE.riverWater }
  }
  if (distToRiver < 5.5) {
    return { height: 0.2, color: PALETTE.sand }
  }

  // 4. Left side: Elevated Mountain Ridge & Coastal Cliffs
  if (x < -12) {
    const ridgeNoise = Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 4.5 +
                       Math.sin(x * 0.11 + z * 0.09) * 2.2
    const cliffHeight = Math.max(1.5, 4.0 + ridgeNoise)
    const isSteep = (cliffHeight > 6.5)
    return {
      height: cliffHeight,
      color: isSteep ? PALETTE.cliffRock : PALETTE.cropGreen2,
    }
  }

  // 5. Right side: Patchwork Agricultural Farmland
  const fieldGridX = Math.floor((x + 100) / 12)
  const fieldGridZ = Math.floor((z + 1000) / 14)
  const plotSeed = Math.abs(Math.sin(fieldGridX * 19.3 + fieldGridZ * 71.7))

  const farmNoise = Math.sin(x * 0.03) * Math.cos(z * 0.025) * 1.8 +
                    Math.sin(x * 0.08 + z * 0.07) * 0.8
  const farmHeight = Math.max(0.6, 2.2 + farmNoise)

  let plotColor = PALETTE.cropGreen1
  if (plotSeed < 0.25) {
    plotColor = PALETTE.cropGreen2
  } else if (plotSeed < 0.50) {
    plotColor = PALETTE.cropGreen3
  } else if (plotSeed < 0.75) {
    plotColor = PALETTE.cropGold
  } else {
    plotColor = PALETTE.forest
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

    // Place low-poly pine trees in forest clusters
    const absX = Math.abs(x)
    const treePseudo = Math.abs(Math.sin(x * 37.1 + z * 83.9))
    if (
      height > 1.2 &&
      height < 7.5 &&
      absX < 56 &&
      treePseudo < 0.11 &&
      validTreePositions.length < TREE_COUNT
    ) {
      validTreePositions.push({
        x,
        y: height,
        z,
        scale: 0.9 + (treePseudo * 10 % 1) * 0.6,
      })
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  return { geometry: geo, treeTransforms: validTreePositions }
}

/**
 * Wings / War Brokers Dogfight Coastal Island & Ocean World.
 * Flat-shaded patchwork agricultural fields, winding river, coastal cliffs, and vast ocean.
 */
export function Terrain({ paused = false }: TerrainProps) {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)

  const size = 320
  const subdivisions = 80

  const { geometry, treeTransforms } = useMemo(
    () => buildCoastalIslandData(size, subdivisions),
    [size, subdivisions]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_state, delta) => {
    if (paused) return
    if (!mesh1Ref.current || !mesh2Ref.current) return

    mesh1Ref.current.position.z += CHASE_SPEED * delta
    mesh2Ref.current.position.z += CHASE_SPEED * delta

    if (mesh1Ref.current.position.z >= size) {
      mesh1Ref.current.position.z = mesh2Ref.current.position.z - size
    }
    if (mesh2Ref.current.position.z >= size) {
      mesh2Ref.current.position.z = mesh1Ref.current.position.z - size
    }

    // Sync tree chunks with terrain chunks
    if (forest1Ref.current && forest2Ref.current) {
      forest1Ref.current.position.z = mesh1Ref.current.position.z
      forest2Ref.current.position.z = mesh2Ref.current.position.z

      treeTransforms.forEach((t, i) => {
        dummy.position.set(t.x, t.y, t.z)
        dummy.scale.setScalar(t.scale)
        dummy.rotation.y = (i * 1.3) % (Math.PI * 2)
        dummy.updateMatrix()
        forest1Ref.current!.setMatrixAt(i, dummy.matrix)
        forest2Ref.current!.setMatrixAt(i, dummy.matrix)
      })
      forest1Ref.current.instanceMatrix.needsUpdate = true
      forest2Ref.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Tile 1: Patchwork Farmland & Coastal Cliffs Island */}
      <mesh
        ref={mesh1Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.72}
          metalness={0.04}
          flatShading={true}
        />
      </mesh>

      {/* Tile 2: Patchwork Farmland & Coastal Cliffs Island */}
      <mesh
        ref={mesh2Ref}
        geometry={geometry}
        position={[0, TERRAIN_BASE_Y, -size]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.72}
          metalness={0.04}
          flatShading={true}
        />
      </mesh>

      {/* Endless Deep Blue Ocean Plane with Specular Sunlight Reflection */}
      <mesh position={[0, TERRAIN_BASE_Y - 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial
          color="#113d60"
          roughness={0.12}
          metalness={0.88}
        />
      </mesh>

      {/* Forest Trees Tile 1 (Low-poly pine clusters) */}
      <instancedMesh
        ref={forest1Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, 0]}
        castShadow
      >
        <coneGeometry args={[1.2, 3.8, 5]} />
        <meshStandardMaterial color="#1a3b16" roughness={0.85} flatShading={true} />
      </instancedMesh>

      {/* Forest Trees Tile 2 (Low-poly pine clusters) */}
      <instancedMesh
        ref={forest2Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, TERRAIN_BASE_Y, -size]}
        castShadow
      >
        <coneGeometry args={[1.2, 3.8, 5]} />
        <meshStandardMaterial color="#1a3b16" roughness={0.85} flatShading={true} />
      </instancedMesh>
    </group>
  )
}
