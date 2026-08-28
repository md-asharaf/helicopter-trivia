// ─── Game Phase State Machine ───────────────────────────────────────────────
export type GamePhase =
  | 'loading'    // fetching API
  | 'ready'      // quiz loaded, ready to start
  | 'playing'    // question shown, helicopters flying, waiting for bomb
  | 'bombing'    // bomb is in the air
  | 'resolving'  // bomb resolved, showing feedback
  | 'paused'     // physics/movement frozen
  | 'hint'       // hint confirmation/display (sub-state of playing)
  | 'game-over'  // all questions done
  | 'error'      // API/validation failure

// ─── Bomb Lifecycle ──────────────────────────────────────────────────────────
export type BombPhase =
  | 'ready'
  | 'flying'
  | 'hit'
  | 'missed'
  | 'exploding'
  | 'resolved'

// ─── Enemy Helicopter Lifecycle ──────────────────────────────────────────────
export type HelicopterStatus =
  | 'flying'
  | 'targeted'
  | 'hit'
  | 'crashing'
  | 'destroyed'

// ─── Quiz Types ───────────────────────────────────────────────────────────────
export interface QuizQuestion {
  prompt: string
  hint: string
  options: string[]   // exactly 4
  answer: string      // must be in options
}

// ─── Enemy Helicopter Option Slot ────────────────────────────────────────────
export interface HelicopterOption {
  optionIndex: number
  optionText: string
  isCorrect: boolean
}

// ─── Central Game State ───────────────────────────────────────────────────────
export interface GameState {
  phase: GamePhase
  questions: QuizQuestion[]
  currentQuestionIndex: number
  /** crypto.randomUUID() per question — prevents stale closure scoring */
  questionSessionId: string
  score: number
  streak: number
  bestStreak: number
  correctCount: number
  lastResult: 'correct' | 'wrong' | 'miss' | null
  hintConfirmVisible: boolean
  hintVisible: boolean
  muted: boolean
  /** Sub-state for confirmation dialogs */
  confirmPending: 'restart' | 'newgame' | null
  errorMessage: string | null
  /** Shuffled options for the current question */
  currentOptions: HelicopterOption[]
}

// ─── Game Actions ─────────────────────────────────────────────────────────────
export type GameAction =
  | { type: 'QUIZ_LOADING' }
  | { type: 'QUIZ_LOADED'; questions: QuizQuestion[] }
  | { type: 'START_GAME' }
  | { type: 'BOMB_DROPPED' }
  | { type: 'QUESTION_RESOLVED'; result: 'correct' | 'wrong' | 'miss'; sessionId: string }
  | { type: 'NEXT_QUESTION' }
  | { type: 'GAME_OVER' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SHOW_HINT_CONFIRM' }
  | { type: 'CONFIRM_HINT' }
  | { type: 'HIDE_HINT' }
  | { type: 'REQUEST_CONFIRM'; action: 'restart' | 'newgame' }
  | { type: 'CANCEL_CONFIRM' }
  | { type: 'CONFIRM_RESTART' }
  | { type: 'CONFIRM_NEW_GAME' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'GO_TO_MAIN_MENU' }

// ─── Collision Metadata (userData on Rapier bodies) ───────────────────────────
export interface HelicopterUserData {
  type: 'helicopter'
  optionIndex: number
  optionText: string
  isCorrect: boolean
  sessionId: string
}

export interface TerrainUserData {
  type: 'terrain'
}

export type ColliderUserData = HelicopterUserData | TerrainUserData
