/**
 * Fisher-Yates shuffle — reliable, unbiased.
 */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Map value from one range to another */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/** Generate a random float between min and max */
export function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** Generate a random integer between min and max (inclusive) */
export function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

/** Smooth step easing */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}
