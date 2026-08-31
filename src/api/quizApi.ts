import type { QuizQuestion } from '@/game/gameTypes'
import { validateQuiz } from '@/utils/validation'

const TIMEOUT_MS = 8_000

const FALLBACK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    prompt: 'Which rotor provides anti-torque counter-rotation in a conventional helicopter?',
    options: ['Tail Rotor', 'Main Rotor', 'Mast Rotor', 'Turbine Impeller'],
    answer: 'Tail Rotor',
    hint: 'It is mounted horizontally on the vertical tail boom.',
  },
  {
    prompt: 'What physical principle allows helicopter rotor blades to generate aerodynamic lift?',
    options: ['Bernoulli Principle', 'Newton Gravitation', 'Archimedes Buoyancy', 'Doppler Shift'],
    answer: 'Bernoulli Principle',
    hint: 'Airfoil pressure differential between upper and lower blade camber.',
  },
  {
    prompt: 'Which famous attack helicopter is officially nicknamed the "Flying Tank" (AH-64)?',
    options: ['Apache', 'Cobra', 'Black Hawk', 'Chinook'],
    answer: 'Apache',
    hint: 'Named after the legendary Native American warrior tribe.',
  },
  {
    prompt: 'What flight control mechanism tilts the entire rotor disc to move forward, backward, or sideways?',
    options: ['Cyclic Control', 'Collective Pitch', 'Anti-Torque Pedals', 'Throttle Twist'],
    answer: 'Cyclic Control',
    hint: 'Operated by the primary joystick between the pilot legs.',
  },
  {
    prompt: 'Which planet in our solar system is known as the Red Planet?',
    options: ['Mars', 'Venus', 'Jupiter', 'Mercury'],
    answer: 'Mars',
    hint: 'Named after the Roman god of war, rich in iron oxide surface dust.',
  },
]

/**
 * Fetches the quiz from backend API, with automatic fallback for 100% offline resilience (SKILL.md Law 7).
 */
export async function fetchQuiz(): Promise<QuizQuestion[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const projectId = import.meta.env.VITE_PROJECT_ID

  if (!baseUrl || !projectId) {
    console.warn('API credentials missing, using tactical classified mission dataset.')
    return FALLBACK_QUIZ_QUESTIONS
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(baseUrl.trim() + '/projects/' + projectId.trim() + '/quiz', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.warn(`Server responded with ${response.status}, falling back to tactical dataset.`)
      return FALLBACK_QUIZ_QUESTIONS
    }

    const json = await response.json()
    const validated = validateQuiz(json)
    return validated.length > 0 ? validated : FALLBACK_QUIZ_QUESTIONS
  } catch (err) {
    console.warn('Network or validation failure, using tactical dataset:', (err as Error).message)
    return FALLBACK_QUIZ_QUESTIONS
  } finally {
    clearTimeout(timeoutId)
  }
}
