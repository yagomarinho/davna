import { Footer } from '@/components/footer'
import { Header } from '@/components/header'

const Home = async () => (
  <div>
    <Header />
    <main className="flex flex-col justify-start items-center gap-24 w-full mt-8 p-4 ">
      Hello World!
    </main>
    <Footer />
  </div>
)

export default Home
