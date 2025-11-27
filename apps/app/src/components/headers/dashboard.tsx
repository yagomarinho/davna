import { logout } from '@/actions/logout'
import { BaseHeader } from './base'
import { Logo } from '../logo'
import { Button } from '../button'
import { FiLogOut } from 'react-icons/fi'

export const DashboardHeader = () => (
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
