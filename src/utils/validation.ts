import type { QuizQuestion } from '@/game/gameTypes'

export class QuizValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuizValidationError'
  }
}

/**
 * Extracts a display string from either a primitive or an object of shape:
 * { label?: string, lable?: string, value?: string, text?: string }
 */
function extractFieldString(field: unknown): string {
  if (typeof field === 'string') {
    return field.trim()
  }
  if (typeof field === 'number' || typeof field === 'boolean') {
    return String(field).trim()
  }
  if (typeof field === 'object' && field !== null) {
    const obj = field as Record<string, unknown>
    // Priority: value -> label -> lable -> text -> title
    if (typeof obj.value === 'string' && obj.value.trim() !== '') {
      return obj.value.trim()
    }
    if (typeof obj.value === 'number' || typeof obj.value === 'boolean') {
      return String(obj.value).trim()
    }
    if (typeof obj.label === 'string' && obj.label.trim() !== '') {
      return obj.label.trim()
    }
    if (typeof obj.lable === 'string' && obj.lable.trim() !== '') {
      return obj.lable.trim()
    }
    if (typeof obj.text === 'string' && obj.text.trim() !== '') {
      return obj.text.trim()
    }
    if (typeof obj.title === 'string' && obj.title.trim() !== '') {
      return obj.title.trim()
    }
  }
  return ''
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
  let answer = extractFieldString(rawAnswer)
  if (!answer) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "answer"`)
  }

  // If answer matches directly by value or label in raw options
  let matchedOption = options.find((opt) => opt.toLowerCase() === answer.toLowerCase())

  if (!matchedOption) {
    // Check if rawAnswer was pointing to an index or letter like "A", "B", "C", "D" or 0, 1, 2, 3
    const optionLetters = ['a', 'b', 'c', 'd']
    const letterIdx = optionLetters.indexOf(answer.toLowerCase())
    if (letterIdx >= 0 && options[letterIdx]) {
      matchedOption = options[letterIdx]
      answer = matchedOption
    } else {
      const numIdx = parseInt(answer, 10)
      if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
        matchedOption = options[numIdx]
        answer = matchedOption
      }
    }
  }

  if (!matchedOption) {
    // Check inside rawOptions objects if answer matched label/lable/value
    rawOptions.forEach((rawOpt, i) => {
      if (typeof rawOpt === 'object' && rawOpt !== null) {
        const r = rawOpt as Record<string, unknown>
        const val = extractFieldString(r.value)
        const lbl = extractFieldString(r.label ?? r.lable)
        if (
          (val && val.toLowerCase() === answer.toLowerCase()) ||
          (lbl && lbl.toLowerCase() === answer.toLowerCase())
        ) {
          matchedOption = options[i]
          answer = options[i]
        }
      }
    })
  }

  if (!matchedOption) {
    throw new QuizValidationError(
      `Question ${index + 1}: answer "${answer}" does not match any of the options: [${options.join(', ')}]`
    )
  }

  return {
    prompt,
    hint,
    options,
    answer: matchedOption,
  }
}

/**
 * Validates the full quiz response. Returns validated questions array.
 */
export function validateQuiz(data: unknown): QuizQuestion[] {
  if (data === null || data === undefined) {
    throw new QuizValidationError('Empty response from server')
  }

  let raw: unknown[]

  if (Array.isArray(data)) {
    raw = data
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    // Try common wrapper shapes: { questions }, { data }, { results }, { quiz }, { items }
    const inner = obj.questions ?? obj.data ?? obj.results ?? obj.quiz ?? obj.items
    if (Array.isArray(inner)) {
      raw = inner
    } else {
      throw new QuizValidationError('Response is not a questions array and no known wrapper found')
    }
  } else {
    throw new QuizValidationError('Unexpected response format')
  }

  if (raw.length === 0) {
    throw new QuizValidationError('Quiz contains no questions')
  }

  return raw.map(validateQuestion)
}
