import { ClassroomPage } from '@/modules/classroom'

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const p = await params

  return <ClassroomPage id={p.id} />
}

export default Page
