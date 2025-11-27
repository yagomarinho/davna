import { ClassroomHeader } from './classroom'
import { DashboardHeader } from './dashboard'
import { HomeHeader } from './home'
import { LoginHeader } from './login'

export interface HeaderProps {
  type?: 'home' | 'login' | 'dashboard' | 'classroom'
}

export const Header = ({ type = 'home' }: HeaderProps) => {
  const Headers = {
    home: HomeHeader,
    login: LoginHeader,
    dashboard: DashboardHeader,
    classroom: ClassroomHeader,
  }

  const H = Headers[type]

  return <H />
}
