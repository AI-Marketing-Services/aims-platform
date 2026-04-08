import type { Metadata } from "next"
import AIReadinessQuizClient from "./AIReadinessQuizClient"

export const metadata: Metadata = {
  title: "AI Readiness Quiz | AI Operator Collective",
  description:
    "Assess your business readiness for AI adoption. Get a personalized score and recommended solutions.",
}

export default function AIReadinessQuizPage() {
  return <AIReadinessQuizClient />
}
