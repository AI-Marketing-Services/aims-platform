"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { FollowUpDraftDialog } from "./FollowUpDraftDialog"

interface FollowUpButtonProps {
  dealId: string
  companyName: string
  defaultRecipientEmail: string | null
}

/**
 * FollowUpButton — small trigger that opens the FollowUpDraftDialog.
 * Lives on the Deal detail page next to the proposal generator.
 */
export function FollowUpButton({
  dealId,
  companyName,
  defaultRecipientEmail,
}: FollowUpButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-left transition-all"
      >
        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Draft follow-up email</p>
          <p className="text-[11px] text-muted-foreground">
            AI reads this lead&apos;s profile and writes a personalized follow-up
          </p>
        </div>
      </button>
      <FollowUpDraftDialog
        dealId={dealId}
        companyName={companyName}
        defaultRecipientEmail={defaultRecipientEmail}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
