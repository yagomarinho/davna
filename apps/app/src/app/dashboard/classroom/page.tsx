import { Classroom } from '@/components/classroom'
import { Header } from '@/components/headers'
import { ClassroomProvider } from '@/contexts/classroom.context'

const English = () => (
  <ClassroomProvider>
    <div className="w-full">
      <Header type="classroom" />
      <Classroom />
    </div>
  </ClassroomProvider>
)

export default English
