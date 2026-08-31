/**
 * AudioManager — Production-Grade Procedural Web Audio API Sound Engine (SKILL.md Law 1).
 * Crisp, punchy, arcade-grade sound effects and dynamic turbine synth without external audio files.
 */

type SoundId =
  | 'rotorLoop'
  | 'bombDrop'
  | 'bombFlight'
  | 'lockOn'
  | 'explosion'
  | 'correct'
  | 'wrong'
  | 'uiClick'
  | 'gameComplete'
  | 'streakCombo'
  | 'countdown'

class AudioManager {
  private static instance: AudioManager | null = null
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeSources: Map<SoundId, AudioNode> = new Map()
  private rotorOsc: OscillatorNode | null = null
  private muted = false
  private initialized = false

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  init(): void {
    if (this.initialized) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.connect(this.ctx.destination)
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime)
      this.initialized = true
    } catch {
      // AudioContext not supported
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.04)
    }
  }

  private get audioCtx(): AudioContext | null {
    if (!this.initialized) this.init()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private createGain(volume = 1.0): GainNode {
    const ctx = this.audioCtx!
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.connect(this.masterGain!)
    return gain
  }

  private createNoiseBuffer(duration = 1.0): AudioBuffer {
    const ctx = this.audioCtx!
    const sampleRate = ctx.sampleRate
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  play(id: SoundId): void {
    const ctx = this.audioCtx
    if (!ctx || !this.masterGain || this.muted) return

    switch (id) {
      case 'rotorLoop':
        this.playRotorLoop(ctx)
        break
      case 'lockOn':
        this.playLockOn(ctx)
        break
      case 'bombDrop':
        this.playBombDrop(ctx)
        break
      case 'bombFlight':
        this.playBombFlight(ctx)
        break
      case 'explosion':
        this.playExplosion(ctx)
        break
      case 'correct':
        this.playCorrect(ctx)
        break
      case 'wrong':
        this.playWrong(ctx)
        break
      case 'uiClick':
        this.playUiClick(ctx)
        break
      case 'streakCombo':
        this.playStreakCombo(ctx)
        break
      case 'gameComplete':
        this.playGameComplete(ctx)
        break
      case 'countdown':
        this.playCountdown(ctx)
        break
    }
  }

  stop(id: SoundId): void {
    const source = this.activeSources.get(id)
    if (source) {
      try {
        ;(source as OscillatorNode | AudioBufferSourceNode).stop()
      } catch {
        // already stopped
      }
      this.activeSources.delete(id)
    }
    if (id === 'rotorLoop') {
      this.rotorOsc = null
    }
  }

  stopAll(): void {
    this.activeSources.forEach((_, id) => this.stop(id))
  }

  /** Modulate rotor pitch based on player maneuvers (climbing / turning) */
  setRotorPitch(pitchMultiplier = 1.0): void {
    if (!this.rotorOsc || !this.ctx) return
    const freq = Math.max(45, Math.min(75, 55 * pitchMultiplier))
    this.rotorOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1)
  }

  /** Soft, pleasant turbine hum with subtle low-frequency rhythm */
  private playRotorLoop(ctx: AudioContext): void {
    if (this.activeSources.has('rotorLoop')) return

    // Gentle sub-bass hum (55 Hz)
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(55, ctx.currentTime)

    // Soft warm lowpass filter to produce deep turbine purr
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(140, ctx.currentTime)

    const gain = this.createGain(0.045) // pleasant background volume
    osc.connect(filter)
    filter.connect(gain)
    osc.start()

    this.rotorOsc = osc
    this.activeSources.set('rotorLoop', osc)
  }

  /** High-tech target lock-on beep */
  private playLockOn(ctx: AudioContext): void {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = this.createGain(0.18)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, t)
    osc.frequency.setValueAtTime(1800, t + 0.04)

    gain.gain.setValueAtTime(0.18, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)

    osc.connect(gain)
    osc.start(t)
    osc.stop(t + 0.09)
  }

  /** High-tech pneumatic bomb launch whoosh */
  private playBombDrop(ctx: AudioContext): void {
    const t = ctx.currentTime
    const gain = this.createGain(0.42)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, t)
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.28)

    gain.gain.setValueAtTime(0.42, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

    osc.connect(gain)
    osc.start(t)
    osc.stop(t + 0.3)
  }

  private playBombFlight(ctx: AudioContext): void {
    if (this.activeSources.has('bombFlight')) return
    const gain = this.createGain(0.05)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(240, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 1.2)
    osc.connect(gain)
    osc.start()
    this.activeSources.set('bombFlight', osc)
  }

  /** Deep cinematic boom explosion */
  private playExplosion(ctx: AudioContext): void {
    this.stop('bombFlight')
    const t = ctx.currentTime

    // 1. Heavy Sub-Bass Boom
    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(140, t)
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.7)

    const subGain = this.createGain(0.65)
    subGain.gain.setValueAtTime(0.65, t)
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75)

    subOsc.connect(subGain)
    subOsc.start(t)
    subOsc.stop(t + 0.75)

    // 2. Filtered White Noise Blast
    const bufferSource = ctx.createBufferSource()
    bufferSource.buffer = this.createNoiseBuffer(0.85)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, t)
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.75)

    const noiseGain = this.createGain(0.5)
    noiseGain.gain.setValueAtTime(0.5, t)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85)

    bufferSource.connect(filter)
    filter.connect(noiseGain)
    bufferSource.start(t)
    bufferSource.stop(t + 0.85)
  }

  /** Crisp, sparkling 4-note victory chime (C5, E5, G5, C6) */
  private playCorrect(ctx: AudioContext): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    const t = ctx.currentTime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t + i * 0.08)

      const gain = this.createGain(0.24)
      gain.gain.setValueAtTime(0, t + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.24, t + i * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35)

      osc.connect(gain)
      osc.start(t + i * 0.08)
      osc.stop(t + i * 0.08 + 0.38)
    })
  }

  /** Streak Combo Fanfare */
  private playStreakCombo(ctx: AudioContext): void {
    const notes = [659.25, 783.99, 1046.5, 1318.51] // E5, G5, C6, E6
    const t = ctx.currentTime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t + i * 0.06)

      const gain = this.createGain(0.26)
      gain.gain.setValueAtTime(0, t + i * 0.06)
      gain.gain.linearRampToValueAtTime(0.26, t + i * 0.06 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.38)

      osc.connect(gain)
      osc.start(t + i * 0.06)
      osc.stop(t + i * 0.06 + 0.4)
    })
  }

  /** Gentle low double-thud for wrong answer */
  private playWrong(ctx: AudioContext): void {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.28)

    const gain = this.createGain(0.3)
    gain.gain.setValueAtTime(0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

    osc.connect(gain)
    osc.start(t)
    osc.stop(t + 0.3)
  }

  /** Modern soft UI bubble click */
  private playUiClick(ctx: AudioContext): void {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(950, t)
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.04)

    const gain = this.createGain(0.14)
    gain.gain.setValueAtTime(0.14, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

    osc.connect(gain)
    osc.start(t)
    osc.stop(t + 0.05)
  }

  private playGameComplete(ctx: AudioContext): void {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51]
    const t = ctx.currentTime
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t + i * 0.11)
      const gain = this.createGain(0.22)
      gain.gain.setValueAtTime(0, t + i * 0.11)
      gain.gain.linearRampToValueAtTime(0.22, t + i * 0.11 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.5)
      osc.connect(gain)
      osc.start(t + i * 0.11)
      osc.stop(t + i * 0.11 + 0.55)
    })
  }

  private playCountdown(ctx: AudioContext): void {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(780, t)
    const gain = this.createGain(0.15)
    gain.gain.setValueAtTime(0.15, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
    osc.connect(gain)
    osc.start(t)
    osc.stop(t + 0.09)
  }
}

export const audioManager = AudioManager.getInstance()
