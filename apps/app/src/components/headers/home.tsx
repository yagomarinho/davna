import Link from 'next/link'
import { BaseHeader } from './base'
import { Logo } from '../logo'
import { Button } from '../button'

export const HomeHeader = () => (
  <BaseHeader>
    <div className="flex flex-row justify-between items-center w-full max-w-screen-md">
      <Link href="/">
        <Logo />
      </Link>
      <Link href="/login">
        <Button type="primary" style="outlined">
          Entrar
        </Button>
      </Link>
    </div>
  </BaseHeader>
)
