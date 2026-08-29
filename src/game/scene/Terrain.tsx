import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GAME_CONFIG } from '@/game/gameConfig'

const CHASE_SPEED = 28.0
const TREE_COUNT = 120
const TERRAIN_ALTITUDE = -22.0

interface TreeTransform {
  x: number
  y: number
  z: number
  scale: number
}

interface TerrainProps {
  paused?: boolean
}

function multiNoise(x: number, z: number): number {
  let val = 0
  val += Math.sin(x * 0.018 + 0.8) * Math.cos(z * 0.018 + 1.2) * 0.55
  val += Math.sin(x * 0.042 + 2.1) * Math.cos(z * 0.038 + 0.4) * 0.28
  val += Math.sin(x * 0.09 + 1.4) * Math.cos(z * 0.085 + 2.5) * 0.12
  val += Math.sin(x * 0.18 + 3.2) * Math.cos(z * 0.17 + 1.1) * 0.05

  // Smooth natural undulating valley
  const normalized = (val + 1) / 2
  return 0.15 + normalized * 0.85
}

function getTerrainColor(normalized: number): [number, number, number] {
  if (normalized < 0.35) {
    // Deep alpine valley forest
    return [0.09, 0.24, 0.12]
  }
  if (normalized < 0.65) {
    // Evergreen rolling hills & meadows
    return [
      0.11 + (normalized - 0.35) * 0.10,
      0.28 + (normalized - 0.35) * 0.14,
      0.14 + (normalized - 0.35) * 0.08,
    ]
  }
  if (normalized < 0.85) {
    // Highland mountain slate & rocky ridges
    return [0.24, 0.26, 0.28]
  }
  // High mountain crest
  return [0.32, 0.34, 0.36]
}

function buildTerrainData(size: number, subdivisions: number, maxHeight: number) {
  const geo = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const validTreePositions: TreeTransform[] = []

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const n = multiNoise(x, z)
    const height = n * maxHeight

    pos.setY(i, height)

    const normalized = height / maxHeight
    const [r, g, b] = getTerrainColor(normalized)
    colors.push(r, g, b)

    // Pseudo-random placement for alpine pine trees
    const pseudoRand = Math.abs(Math.sin(x * 12.9898 + z * 78.233))
    if (
      normalized > 0.20 &&
      normalized < 0.70 &&
      Math.abs(x) > 6 &&
      validTreePositions.length < TREE_COUNT &&
      pseudoRand < 0.12
    ) {
      validTreePositions.push({
        x,
        y: height,
        z,
        scale: 1.0 + (pseudoRand * 10 % 1) * 0.8,
      })
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  return { geometry: geo, treeTransforms: validTreePositions }
}

/**
 * Ultra-Realistic High-Altitude Alpine Mountain Valley Terrain & Forest.
 * Helicopters fly high in the air (35-45 units altitude) with bird's-eye valley view.
 */
export function Terrain({ paused = false }: TerrainProps) {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)

  const size = GAME_CONFIG.world.terrainSize
  const subdivisions = GAME_CONFIG.world.terrainSubdivisions
  const maxHeight = 12.0

  const { geometry, treeTransforms } = useMemo(
    () => buildTerrainData(size, subdivisions, maxHeight),
    [size, subdivisions, maxHeight]
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
      {/* Solid Continuous Tile 1: Alpine Terrain */}
      <mesh
        ref={mesh1Ref}
        geometry={geometry}
        position={[0, TERRAIN_ALTITUDE, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.04}
          flatShading={false}
        />
      </mesh>

      {/* Solid Continuous Tile 2: Alpine Terrain */}
      <mesh
        ref={mesh2Ref}
        geometry={geometry}
        position={[0, TERRAIN_ALTITUDE, -size]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.04}
          flatShading={false}
        />
      </mesh>

      {/* Solid Bedrock Base Underneath */}
      <mesh position={[0, TERRAIN_ALTITUDE - 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial color="#0c1a0e" roughness={0.95} />
      </mesh>

      {/* Forest Trees Tile 1 */}
      <instancedMesh
        ref={forest1Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, TERRAIN_ALTITUDE, 0]}
        castShadow
      >
        <coneGeometry args={[1.2, 4.5, 6]} />
        <meshStandardMaterial color="#0e2311" roughness={0.92} />
      </instancedMesh>

      {/* Forest Trees Tile 2 */}
      <instancedMesh
        ref={forest2Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, TERRAIN_ALTITUDE, -size]}
        castShadow
      >
        <coneGeometry args={[1.2, 4.5, 6]} />
        <meshStandardMaterial color="#0e2311" roughness={0.92} />
      </instancedMesh>
    </group>
  )
}
