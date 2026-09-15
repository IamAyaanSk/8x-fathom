import { Button } from '@repo/ui-web/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@repo/ui-web/components/card'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { AuthShell } from '#components/auth/auth-shell'
import { GoogleMark } from '#components/auth/google-mark'
import { authClient } from '#lib/auth-client'

function LoginPage() {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setIsPending(true)
    setErrorMessage(null)

    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/'
    })

    if (error) {
      console.error(error)
      setErrorMessage(error.message ?? 'Could not start Google sign-in.')
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
          <p className="text-muted-foreground text-center text-sm">
            New here? Continue with Google to get started.
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

export { LoginPage }
