import Link from 'next/link'
import { FiInfo } from 'react-icons/fi'

import { suggestion } from '../actions'
import { MicIcon } from '../assets'
import { DashboardHeader } from '../components/dashboard'
import { FeedbackSender } from '../components'

export const Dashboard = () => (
  <div className="w-full">
    <DashboardHeader />
    <main className="flex flex-col px-4 justify-start items-center w-full">
      <div className="mb-5 flex flex-row px-4 py-3 gap-2 justify-center items-start text-sm md:text-base text-white w-full max-w-screen-md border rounded-lg border-[rgba(90,137,239,0.3)] bg-[rgba(90,137,239,0.15)]">
        <FiInfo className="shrink-0" size={24} color="#385CAA" />
        <span className="font-roboto text-sm md:text-base">
          Por favor, evite compartilhar dados pessoais ou sigilosos. Estamos
          aprimorando nosso agente de IA e algumas interações podem ser usadas
          para melhorar a experiência.
        </span>
      </div>
      <div className="flex flex-col gap-4 items-center justify-center w-full max-w-screen-md border border-[rgba(90,137,239,0.3)] rounded-xl px-4 py-3">
        <header>
          <h1>Ajude-nos a melhorar</h1>
        </header>
        <span className="font-roboto text-[#a2a2a2] text-sm md:text-base leading-[150%]">
          E aí, surgiu alguma ideia de como podemos melhorar o app pra você?
          <br /> <br />
          Compartilhe conosco pra que possamos evoluir ainda mais!
        </span>
        <FeedbackSender
          name="suggestion"
          action={suggestion}
          placeholder="Compartilhe sua ideia aqui..."
          errorMessage="Você precisa enviar algum texto"
        />
      </div>
      <div className="flex justify-center w-full max-w-screen-md p-4 md:p-8">
        <Link
          href="/dashboard/classroom"
          className="flex flex-row items-center gap-8 px-16 py-8 rounded-[64px] w-full max-w-96 border border-[#404040] bg-[#202020]"
        >
          <MicIcon />
          <span className="font-sora font-medium text-sm text-center">
            Aprender Inglês Conversando
          </span>
        </Link>
      </div>
    </main>
  </div>
)
