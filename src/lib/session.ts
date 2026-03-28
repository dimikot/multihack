import { cookies } from 'next/headers'

const SESSION_COOKIE = 'session'

export type SessionUser = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies()
  const encoded = Buffer.from(JSON.stringify(user)).toString('base64')
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
