import { Classroom, ClassroomHeader } from '../components'
import { ClassroomProvider } from '../contexts'

export const ClassroomPage = () => (
  <ClassroomProvider>
    <div className="w-full">
      <ClassroomHeader />
      <Classroom />
    </div>
  </ClassroomProvider>
)
