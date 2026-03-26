"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, PhoneCall, RefreshCw } from "lucide-react"

const VOICE_TRANSCRIPT = [
  { role: "agent", text: "Hi, this is AIMS AI calling for River City Ford. Is this Mike?" },
  { role: "lead", text: "Yeah, that's me." },
  { role: "agent", text: "Great! We're following up on the recall notice for your 2021 Explorer. We have a service bay available this Thursday at 10am - does that work?" },
  { role: "lead", text: "Thursday at 10 works actually." },
  { role: "agent", text: "Perfect, I've got you down. We'll send a confirmation and reminder the morning of. Anything else I can help with?" },
  { role: "lead", text: "No that's it, thanks." },
  { role: "agent", text: "You're all set. See you Thursday, Mike! Have a great day." },
]

export function AICallingDemo() {
  const [shown, setShown] = useState(0)
  const [playing, setPlaying] = useState(true)
  useEffect(() => {
    if (!playing) return
    if (shown >= VOICE_TRANSCRIPT.length) return
    const t = setTimeout(() => setShown((s) => s + 1), 1100)
    return () => clearTimeout(t)
  }, [shown, playing])

  function restart() { setShown(0); setPlaying(true) }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <motion.div
          animate={playing && shown < VOICE_TRANSCRIPT.length ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="h-8 w-8 rounded-full bg-green-950/30 flex items-center justify-center"
        >
          <PhoneCall className="h-4 w-4 text-green-400" />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Voice Agent - Ford Dealership</p>
          <p className="text-xs text-muted-foreground">Recall follow-up · 247 calls/day handled</p>
        </div>
        {playing && shown < VOICE_TRANSCRIPT.length && (
          <div className="ml-auto flex gap-0.5">
            {[1,2,3,4,5].map((b) => (
              <motion.div
                key={b}
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: b * 0.1 }}
                className="w-0.5 h-5 bg-green-400 rounded-full origin-bottom"
              />
            ))}
          </div>
        )}
        {shown >= VOICE_TRANSCRIPT.length && (
          <button onClick={restart} className="ml-auto text-xs font-medium text-muted-foreground hover:text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Replay
          </button>
        )}
      </div>
      <div className="space-y-1.5 min-h-[160px]">
        {VOICE_TRANSCRIPT.slice(0, shown).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: line.role === "agent" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${line.role === "lead" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[82%] rounded-xl px-3 py-2 text-xs leading-snug"
              style={{
                backgroundColor: line.role === "agent" ? "rgba(59,130,246,0.15)" : "rgba(34,197,94,0.15)",
                color: line.role === "agent" ? "#93C5FD" : "#86EFAC",
              }}
            >
              {line.text}
            </div>
          </motion.div>
        ))}
      </div>
      {shown >= VOICE_TRANSCRIPT.length && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-950/30 border border-green-800 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-400">Appointment booked · CRM updated · Confirmation SMS sent</span>
        </motion.div>
      )}
    </div>
  )
}
