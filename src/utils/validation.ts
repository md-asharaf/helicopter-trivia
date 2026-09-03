import type { QuizQuestion } from '@/game/gameTypes'

export class QuizValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuizValidationError'
  }
}

function resolveMatchingAnswer(
  answer: string,
  options: string[]
): string | null {
  const direct = options.find((opt) => opt.toLowerCase() === answer.toLowerCase())
  if (direct) return direct

  const optionLetters = ['a', 'b', 'c', 'd']
  const letterIdx = optionLetters.indexOf(answer.toLowerCase())
  if (letterIdx >= 0 && options[letterIdx]) {
    return options[letterIdx]
  }

  const numIdx = parseInt(answer, 10)
  if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
    return options[numIdx]
  }
  return null
}

function validateQuestion(q: QuizQuestion, index: number): QuizQuestion {
  if (q === null) {
    throw new QuizValidationError(`Question ${index + 1} is not an object`)
  }


  if (!q.question) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "question"`)
  }

  if (!q.hint) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "hint"`)
  }

  const options = q.options;
  if (!Array.isArray(options)) {
    throw new QuizValidationError(`Question ${index + 1}: "options" must be an array`)
  }
  while (options.length < 4) {
    options.push(q.answer)
  }

  if (options.some((o) => !o)) {
    throw new QuizValidationError(`Question ${index + 1}: all 4 options must have valid text/value`)
  }

  if (!q.answer) {
    throw new QuizValidationError(`Question ${index + 1}: missing or empty "answer"`)
  }

  const matched = resolveMatchingAnswer(q.answer, options)
  if (!matched) {
    throw new QuizValidationError(
      `Question ${index + 1}: answer "${q.answer}" does not match any of the options: [${options.join(', ')}]`
    )
  }

  return {
    question: q.question,
    hint: q.hint,
    options,
    answer: matched,
  }
}

export function validateQuiz(raw: unknown): QuizQuestion[] {
  let list: unknown = raw

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    list = obj.data
  }

  if (typeof list === 'object' && list !== null && !Array.isArray(list)) {
    const obj = list as Record<string, unknown>
    list = obj.data
  }

  if (!Array.isArray(list)) {
    throw new QuizValidationError('Quiz data is not an array')
  }
  if (list.length === 0) {
    throw new QuizValidationError('Quiz contains no questions')
  }
  return list.map((q, idx) => validateQuestion(q, idx))
}
