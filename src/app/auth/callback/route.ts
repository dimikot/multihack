import { NextRequest, NextResponse } from 'next/server'
import { getWorkOS, getClientId } from '@/lib/workos'
import { setSession } from '@/lib/session'

const appUrl = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', appUrl))
  }

  try {
    const { user } = await getWorkOS().userManagement.authenticateWithCode({
      code,
      clientId: getClientId(),
    })

    await setSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    return NextResponse.redirect(new URL('/', appUrl))
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_failed', appUrl))
  }
}
