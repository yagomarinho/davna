import { PropsWithChildren } from 'react'

export const CaptureBase = ({ children }: PropsWithChildren<{}>) => (
  <div className="fixed bottom-0 left-0 z-30 flex justify-center items-center w-full h-[116px] p-4 bg-[#101010] border-t border-[#FFFFFF]/25">
    {children}
  </div>
)
