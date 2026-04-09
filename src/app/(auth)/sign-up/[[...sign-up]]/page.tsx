"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignUpForm() {
  const searchParams = useSearchParams()
  const refFromUrl = searchParams.get("ref")
  const dubId = searchParams.get("dub_id")

  // Priority: dub_id (server-side tracking) > ref param > aims_ref cookie (legacy)
  const refCode = dubId ?? refFromUrl ?? getCookie("aims_ref") ?? undefined

  return (
    <SignUp
      unsafeMetadata={refCode ? { referralCode: refCode } : undefined}
    />
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
