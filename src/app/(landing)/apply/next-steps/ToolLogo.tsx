"use client"

import { useState } from "react"

// Small client wrapper so we can onError-fallback to the initial when a
// favicon request fails. Server-component parent can't handle load events
// because event handlers don't serialise across the RSC boundary.
//
// Fetch order:
//   1. Clearbit — highest-quality logos when they have the domain
//   2. Google s2 favicons — reliable fallback, covers every domain
//   3. Initial letter tile — if both image requests fail
export function ToolLogo({ name, domain }: { name: string; domain: string }) {
  const sources = [
    `https://logo.clearbit.com/${domain}?size=80`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ]
  const [idx, setIdx] = useState(0)
  const [broken, setBroken] = useState(false)

  return (
    <div className="relative flex-shrink-0 w-9 h-9 rounded-md bg-[#FDF2F2] border border-[#E3E3E3] overflow-hidden flex items-center justify-center">
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center font-semibold text-crimson text-sm pointer-events-none"
      >
        {name[0]}
      </span>
      {!broken && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources[idx]}
          alt={`${name} logo`}
          width={36}
          height={36}
          loading="lazy"
          className="relative w-6 h-6 object-contain"
          onError={() => {
            if (idx < sources.length - 1) setIdx((i) => i + 1)
            else setBroken(true)
          }}
        />
      )}
    </div>
  )
}
