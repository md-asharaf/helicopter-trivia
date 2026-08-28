import React, { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { GameState, GameAction } from '@/game/gameTypes'
import { gameReducer, initialGameState } from '@/game/GameReducer'

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameState(): GameState {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameState must be used within GameProvider')
  return ctx.state
}

export function useGameDispatch(): React.Dispatch<GameAction> {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider')
  return ctx.dispatch
}
