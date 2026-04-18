import { SignIn } from "@clerk/nextjs"

/**
 * Admin-only sign-in. The catch-all segment `[[...sign-in]]` captures
 * Clerk's internal routing (OTP, SSO callback, factor-selection, etc.),
 * so we pass `path` explicitly so the component renders on any nested
 * URL instead of blanking when Clerk routes to e.g. /sign-in/factor-one.
 *
 * fallbackRedirectUrl points admins at the dashboard after sign-in.
 * Role-gating happens in middleware; a non-admin who lands here just
 * gets bounced to /portal/dashboard from the middleware.
 */
export default function SignInPage() {
  return (
    <SignIn
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/admin/dashboard"
    />
  )
}
