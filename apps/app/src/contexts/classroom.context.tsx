'use client'

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react'

export interface ClassroomContextProps {
  setRemaining: (remainingConsumption: number) => void
  getRemaining: () => number
}

export const ClassroomContext = createContext<ClassroomContextProps>(
  {} as ClassroomContextProps,
)

export const ClassroomProvider = ({ children }: PropsWithChildren<{}>) => {
  const [remaining, setRemaining] = useState(() => 0)

  const set = useCallback((consumption: number) => {
    setRemaining(consumption)
  }, [])

  const getRemaining = useCallback(() => remaining, [remaining])

  return (
    <ClassroomContext.Provider value={{ setRemaining: set, getRemaining }}>
      {children}
    </ClassroomContext.Provider>
  )
}

export const useClassroom = () => useContext(ClassroomContext)
