"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"

export default function UnsubscribeClient() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    if (emailParam) setEmail(emailParam)
    if (tokenParam) {
      setToken(tokenParam)
      setHasToken(true)
    }
  }, [searchParams])

  // Auto-submit if both email and token come from URL (clicked from email)
  useEffect(() => {
    if (hasToken && email && token && status === "idle") {
      handleUnsubscribe(email, token)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, email, token])

  async function handleUnsubscribe(submitEmail: string, submitToken: string) {
    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submitEmail, token: submitToken }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to unsubscribe")
      }

      setStatus("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
      setStatus("error")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleUnsubscribe(email, token)
  }

  return (
    <section className="py-24 min-h-[60vh] flex items-center">
      <div className="container mx-auto max-w-md px-4">
        <div className="bg-card border border-border rounded-2xl p-8">
          {status === "success" ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
              <p className="text-muted-foreground">
                You have been removed from our mailing list. You will no longer receive marketing emails from AIMS.
              </p>
            </div>
          ) : hasToken && status === "loading" ? (
            <div className="text-center space-y-4">
              <Mail className="h-10 w-10 text-primary mx-auto animate-pulse" />
              <h1 className="text-2xl font-bold text-foreground">Processing...</h1>
              <p className="text-muted-foreground">Unsubscribing you from marketing emails.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {hasToken
                    ? "Confirm your email to unsubscribe."
                    : "Use the link in your email to unsubscribe, or contact us at irtaza@modern-amenities.com."}
                </p>
              </div>
              {hasToken ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {status === "error" && (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {errorMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {status === "loading" ? "Processing..." : "Unsubscribe"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  For security, unsubscribe links are signed. Please click the unsubscribe link in your email to proceed.
                </p>
              )}
              <p className="mt-4 text-xs text-center text-muted-foreground">
                This will remove you from all AIMS marketing emails. Transactional emails (account updates, support replies) will continue.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
