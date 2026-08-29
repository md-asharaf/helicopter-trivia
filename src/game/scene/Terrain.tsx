import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GAME_CONFIG } from '@/game/gameConfig'

const CHASE_SPEED = 28.0
const TREE_COUNT = 90

interface TreeTransform {
  x: number
  y: number
  z: number
  scale: number
}

interface TerrainProps {
  paused?: boolean
}

/**
 * Procedural Satellite Orthophoto Texture Generator (USGS / Sentinel style).
 * Generates 1024x1024 aerial satellite photography texture with forest canopy,
 * rock striations, and alpine soil.
 */
function createSatelliteOrthophotoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Base earth tone
  ctx.fillStyle = '#1c281e'
  ctx.fillRect(0, 0, 512, 512)

  const imgData = ctx.getImageData(0, 0, 512, 512)
  const data = imgData.data

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4

      // Multi-scale satellite noise
      const n1 = Math.sin(x * 0.04) * Math.cos(y * 0.04) * 0.5 + 0.5
      const n2 = Math.sin(x * 0.12 + 1.2) * Math.cos(y * 0.14 + 0.8) * 0.3
      const n3 = (Math.sin(x * 0.35) * Math.cos(y * 0.35)) * 0.2
      const noise = Math.min(1, Math.max(0, n1 + n2 + n3))

      // Satellite palette: Evergreen forest, highland moss, rock ridge
      let r = 24, g = 48, b = 28

      if (noise < 0.35) {
        // Deep spruce forest canopy
        r = 16 + noise * 18
        g = 36 + noise * 24
        b = 20 + noise * 16
      } else if (noise < 0.7) {
        // Alpine grassy slopes & moss
        r = 32 + (noise - 0.35) * 35
        g = 62 + (noise - 0.35) * 45
        b = 30 + (noise - 0.35) * 20
      } else {
        // Exposed rock crags & slate
        r = 55 + (noise - 0.7) * 30
        g = 58 + (noise - 0.7) * 28
        b = 60 + (noise - 0.7) * 25
      }

      data[idx] = Math.round(r)
      data[idx + 1] = Math.round(g)
      data[idx + 2] = Math.round(b)
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(10, 10)
  texture.needsUpdate = true
  return texture
}

function multiNoise(x: number, z: number): number {
  let val = 0
  val += Math.sin(x * 0.025 + 0.8) * Math.cos(z * 0.025 + 1.2) * 0.55
  val += Math.sin(x * 0.055 + 2.1) * Math.cos(z * 0.05 + 0.4) * 0.28
  val += Math.sin(x * 0.12 + 1.4) * Math.cos(z * 0.11 + 2.5) * 0.12
  val += Math.sin(x * 0.25 + 3.2) * Math.cos(z * 0.24 + 1.1) * 0.05

  // Canyon carve down the middle
  const riverDist = Math.abs(x) / 32.0
  const riverFactor = Math.min(1.0, riverDist)
  return ((val + 1) / 2) * (0.35 + 0.65 * riverFactor)
}

function getTerrainColor(normalized: number): [number, number, number] {
  if (normalized < 0.14) {
    // Riverbed sand & pebbles
    return [0.36, 0.38, 0.32]
  }
  if (normalized < 0.35) {
    // Rich green valley meadows
    return [0.12, 0.36, 0.16]
  }
  if (normalized < 0.65) {
    // Evergreen alpine hillside
    return [
      0.15 + (normalized - 0.35) * 0.12,
      0.34 + (normalized - 0.35) * 0.14,
      0.18 + (normalized - 0.35) * 0.10,
    ]
  }
  if (normalized < 0.85) {
    // Rocky mountain slate
    return [0.26, 0.30, 0.32]
  }
  // High mountain crest
  return [0.32, 0.35, 0.38]
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

    // Deterministic pseudo-random placement for trees based on coordinates
    const pseudoRand = Math.abs(Math.sin(x * 12.9898 + z * 78.233))
    if (
      normalized > 0.18 &&
      normalized < 0.70 &&
      Math.abs(x) > 5.5 &&
      validTreePositions.length < TREE_COUNT &&
      pseudoRand < 0.10
    ) {
      validTreePositions.push({
        x,
        y: height,
        z,
        scale: 0.75 + (pseudoRand * 10 % 1) * 0.65,
      })
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  return { geometry: geo, treeTransforms: validTreePositions }
}

/**
 * Ultra-Realistic High-Speed Alpine Mountain Terrain with Satellite Orthophoto Texture,
 * Specular Reflective Water River & Streaming Forest.
 */
export function Terrain({ paused = false }: TerrainProps) {
  const mesh1Ref = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)
  const river1Ref = useRef<THREE.Mesh>(null)
  const river2Ref = useRef<THREE.Mesh>(null)
  const forest1Ref = useRef<THREE.InstancedMesh>(null)
  const forest2Ref = useRef<THREE.InstancedMesh>(null)

  const size = GAME_CONFIG.world.terrainSize
  const subdivisions = GAME_CONFIG.world.terrainSubdivisions
  const maxHeight = 15.0

  const satelliteTexture = useMemo(() => createSatelliteOrthophotoTexture(), [])

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

    if (river1Ref.current && river2Ref.current) {
      river1Ref.current.position.z = mesh1Ref.current.position.z
      river2Ref.current.position.z = mesh2Ref.current.position.z
    }

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
      {/* Tile 1: Alpine Terrain with Satellite Orthophoto Texture */}
      <mesh
        ref={mesh1Ref}
        geometry={geometry}
        position={[0, -4, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={satelliteTexture}
          vertexColors
          roughness={0.78}
          metalness={0.06}
          flatShading={false}
        />
      </mesh>

      {/* Tile 2: Alpine Terrain with Satellite Orthophoto Texture */}
      <mesh
        ref={mesh2Ref}
        geometry={geometry}
        position={[0, -4, -size]}
        receiveShadow
      >
        <meshStandardMaterial
          map={satelliteTexture}
          vertexColors
          roughness={0.78}
          metalness={0.06}
          flatShading={false}
        />
      </mesh>

      {/* Specular Reflective Canyon River Tile 1 */}
      <mesh
        ref={river1Ref}
        position={[0, -2.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, size]} />
        <meshStandardMaterial
          color="#062e45"
          roughness={0.12}
          metalness={0.88}
          transparent
          opacity={0.90}
        />
      </mesh>

      {/* Specular Reflective Canyon River Tile 2 */}
      <mesh
        ref={river2Ref}
        position={[0, -2.4, -size]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, size]} />
        <meshStandardMaterial
          color="#062e45"
          roughness={0.12}
          metalness={0.88}
          transparent
          opacity={0.90}
        />
      </mesh>

      {/* Forest Trees Tile 1 */}
      <instancedMesh
        ref={forest1Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, -4, 0]}
        castShadow
      >
        <coneGeometry args={[1.1, 4.0, 6]} />
        <meshStandardMaterial color="#122d14" roughness={0.92} />
      </instancedMesh>

      {/* Forest Trees Tile 2 */}
      <instancedMesh
        ref={forest2Ref}
        args={[undefined, undefined, treeTransforms.length]}
        position={[0, -4, -size]}
        castShadow
      >
        <coneGeometry args={[1.1, 4.0, 6]} />
        <meshStandardMaterial color="#122d14" roughness={0.92} />
      </instancedMesh>
    </group>
  )
}
