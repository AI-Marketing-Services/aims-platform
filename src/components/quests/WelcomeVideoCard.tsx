"use client"

import { useState } from "react"
import { useQuests } from "./QuestContext"
import { PlayCircle, X, Sparkles } from "lucide-react"

/**
 * Day-Zero card. Renders only while the user has the `lay_of_the_land`
 * quest still pending. Fires `welcome_video.watched` when the user clicks
 * "I watched it" or completes the inline player.
 *
 * Self-hides once the underlying quest is COMPLETED/CLAIMED.
 */
export function WelcomeVideoCard() {
  const { progress, fireEvent, loading } = useQuests()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (loading || !progress) return null

  const layQuest = progress.byCategory.main.find(
    (q) => q.key === "lay_of_the_land",
  )
  if (!layQuest) return null
  if (layQuest.status === "COMPLETED" || layQuest.status === "CLAIMED") return null
  if (dismissed) return null

  return (
    <>
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">
              60-second welcome · Tier 0
            </p>
            <h3 className="text-base font-bold text-foreground mb-1">
              The lay of the land
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              A quick tour of where everything lives — CRM, audits, scripts,
              the AI co-pilot. Pour a coffee, watch this, then we'll pick your
              first quest together.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(true)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-deep hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Watch the tour
              </button>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                +{layQuest.xpReward} XP · +{layQuest.creditReward} credits
              </span>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <VideoModal
          onClose={() => setOpen(false)}
          onComplete={async () => {
            await fireEvent("welcome_video.watched")
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function VideoModal({
  onClose,
  onComplete,
}: {
  onClose: () => void
  onComplete: () => void | Promise<void>
}) {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-1">
          Welcome to the Collective
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          A 60-second tour of the platform.
        </p>

        {/* Embed placeholder. Replace src with your actual hosted video URL
            (Vimeo / YouTube unlisted / Mux). Until then, a clear call-out. */}
        <div className="aspect-video w-full rounded-lg border border-border bg-deep flex items-center justify-center text-center p-8">
          <div>
            <PlayCircle className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="text-sm text-foreground font-semibold mb-1">
              Welcome video coming soon
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              We're recording the official 60-second walkthrough. For now,
              the dashboard, the Client CRM, and the AI co-pilot in the bottom
              right are your three starting points.
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-deep accent-primary"
          />
          I've got the lay of the land — let's go.
        </label>

        <button
          onClick={() => acknowledged && onComplete()}
          disabled={!acknowledged}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-deep hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Mark complete
        </button>
      </div>
    </div>
  )
}
