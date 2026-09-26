import { Button } from '@repo/ui-web/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@repo/ui-web/components/card'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { AuthShell } from '#components/auth/auth-shell'
import { GoogleMark } from '#components/auth/google-mark'
import { signInAsDemo, startGoogleSignIn } from '#lib/auth-oauth'

const DEMO_CONFIGURED =
  !!import.meta.env.VITE_DEMO_USER_EMAIL &&
  !!import.meta.env.VITE_DEMO_USER_PASSWORD

function LoginPage() {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setIsPending(true)
    setErrorMessage(null)

    const { error } = await startGoogleSignIn()

    if (error) {
      setErrorMessage(error.message)
      setIsPending(false)
    }
  }

  return (
    <AuthShell>
      <Card className="mx-auto w-full max-w-md rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in to 8x Fathom</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            type="button"
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 hover:text-background w-full"
            disabled={isPending}
            onClick={() => {
              void handleGoogleSignIn()
            }}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <GoogleMark />}
            Continue with Google
          </Button>
          {errorMessage ? (
            <p className="text-destructive text-sm">{errorMessage}</p>
          ) : null}
          {DEMO_CONFIGURED ? <DemoSignIn /> : null}
          <p className="text-muted-foreground text-center text-xs leading-relaxed">
            By continuing, you agree to our{' '}
            <Link
              to="/terms"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function DemoSignIn() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDemoSignIn() {
    setIsPending(true)
    setError(null)
    const { error: signInError } = await signInAsDemo()
    if (signInError) {
      setError(signInError.message)
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs font-medium">
          or try without signing up
        </span>
        <span className="bg-border h-px flex-1" />
      </div>
      <button
        type="button"
        disabled={isPending}
        className="bg-demo/10 text-demo-foreground border-demo/40 hover:bg-demo/20 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60"
        onClick={() => {
          void handleDemoSignIn()
        }}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span className="text-base leading-none">🧪</span>
        )}
        Continue as demo user to explore
      </button>
      {error ? (
        <p className="text-destructive text-center text-xs">{error}</p>
      ) : null}
    </div>
  )
}

export { LoginPage }
