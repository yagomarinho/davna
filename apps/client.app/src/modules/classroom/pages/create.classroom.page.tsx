import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClassroom } from '../services'

import { serverConfig as config } from '@/config/server'
import { Replacer } from './replacer'

export const CreateClassroomPage = async () => {
  const token = (await cookies()).get(config.session.token.cookieName)?.value

  if (!token) return redirect('/login')

  let classroom: any
  try {
    classroom = await createClassroom({ token })
  } catch {
    return redirect('/dashboard')
  }
  return <Replacer classroom_id={classroom.id} />
}
