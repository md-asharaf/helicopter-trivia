const MUTE_KEY = 'helicopter-trivia:muted'

export function getMutedFromStorage(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveMutedToStorage(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, String(muted))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
