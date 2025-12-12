import Link from 'next/link'

import { Logo } from '@/shared/assets'
import { BaseHeader } from '@/shared/components'

export const LoginHeader = () => (
  <BaseHeader>
    <div className="flex flex-row justify-start items-center w-full max-w-screen-md">
      <Link href="/">
        <Logo />
      </Link>
    </div>
  </BaseHeader>
)
