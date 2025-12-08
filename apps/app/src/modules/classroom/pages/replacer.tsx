'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClassroomPage } from './classroom.page'

interface Props {
  classroom_id: string
}

export const Replacer = ({ classroom_id }: Props) => {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/dashboard/classroom/${classroom_id}`)
  }, [classroom_id, router])

  return <ClassroomPage id={classroom_id} />
}
