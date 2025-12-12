export async function getClassroomSession(): Promise<string> {
  const response = await fetch('/api/classroom/session')

  if (!response.ok) throw new Error('Invalid Result')
  const { token } = await response.json()

  return token
}
