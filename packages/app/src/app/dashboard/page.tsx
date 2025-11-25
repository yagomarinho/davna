import { Header } from '@/components/header'
import Link from 'next/link'
import { FiMic } from 'react-icons/fi'

const MicIcon = () => (
  <div className="flex shrink-0 justify-center items-center border border-[#FFFFFF]/15 bg-[#202020] w-12 h-12 rounded-full">
    <FiMic size={24} />
  </div>
)

const Dashboard = () => (
  <div className="w-full">
    <Header type="dashboard" />
    <main className="flex flex-row justify-center w-full">
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
