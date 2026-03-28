import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { signIn } from './actions'

export default async function Home() {
  const user = await getSession()

  if (user) redirect('/scenes')

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-12 lg:px-24">
      <div className="flex max-w-6xl items-center gap-16">

        {/* Left */}
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            AI-Powered
          </p>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-zinc-900">
            Practice any conversation.<br />
            <span className="text-zinc-400">Before it actually matters.</span>
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-zinc-500">
            AI roleplay that puts you in real scenarios — job interviews, sales calls, difficult talks — and tells you how you did.
          </p>

          <form action={signIn} className="mt-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-80"
            >
              Sign in with WorkOS
            </button>
          </form>
        </div>

        {/* Right — illustration */}
        <div className="hidden flex-shrink-0 lg:block">
          <img src="/hero.png" alt="" width={380} />
        </div>

      </div>
    </main>
  )
}
