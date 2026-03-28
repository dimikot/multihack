'use server'

import { redirect } from 'next/navigation'
import { workos, clientId } from '@/lib/workos'
import { clearSession } from '@/lib/session'

export async function signIn() {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    clientId,
  })
  redirect(authorizationUrl)
}

export async function signOut() {
  await clearSession()
  redirect('/')
}
