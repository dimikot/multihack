import { redirect } from 'next/navigation'
import { getSession, SessionUser } from './session'

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) redirect('/')
  return user
}
