/**
 * AudioManager — Premium Procedural Web Audio API sound engine.
 * Crisp, punchy, arcade-grade sounds without harsh noise or grating buzz.
 */

type SoundId =
  | 'rotorLoop'
  | 'bombDrop'
  | 'bombFlight'
  | 'explosion'
  | 'correct'
  | 'wrong'
  | 'uiClick'
  | 'gameComplete'
  | 'countdown'

class AudioManager {
  private static instance: AudioManager | null = null
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeSources: Map<SoundId, AudioNode> = new Map()
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
      this.ctx = new AudioContext()
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
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.05)
    }
  }

  private get audioCtx(): AudioContext | null {
    if (!this.initialized) return null
    if (this.ctx?.state === 'suspended') {
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
    if (!ctx || !this.masterGain) return

    switch (id) {
      case 'rotorLoop':
        this.playRotorLoop(ctx)
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
  }

  stopAll(): void {
    this.activeSources.forEach((_, id) => this.stop(id))
  }

  /** Soft, pleasant turbine hum with subtle low-frequency rhythm */
  private playRotorLoop(ctx: AudioContext): void {
    if (this.activeSources.has('rotorLoop')) return

    // Gentle sub-bass hum (55 Hz)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(55, ctx.currentTime)

    // Soft warm filter
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(120, ctx.currentTime)

    const gain = this.createGain(0.06) // very soft background
    osc.connect(filter)
    filter.connect(gain)
    osc.start()

    this.activeSources.set('rotorLoop', osc)
  }

  /** High-tech launch whoosh */
  private playBombDrop(ctx: AudioContext): void {
    const gain = this.createGain(0.4)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(450, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.28)

    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

    osc.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }

  private playBombFlight(ctx: AudioContext): void {
    if (this.activeSources.has('bombFlight')) return
    const gain = this.createGain(0.05)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(240, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 1.5)
    osc.connect(gain)
    osc.start()
    this.activeSources.set('bombFlight', osc)
  }

  /** Deep cinematic boom explosion */
  private playExplosion(ctx: AudioContext): void {
    this.stop('bombFlight')

    // Low sub boom
    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(120, ctx.currentTime)
    subOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.6)

    const subGain = this.createGain(0.6)
    subGain.gain.setValueAtTime(0.6, ctx.currentTime)
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65)

    subOsc.connect(subGain)
    subOsc.start()
    subOsc.stop(ctx.currentTime + 0.65)

    // Filtered noise burst
    const bufferSource = ctx.createBufferSource()
    bufferSource.buffer = this.createNoiseBuffer(0.8)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.7)

    const noiseGain = this.createGain(0.5)
    noiseGain.gain.setValueAtTime(0.5, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)

    bufferSource.connect(filter)
    filter.connect(noiseGain)
    bufferSource.start()
    bufferSource.stop(ctx.currentTime + 0.8)
  }

  /** Crisp, sparkling 4-note victory chime */
  private playCorrect(ctx: AudioContext): void {
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)

      const gain = this.createGain(0.25)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)

      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.4)
    })
  }

  /** Gentle low thud for wrong answer */
  private playWrong(ctx: AudioContext): void {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.25)

    const gain = this.createGain(0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)

    osc.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 0.28)
  }

  /** Modern soft UI bubble click */
  private playUiClick(ctx: AudioContext): void {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(900, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.04)

    const gain = this.createGain(0.12)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }

  private playGameComplete(ctx: AudioContext): void {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51]
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
      const gain = this.createGain(0.22)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.12 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5)
      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.55)
    })
  }

  private playCountdown(ctx: AudioContext): void {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(750, ctx.currentTime)
    const gain = this.createGain(0.15)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }
}

export const audioManager = AudioManager.getInstance()
