'use server'

import { redirect } from 'next/navigation'
import { getWorkOS, getClientId } from '@/lib/workos'
import { clearSession } from '@/lib/session'

export async function signIn() {
  const authorizationUrl = getWorkOS().userManagement.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    clientId: getClientId(),
  })
  redirect(authorizationUrl)
}

export async function signOut() {
  await clearSession()
  redirect('/')
}
