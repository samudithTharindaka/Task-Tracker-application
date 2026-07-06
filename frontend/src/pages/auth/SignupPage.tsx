import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo'
import { registerRequest } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/toast'

export function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Name is UI-only: the backend's /register endpoint only accepts
      // { email, password } and always creates a USER role.
      await registerRequest(email, password)
      notifySuccess('Account created', 'Sign in to continue')
      navigate('/login')
    } catch (error) {
      notifyError('Could not create account', getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh">
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-3xl font-light">Get Started Now</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-base font-semibold">
              {isSubmitting ? 'Signing up…' : 'Signup'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Have an account?{' '}
            <Link to="/login" className="font-medium text-primary">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block lg:w-1/2">
        <div className="pointer-events-none absolute top-1/3 -left-24 size-[26rem] rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-[-10rem] left-1/4 size-[30rem] rounded-full bg-white/10" />
      </div>
    </div>
  )
}
