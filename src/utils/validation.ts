import type { QuizQuestion } from '@/game/gameTypes'

export class QuizValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuizValidationError'
  }
}

/**
 * Extracts a clean display string from a primitive or an object
 */
function extractFieldString(field: unknown): string {
  if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
    return String(field).trim()
  }
  if (typeof field === 'object' && field !== null) {
    const obj = field as Record<string, unknown>
    const candidates = [obj.value, obj.label, obj.lable, obj.text, obj.title]
    for (const val of candidates) {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim()
      }
    }
  }
  return ''
}

function resolveMatchingAnswer(
  answer: string,
  options: string[],
  rawOptions: unknown[]
): string | null {
  const direct = options.find((opt) => opt.toLowerCase() === answer.toLowerCase())
  if (direct) return direct

  // Check letter indexing (A, B, C, D)
  const optionLetters = ['a', 'b', 'c', 'd']
  const letterIdx = optionLetters.indexOf(answer.toLowerCase())
  if (letterIdx >= 0 && options[letterIdx]) {
    return options[letterIdx]
  }

  // Check numeric index
  const numIdx = parseInt(answer, 10)
  if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
    return options[numIdx]
  }

  // Check nested object matches in raw options
  for (let i = 0; i < rawOptions.length; i++) {
    const rawOpt = rawOptions[i]
    if (typeof rawOpt === 'object' && rawOpt !== null) {
      const r = rawOpt as Record<string, unknown>
      const val = extractFieldString(r.value)
      const lbl = extractFieldString(r.label ?? r.lable)
      if (
        (val && val.toLowerCase() === answer.toLowerCase()) ||
        (lbl && lbl.toLowerCase() === answer.toLowerCase())
      ) {
        return options[i]
      }
    }
  }

  return null
}

/**
 * Validates and normalizes a single quiz question. Throws QuizValidationError on any issue.
 */
function validateQuestion(q: unknown, index: number): QuizQuestion {
  if (typeof q !== 'object' || q === null) {
    throw new QuizValidationError(`Question ${index + 1} is not an object`)
  }

  const obj = q as Record<string, unknown>

  const prompt = extractFieldString(obj.prompt ?? obj.question ?? obj.title)
  if (!prompt) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "prompt"`)
  }

  const hint = extractFieldString(obj.hint ?? obj.clue ?? obj.description)
  if (!hint) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "hint"`)
  }

  const rawOptions = obj.options ?? obj.choices ?? obj.answers
  if (!Array.isArray(rawOptions)) {
    throw new QuizValidationError(`Question ${index + 1}: "options" must be an array`)
  }
  if (rawOptions.length !== 4) {
    throw new QuizValidationError(
      `Question ${index + 1}: expected exactly 4 options, got ${rawOptions.length}`
    )
  }

  const options = rawOptions.map((o) => extractFieldString(o))
  if (options.some((o) => !o)) {
    throw new QuizValidationError(`Question ${index + 1}: all 4 options must have valid text/value`)
  }

  // Duplicate check
  const lowerOptions = options.map((o) => o.toLowerCase())
  const uniqueOptions = new Set(lowerOptions)
  if (uniqueOptions.size !== options.length) {
    throw new QuizValidationError(`Question ${index + 1}: duplicate options found`)
  }

  const rawAnswer = obj.answer ?? obj.correctAnswer ?? obj.correct_answer
  const answerStr = extractFieldString(rawAnswer)
  if (!answerStr) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "answer"`)
  }

  const matched = resolveMatchingAnswer(answerStr, options, rawOptions)
  if (!matched) {
    throw new QuizValidationError(
      `Question ${index + 1}: answer "${answerStr}" does not match any of the options: [${options.join(', ')}]`
    )
  }

  return {
    prompt,
    hint,
    options,
    answer: matched,
  }
}

/**
 * Validates the entire quiz array. Returns normalized QuizQuestion[] on success.
 */
export function validateQuiz(data: unknown): QuizQuestion[] {
  if (!Array.isArray(data)) {
    throw new QuizValidationError('Quiz data is not an array')
  }
  if (data.length === 0) {
    throw new QuizValidationError('Quiz contains no questions')
  }
  return data.map((q, idx) => validateQuestion(q, idx))
}
