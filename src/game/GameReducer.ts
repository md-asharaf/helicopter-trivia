import type { GameState, GameAction, HelicopterOption } from '@/game/gameTypes'
import { GAME_CONFIG } from '@/game/gameConfig'
import { fisherYatesShuffle } from '@/utils/math'
import { getMutedFromStorage, saveMutedToStorage } from '@/utils/storage'

/** Build the shuffled options array for a question */
function buildOptions(options: string[], answer: string): HelicopterOption[] {
  const shuffled = fisherYatesShuffle(options)
  return shuffled.map((text, idx) => ({
    optionIndex: idx,
    optionText: text,
    isCorrect: text === answer,
  }))
}

function newSessionId(): string {
  return crypto.randomUUID()
}

export const initialGameState: GameState = {
  phase: 'ready',
  questions: [],
  currentQuestionIndex: 0,
  questionSessionId: newSessionId(),
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  lastResult: null,
  hintConfirmVisible: false,
  hintVisible: false,
  muted: getMutedFromStorage(),
  confirmPending: null,
  errorMessage: null,
  currentOptions: [],
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'QUIZ_LOADING':
      return { ...state, phase: 'loading', errorMessage: null }

    case 'QUIZ_LOADED': {
      const q = action.questions[0]
      return {
        ...state,
        phase: 'playing',
        questions: action.questions,
        currentQuestionIndex: 0,
        questionSessionId: newSessionId(),
        currentOptions: buildOptions(q.options, q.answer),
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        lastResult: null,
        errorMessage: null,
      }
    }

    case 'START_GAME':
      return { ...state, phase: 'playing' }

    case 'BOMB_DROPPED':
      if (state.phase !== 'playing') return state
      return { ...state, phase: 'bombing' }

    case 'QUESTION_RESOLVED': {
      // Guard: only resolve if sessionId matches current question
      if (action.sessionId !== state.questionSessionId) return state
      // Guard: only resolve from active gameplay
      if (state.phase !== 'bombing' && state.phase !== 'playing') return state

      const { result } = action
      const delta =
        result === 'correct'
          ? GAME_CONFIG.scoring.correct
          : result === 'wrong'
            ? GAME_CONFIG.scoring.wrong
            : GAME_CONFIG.scoring.miss

      const newScore = Math.max(0, state.score + delta)
      const newStreak = result === 'correct' ? state.streak + 1 : 0
      const newBestStreak = Math.max(state.bestStreak, newStreak)
      const newCorrectCount = result === 'correct' ? state.correctCount + 1 : state.correctCount

      return {
        ...state,
        phase: 'resolving',
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        correctCount: newCorrectCount,
        lastResult: result,
      }
    }

    case 'NEXT_QUESTION': {
      if (state.phase !== 'resolving') return state
      const nextIndex = state.currentQuestionIndex + 1
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: 'game-over' }
      }
      const nextQ = state.questions[nextIndex]
      return {
        ...state,
        phase: 'playing',
        currentQuestionIndex: nextIndex,
        questionSessionId: newSessionId(),
        currentOptions: buildOptions(nextQ.options, nextQ.answer),
        lastResult: null,
        hintVisible: false,
        hintConfirmVisible: false,
      }
    }

    case 'GAME_OVER':
      return { ...state, phase: 'game-over' }

    case 'PAUSE':
      if (state.phase === 'playing' || state.phase === 'bombing') {
        return { ...state, phase: 'paused' }
      }
      return state

    case 'RESUME':
      if (state.phase === 'paused') {
        // Return to the last active gameplay phase. Since bombs can only be in
        // the air during 'bombing', and we never pause during 'resolving',
        // we return to 'playing' on resume (bomb will have been destroyed).
        return { ...state, phase: 'playing' }
      }
      return state

    case 'SHOW_HINT_CONFIRM':
      if (state.phase === 'playing' || state.phase === 'bombing') {
        return { ...state, hintConfirmVisible: true }
      }
      return state

    case 'CONFIRM_HINT':
      return { ...state, hintConfirmVisible: false, hintVisible: true }

    case 'HIDE_HINT':
      return { ...state, hintConfirmVisible: false, hintVisible: false }

    case 'REQUEST_CONFIRM':
      return { ...state, confirmPending: action.action }

    case 'CANCEL_CONFIRM':
      return { ...state, confirmPending: null }

    case 'CONFIRM_RESTART': {
      // Reuse existing questions — no API refetch
      const q = state.questions[0]
      return {
        ...state,
        phase: 'playing',
        currentQuestionIndex: 0,
        questionSessionId: newSessionId(),
        currentOptions: buildOptions(q.options, q.answer),
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        lastResult: null,
        hintVisible: false,
        hintConfirmVisible: false,
        confirmPending: null,
        errorMessage: null,
      }
    }

    case 'GO_TO_MAIN_MENU':
      return {
        ...state,
        phase: 'ready',
        questions: [],
        currentQuestionIndex: 0,
        confirmPending: null,
        hintVisible: false,
        hintConfirmVisible: false,
      }

    case 'CONFIRM_NEW_GAME':
      return {
        ...state,
        phase: 'loading',
        questions: [],
        currentQuestionIndex: 0,
        questionSessionId: newSessionId(),
        currentOptions: [],
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        lastResult: null,
        hintVisible: false,
        hintConfirmVisible: false,
        confirmPending: null,
        errorMessage: null,
      }

    case 'SET_ERROR':
      return { ...state, phase: 'error', errorMessage: action.message }

    case 'CLEAR_ERROR':
      return { ...state, phase: 'loading', errorMessage: null }

    case 'TOGGLE_MUTE': {
      const muted = !state.muted
      saveMutedToStorage(muted)
      return { ...state, muted }
    }

    default:
      return state
  }
}
