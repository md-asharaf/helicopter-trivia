import type { QuizQuestion } from '@/game/gameTypes'
import { validateQuiz, QuizValidationError } from '@/utils/validation'

const TIMEOUT_MS = 10_000

/**
 * Fetches the quiz from VITE_QUIZ_API_URL.
 * Validates and normalises the response before returning.
 * Throws descriptive errors for all failure modes.
 */
export async function fetchQuiz(): Promise<QuizQuestion[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const projectId = import.meta.env.VITE_PROJECT_ID

  if (!baseUrl || baseUrl.trim() === '') {
    throw new Error('VITE_API_BASE_URL is not set in your .env file')
  }

  if (!projectId || projectId.trim() === '') {
    throw new Error('VITE_PROJECT_ID is not set in your .env file')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(baseUrl.trim() + '/projects/' + projectId.trim() + '/quiz', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timed out after 10 seconds. Check your connection.')
    }
    throw new Error(`Network error: ${(err as Error).message}`)
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    throw new Error(`Server returned ${response.status} ${response.statusText}`)
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new Error('Server returned malformed JSON')
  }

  try {
    return validateQuiz(json)
  } catch (err) {
    if (err instanceof QuizValidationError) {
      throw new Error(`Invalid quiz data: ${err.message}`)
    }
    throw err
  }
}
