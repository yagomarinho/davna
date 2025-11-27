import { Footer } from '@/components/footer'
import { Header } from '@/components/headers'
import { LoginForm } from '@/components/login.form'

const Login = () => (
  <div className="flex flex-col justify-between w-full h-full min-h-[100vh]">
    <Header type="login" />
    <LoginForm />
    <Footer />
  </div>
)

export default Login
