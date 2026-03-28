import { NextRequest, NextResponse } from 'next/server'
import { workos, clientId } from '@/lib/workos'
import { setSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    const { user } = await workos.userManagement.authenticateWithCode({
      code,
      clientId,
    })

    await setSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    return NextResponse.redirect(new URL('/', request.url))
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
