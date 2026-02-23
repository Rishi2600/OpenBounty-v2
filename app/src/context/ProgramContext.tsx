import { createContext, useContext, useState, ReactNode } from 'react'
import { Connection } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'

interface ProgramContextType {
  program: unknown
  connection: Connection | null
  isLoading: boolean
}

const ProgramContext = createContext<ProgramContextType>({
  program: null,
  connection: null,
  isLoading: true,
})

export function useProgram() {
  return useContext(ProgramContext)
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection()
  const [program] = useState<unknown>(null)
  const [isLoading] = useState(false)

  return (
    <ProgramContext.Provider value={{ program, connection, isLoading }}>
      {children}
    </ProgramContext.Provider>
  )
}
