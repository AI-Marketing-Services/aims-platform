import type { Metadata } from "next"
import { ApplyForm } from "@/components/community/ApplyForm"

export const metadata: Metadata = {
  title: "Apply | AI Operator Collective",
  description:
    "Apply to the AI Operator Collective. Application-only, operator-led program for professionals building an AI services business.",
}

export default function ApplyPage() {
  return <ApplyForm />
}
