import { Footer } from '@/shared/components'
import { LoginForm, LoginHeader } from '../components'

export const LoginPage = () => (
  <div className="flex flex-col justify-between w-full h-full min-h-[100vh]">
    <LoginHeader />
    <LoginForm />
    <Footer />
  </div>
)
