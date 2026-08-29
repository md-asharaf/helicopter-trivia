import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useGameState, useGameDispatch } from '@/game/GameContext'
import { inputManager } from '@/controls/InputManager'
import { audioManager } from '@/audio/AudioManager'
import { PlayerHelicopter, type PlayerHelicopterHandle } from '@/game/entities/PlayerHelicopter'
import { EnemyHelicopter } from '@/game/entities/EnemyHelicopter'
import { Bomb } from '@/game/entities/Bomb'
import { Explosion } from '@/game/entities/Explosion'
import { TrajectoryLine } from '@/game/entities/TrajectoryLine'
import { Lighting } from './Lighting'
import { Environment } from './Environment'
import { Terrain } from './Terrain'
import { Clouds } from './Clouds'
import { CameraRig } from './CameraRig'
import type { BombPhase, HelicopterOption } from '@/game/gameTypes'

// 4 enemy helicopters neatly lined up in closer formation
const BASE_SPAWN_POSITIONS = [
  new THREE.Vector3(-19, 16.5, -26),
  new THREE.Vector3(-6.5, 16.5, -26),
  new THREE.Vector3(6.5, 16.5, -26),
  new THREE.Vector3(19, 16.5, -26),
]

interface BombState {
  id: string
  spawnPosition: THREE.Vector3
  targetPosition: THREE.Vector3
  targetOption: HelicopterOption | null
  sessionId: string
  phase: BombPhase
}

interface ExplosionState {
  id: string
  position: THREE.Vector3
  type: 'correct' | 'wrong' | 'miss'
}

