import { Header } from '@/components/headers'
import Link from 'next/link'
import { FiInfo, FiMic } from 'react-icons/fi'

const MicIcon = () => (
  <div className="flex shrink-0 justify-center items-center border border-[#FFFFFF]/15 bg-[#202020] w-12 h-12 rounded-full">
    <FiMic size={24} />
  </div>
)

const Dashboard = () => (
  <div className="w-full">
    <Header type="dashboard" />
    <main className="flex flex-col px-4 justify-start items-center w-full">
      <div className="mb-5 flex flex-row px-4 py-3 gap-2 justify-center items-start text-sm md:text-base text-white w-full max-w-screen-md border rounded-lg border-[rgba(90,137,239,0.3)] bg-[rgba(90,137,239,0.15)]">
        <FiInfo className="shrink-0" size={24} color="#385CAA" />
        <span>
          Por favor, evite compartilhar dados pessoais ou sigilosos. Estamos
          aprimorando nosso agente de IA e algumas interações podem ser usadas
          para melhorar a experiência.
        </span>
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

export default Dashboard
