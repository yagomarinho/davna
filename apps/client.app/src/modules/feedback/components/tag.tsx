import { PropsWithChildren } from 'react'

export const Tag = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex flex-row gap-2 justify-center items-center px-4 md:px-6 py-2 md:py-4 rounded-full bg-[#121212] border border-[#385caa]/15">
    {children}
  </div>
)