export function GameScene() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const playerRef = useRef<PlayerHelicopterHandle>(null)

  const [bomb, setBomb] = useState<BombState | null>(null)
  const [explosion, setExplosion] = useState<ExplosionState | null>(null)
  const [crashedHelicopters, setCrashedHelicopters] = useState<Set<number>>(new Set())
  const [shake, setShake] = useState(false)
  const [bombPosition, setBombPosition] = useState<THREE.Vector3 | null>(null)
  const [impactPosition, setImpactPosition] = useState<THREE.Vector3 | null>(null)

  const spawnPositions = useMemo(() => BASE_SPAWN_POSITIONS, [])

  const isPaused = state.phase === 'paused' || state.phase === 'resolving' ||
    state.phase === 'game-over' || state.phase === 'hint'
  const isPlaying = state.phase === 'playing'

  // Attach input manager & audio
  useEffect(() => {
    inputManager.attach()
    audioManager.init()
    audioManager.play('rotorLoop')
    return () => {
      inputManager.detach()
      audioManager.stop('rotorLoop')
    }
  }, [])

  useEffect(() => {
    inputManager.setPaused(isPaused)
  }, [isPaused])

  useEffect(() => {
    audioManager.setMuted(state.muted)
  }, [state.muted])

  // Reset on question change
  useEffect(() => {
    setCrashedHelicopters(new Set())
    setBomb(null)
    setBombPosition(null)
    setImpactPosition(null)
    setExplosion(null)
  }, [state.questionSessionId])

  // Poll fire / controls
  useEffect(() => {
    if (!isPlaying) return
    let rafId: number

    const poll = () => {
      if (inputManager.consumeFire() && !bomb) {
        const player = playerRef.current
        if (player) {
          const pos = player.getWorldPosition()

          // Target lock calculation
          const rawAimX = -inputManager.aimX * 22
          let closestIdx = 0
          let minDiff = 999
          BASE_SPAWN_POSITIONS.forEach((p, idx) => {
            const diff = Math.abs(rawAimX - p.x)
            if (diff < minDiff) {
              minDiff = diff
              closestIdx = idx
            }
          })

          const targetStation = BASE_SPAWN_POSITIONS[closestIdx]
          const spawnPos = pos.clone().add(new THREE.Vector3(0, -0.5, -1.0))

          setBomb({
            id: crypto.randomUUID(),
            spawnPosition: spawnPos,
            targetPosition: targetStation.clone(),
            targetOption: state.currentOptions[closestIdx] ?? null,
            sessionId: state.questionSessionId,
            phase: 'flying',
          })
          dispatch({ type: 'BOMB_DROPPED' })
          audioManager.play('bombDrop')
        }
      }

      if (inputManager.consumePause()) {
        if (state.phase === 'playing' || state.phase === 'bombing') {
          dispatch({ type: 'PAUSE' })
        }
      }

      if (inputManager.consumeHint()) {
        dispatch({ type: 'SHOW_HINT_CONFIRM' })
      }

      if (inputManager.consumeMute()) {
        dispatch({ type: 'TOGGLE_MUTE' })
      }

      rafId = requestAnimationFrame(poll)
    }

    rafId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying, bomb, dispatch, state.questionSessionId, state.phase, state.currentOptions])

  const handleHit = useCallback(
    (optionText: string, isCorrect: boolean, sessionId: string) => {
      if (sessionId !== state.questionSessionId) return
      const result = isCorrect ? 'correct' : 'wrong'

      const hitIdx = state.currentOptions.findIndex((o) => o.optionText === optionText)
      const hitPos = (hitIdx >= 0 && BASE_SPAWN_POSITIONS[hitIdx])
        ? BASE_SPAWN_POSITIONS[hitIdx].clone()
        : new THREE.Vector3(0, 16.5, -26)

      setExplosion({ id: crypto.randomUUID(), position: hitPos, type: result })
      setImpactPosition(hitPos)
      setShake(true)
      setBomb(null)
      setTimeout(() => setShake(false), 600)

      if (hitIdx >= 0) {
        setCrashedHelicopters((prev) => new Set([...prev, hitIdx]))
      }

      audioManager.play('explosion')
      setTimeout(() => audioManager.play(isCorrect ? 'correct' : 'wrong'), 250)

      dispatch({ type: 'QUESTION_RESOLVED', result, sessionId })
    },
    [dispatch, state.questionSessionId, state.currentOptions]
  )

  const handleMiss = useCallback(
    (sessionId: string) => {
      if (sessionId !== state.questionSessionId) return
      const missPos = new THREE.Vector3(0, 2, -26)

      setExplosion({ id: crypto.randomUUID(), position: missPos, type: 'miss' })
      setImpactPosition(missPos)
      setShake(true)
      setBomb(null)
      setTimeout(() => setShake(false), 400)

      audioManager.play('explosion')
      setTimeout(() => audioManager.play('wrong'), 250)

      dispatch({ type: 'QUESTION_RESOLVED', result: 'miss', sessionId })
    },
    [dispatch, state.questionSessionId]
  )

  const handleBombPhaseChange = useCallback((phase: BombPhase) => {
    setBomb((prev) => (prev ? { ...prev, phase } : null))
  }, [])

  const currentQuestion = state.questions[state.currentQuestionIndex]
  const showTrajectory = isPlaying && !bomb
  const playerPos = playerRef.current?.getWorldPosition() ?? new THREE.Vector3(0, 16, 0)

  return (
    <div id="game-canvas" className={shake ? 'screen-shake' : ''}>
      <Canvas
        shadows
        camera={{ fov: 54, near: 0.5, far: 400, position: [0, 19, 15] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 1.5]}
      >
        <Physics gravity={[0, -9.81, 0]} paused={isPaused}>
          <Lighting />
          <Environment />
          <Terrain />
          <Clouds />

          {/* Player helicopter */}
          <PlayerHelicopter ref={playerRef} paused={isPaused} />

          {/* Camera rig */}
          <CameraRig
            playerRef={playerRef}
            bombPosition={bombPosition}
            impactPosition={impactPosition}
            shake={shake}
          />

          {/* 4 Front Enemy Helicopters */}
          {currentQuestion && state.currentOptions.map((option, i) => (
            <EnemyHelicopter
              key={`${state.questionSessionId}-${i}`}
              optionIndex={option.optionIndex}
              optionText={option.optionText}
              isCorrect={option.isCorrect}
              sessionId={state.questionSessionId}
              paused={isPaused}
              spawnPosition={spawnPositions[i]}
              crashed={crashedHelicopters.has(i)}
              onCollisionEnter={handleHit}
            />
          ))}

          {/* Active Deterministic Ballistic Bomb */}
          {bomb && bomb.phase === 'flying' && (
            <Bomb
              key={bomb.id}
              spawnPosition={bomb.spawnPosition}
              targetPosition={bomb.targetPosition}
              targetOption={bomb.targetOption}
              sessionId={bomb.sessionId}
              onHit={handleHit}
              onMiss={handleMiss}
              paused={isPaused}
              phase={bomb.phase}
              onPhaseChange={handleBombPhaseChange}
            />
          )}

          {/* Trajectory preview line */}
          {showTrajectory && (
            <TrajectoryLine
              playerPosition={playerPos}
              visible={showTrajectory}
            />
          )}

          {/* Explosion effect */}
          {explosion && (
            <Explosion
              key={explosion.id}
              position={explosion.position}
              type={explosion.type}
              onComplete={() => setExplosion(null)}
            />
          )}
        </Physics>
      </Canvas>
    </div>
  )
}
