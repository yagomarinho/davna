import Link from 'next/link'
import { BaseHeader } from './base'
import { Logo } from '../logo'

export const LoginHeader = () => (
  <BaseHeader>
    <div className="flex flex-row justify-start items-center w-full max-w-screen-md">
      <Link href="/">
        <Logo />
      </Link>
    </div>
  </BaseHeader>
)
