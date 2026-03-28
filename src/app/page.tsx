import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { signIn } from './actions'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const user = await getSession()

  if (user) redirect('/scenes')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-8">
      <div className="flex w-full max-w-5xl items-center gap-16">
        {/* Left side */}
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">
            Lorem Ipsum
            <br />
            <span className="text-primary/70">Dolores</span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, nemo enim ipsam voluptatem quia
            voluptas sit aspernatur aut odit aut fugit.
          </p>

          <form action={signIn}>
            <Button type="submit" size="lg">
              Log in with WorkOS
            </Button>
          </form>
        </div>

        {/* Right side — clipart */}
        <div className="hidden flex-shrink-0 md:block">
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Background circle */}
            <circle cx="160" cy="160" r="140" fill="currentColor" className="text-muted" />

            {/* Rocket body */}
            <path
              d="M160 60 C160 60 200 100 200 170 L160 200 L120 170 C120 100 160 60 160 60Z"
              fill="currentColor"
              className="text-primary"
            />

            {/* Rocket window */}
            <circle cx="160" cy="140" r="18" fill="currentColor" className="text-background" />
            <circle cx="160" cy="140" r="12" fill="currentColor" className="text-primary/40" />

            {/* Left fin */}
            <path
              d="M120 170 L90 210 L120 195Z"
              fill="currentColor"
              className="text-primary/70"
            />

            {/* Right fin */}
            <path
              d="M200 170 L230 210 L200 195Z"
              fill="currentColor"
              className="text-primary/70"
            />

            {/* Exhaust flames */}
            <ellipse cx="152" cy="210" rx="10" ry="18" fill="#fb923c" />
            <ellipse cx="168" cy="213" rx="8" ry="14" fill="#fde047" />

            {/* Stars */}
            <circle cx="80" cy="90" r="4" fill="currentColor" className="text-foreground/30" />
            <circle cx="240" cy="100" r="3" fill="currentColor" className="text-foreground/30" />
            <circle cx="250" cy="200" r="4" fill="currentColor" className="text-foreground/30" />
            <circle cx="70" cy="210" r="3" fill="currentColor" className="text-foreground/30" />
            <circle cx="100" cy="260" r="2" fill="currentColor" className="text-foreground/20" />
            <circle cx="220" cy="255" r="2" fill="currentColor" className="text-foreground/20" />
          </svg>
        </div>
      </div>
    </main>
  )
}
