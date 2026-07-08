import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/Logo'
import { loginRequest } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import { dismissToast, notifyError, notifyLoading, notifySuccess } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
// Backends on free/cold-start-prone hosting can take a while to wake up —
// if login hasn't resolved by this point, tell the user why rather than
// leaving them staring at a spinner with no explanation.
const SLOW_LOGIN_NOTICE_DELAY_MS = 2000

// Seeded by backend/prisma/seed.js — real accounts, safe to publish here
// since this is a demo app.
const DEMO_ACCOUNTS = [
  { label: 'User', email: 'alice@example.com', password: 'Password123!' },
  { label: 'Admin', email: 'admin@example.com', password: 'Password123!' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    let slowLoginToastId: string | number | null = null
    const slowLoginTimer = setTimeout(() => {
      slowLoginToastId = notifyLoading(
        'Please wait a bit…',
        "The server is spinning up, that's why it's taking some time.",
      )
    }, SLOW_LOGIN_NOTICE_DELAY_MS)

    try {
      const session = await loginRequest(email, password)
      setSession(session)
      notifySuccess('Logged in', `Welcome back, ${session.user.email}`)
      navigate('/app/board')
    } catch (error) {
      notifyError('Login failed', getApiErrorMessage(error, 'Invalid email or password'))
    } finally {
      clearTimeout(slowLoginTimer)
      if (slowLoginToastId !== null) dismissToast(slowLoginToastId)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-primary px-4">
      <div className="pointer-events-none absolute -top-32 -left-20 size-[28rem] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-[-10rem] bottom-[-14rem] size-[34rem] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] size-[22rem] rounded-full bg-white/10" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-white">
        <Logo className="[&_span:last-child]:text-white" />
        <h1 className="mt-6 text-3xl font-light">Task Manager</h1>

        <form onSubmit={handleSubmit} className="mt-8 w-full space-y-4">
          <div className="relative">
            <UserIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/70" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              className="h-12 border-white/40 bg-transparent pl-10 tracking-wide text-white uppercase placeholder:text-white/60 focus-visible:border-white focus-visible:ring-white/30"
            />
          </div>
          <div className="relative">
            <LockIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/70" />
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="h-12 border-white/40 bg-transparent pl-10 tracking-wide text-white placeholder:text-white/60 focus-visible:border-white focus-visible:ring-white/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full bg-white text-base font-semibold text-primary hover:bg-white/90"
          >
            {isSubmitting ? 'Logging in…' : 'LOGIN'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-white/80">
          Haven&apos;t an account?{' '}
          <Link to="/signup" className="font-semibold text-white">
            Sign up
          </Link>
        </p>

        <div className="mt-6 w-full rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
          <p className="mb-2 text-center text-[11px] font-semibold tracking-wide text-white/70 uppercase">
            Demo credentials. click to fill
          </p>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword(account.password)
                }}
                className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-left transition-colors hover:bg-white/20"
              >
                <span className="text-xs font-semibold text-white">{account.label}</span>
                <span className="text-[11px] text-white/70">
                  {account.email} · {account.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
