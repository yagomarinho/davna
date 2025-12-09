import { Classroom, ClassroomHeader } from '../components'
import { ClassroomProvider } from '../contexts'

export const ClassroomPage = ({ id }: { id: string }) => (
  <ClassroomProvider classroom_id={id}>
    <div className="w-full">
      <ClassroomHeader />
      <Classroom />
    </div>
  </ClassroomProvider>
)
