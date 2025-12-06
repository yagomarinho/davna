import { FiZap } from 'react-icons/fi'
import { FeedbackSender, HomeHeader, Tag, TopBanner } from '../components'
import { whatsappLead } from '../actions'
import { Footer } from '@/shared/components'
import { Light } from '@/shared/assets'

export const LandingPage = async () => (
  <div className="flex flex-col justify-between items-center w-full h-full min-h-[100vh]">
    <div className="w-full absolute top-0 left-0 z-20">
      <TopBanner />
      <HomeHeader />
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
          <FeedbackSender
            name="whatsapp"
            action={whatsappLead}
            placeholder="Insira seu WhatsApp para desbloquear seu acesso"
            errorMessage='Formato de WhatsApp inválido, por favor use o seguinte formato "(11) 99999-8888"'
          />
        </div>
      </main>
      <Footer />
    </div>
    <div className="absolute z-10 top-0 left-0 w-[100vw] h-[100vh] overflow-hidden">
      <Light />
    </div>
  </div>
)
