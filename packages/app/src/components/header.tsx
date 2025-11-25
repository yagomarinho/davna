import Link from 'next/link'
import { Button } from './button'
import { PropsWithChildren } from 'react'
import { logout } from '@/actions/logout'
import { FiLogOut } from 'react-icons/fi'
import Image from 'next/image'

export interface HeaderProps {
  type?: 'home' | 'login' | 'dashboard' | 'classroom'
}

const BaseHeader = ({ children }: PropsWithChildren<{}>) => (
  <header className="relative flex items-center justify-center w-full min-h-16 p-4 md:p-8">
    {children}
  </header>
)

const Logo = () => (
  <div className="relative w-[60px] md:w-[100px] aspect-[5/1]">
    <Image
      src="/logo.png"
      alt="Logomarca Davna representada por 3 waves seguidas do nome Davna"
      fill
    />
  </div>
)

const HomeHeader = () => (
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

const LoginHeader = () => (
  <BaseHeader>
    <div className="flex flex-row justify-start items-center w-full max-w-screen-md">
      <Link href="/">
        <Logo />
      </Link>
    </div>
  </BaseHeader>
)

const DashboardHeader = () => (
  <BaseHeader>
    <form
      action={logout}
      className="flex flex-row justify-between items-center w-full max-w-screen-md"
    >
      <Logo />
      <Button type="ghost" role="submit">
        <span className="font-sora font-medium text-sm mr-2">Deslogar</span>
        <FiLogOut size={18} strokeWidth={2} />
      </Button>
    </form>
  </BaseHeader>
)

const ClassroomHeader = () => (
  <BaseHeader>
    <div className="fixed bg-[#080808] z-10 top-0 left-0 flex flex-row justify-center items-center w-full">
      <div className="flex flex-row justify-start items-center w-full max-w-screen-md">
        <Link href="/dashboard">
          <Button type="ghost">
            <FiLogOut size={18} strokeWidth={2} />
            <span className="font-sora font-medium text-sm ml-2">
              Sair da Classe
            </span>
          </Button>
        </Link>
      </div>
    </div>
  </BaseHeader>
)

const Headers = {
  home: HomeHeader,
  login: LoginHeader,
  dashboard: DashboardHeader,
  classroom: ClassroomHeader,
}

export const Header = ({ type = 'home' }: HeaderProps) => {
  const H = Headers[type]

  return <H />
}
