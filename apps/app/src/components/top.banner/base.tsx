import { PropsWithChildren } from 'react'

export const TopBannerBase = ({ children }: PropsWithChildren<{}>) => (
  <header className="flex items-center justify-center w-full h-10 p-4 bg-gradient-to-r from-[#1E2F54] from-0% to-[#35435C] to-100% shadow-top-banner">
    {children}
  </header>
)

export const TopBannerBox = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex flex-row justify-between items-center w-full max-w-screen-md">
    {children}
  </div>
)

export const TopBannerText = ({ children }: { children: string }) => (
  <span className="text-center text-[8px] md:text-[12px] font-roboto font-semibold text-white w-full max-w-screen-md">
    {children}
  </span>
)
