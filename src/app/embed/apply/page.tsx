import type { Metadata } from "next"
import { EmbedApplyForm } from "@/components/community/EmbedApplyForm"

export const metadata: Metadata = {
  title: "Apply | AI Operator Collective",
  description: "Apply to the AI Operator Collective.",
}

export default function EmbedApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <EmbedApplyForm />
    </div>
  )
}
