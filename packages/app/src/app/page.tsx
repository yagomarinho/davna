import { Footer } from '@/components/footer'
import { Header } from '@/components/headers'
import { WhatsAppLead } from '@/components/whatsapp.lead'
import { PropsWithChildren } from 'react'
import { FiZap } from 'react-icons/fi'

const Tag = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex flex-row gap-2 justify-center items-center px-4 md:px-6 py-2 md:py-4 rounded-full bg-[#121212] border border-[#385caa]/15">
    {children}
  </div>
)

const Home = async () => (
  <div className="flex flex-col justify-between w-full h-full min-h-[100vh]">
    <Header />
    <main className="flex flex-col justify-start items-center w-full h-full mt-8 p-4 text-center">
      <div className="flex flex-col justify-center items-center gap-8 md:gap-16 w-full h-full max-w-screen-md mt-8 p-4">
        <Tag>
          <FiZap color="#5a89ef" strokeWidth={1} size={18} />
          <span className="text-[#5A89EF] text-xs md:text-base font-grotesk font-medium">
            Conversação em todos os níveis com IA
          </span>
        </Tag>
        <h1 className="font-sora font-bold text-[28px] md:text-5xl text-white leading-[120%]">
          Falar em inglês não é capricho — é o que destrava sua próxima
          oportunidade.
        </h1>
        <p className="font-roboto text-sm md:text-xl text-[#A2A2A2] leading-[150%]">
          Eleve sua fluência e conquiste melhores oportunidades de trabalho e
          renda aprimorando sua conversação em inglês.
        </p>
        <WhatsAppLead />
      </div>
    </main>
    <Footer />
  </div>
)

export default Home
