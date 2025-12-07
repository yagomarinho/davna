import { PropsWithChildren } from 'react'

export const BaseHeader = ({ children }: PropsWithChildren<{}>) => (
  <header className="relative flex items-center justify-center w-full h-[76px] p-4 md:p-8">
    {children}
  </header>
)
