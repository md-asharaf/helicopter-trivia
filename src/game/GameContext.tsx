import { useReducer, type ReactNode } from 'react'
import { gameReducer, initialGameState } from '@/game/GameReducer'
import { GameContext } from './GameContextCore'

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}
