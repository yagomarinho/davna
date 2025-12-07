import { History } from './history'
import { AudioCapture } from './audio.capture'

export const Classroom = () => (
  <main className="flex flex-col items-center w-full">
    <div className="w-full max-w-screen-md px-4 md:px-8">
      <History />
    </div>
    <footer>
      <AudioCapture />
    </footer>
  </main>
)
