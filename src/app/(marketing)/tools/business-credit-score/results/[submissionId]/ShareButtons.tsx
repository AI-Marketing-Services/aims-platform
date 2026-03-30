"use client"

import { useState } from "react"
import { Copy, Linkedin, Twitter } from "lucide-react"

interface Props {
  shareUrl: string
  shareText: string
}

export function ShareButtons({ shareUrl, shareText }: Props) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-border text-foreground rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
      >
        <Twitter className="w-3.5 h-3.5" />
        Share on X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:bg-[#0958a8] transition-colors"
      >
        <Linkedin className="w-3.5 h-3.5" />
        Share on LinkedIn
      </a>
    </div>
  )
}
