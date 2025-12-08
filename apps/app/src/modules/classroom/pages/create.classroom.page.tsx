import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClassroom } from '../services'

import { serverConfig as config } from '@/config/server'
import { Replacer } from './replacer'

export async function CreateClassroomPage() {
  const token = (await cookies()).get(config.session.token.cookieName)?.value

  if (!token) return redirect('/login')

  try {
    const classroom = await createClassroom({ token })

    return <Replacer classroom_id={classroom.id} />
  } catch {
    return redirect('/dashboard')
  }
}
