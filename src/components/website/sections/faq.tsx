"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { FaqContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: FaqContent
  brand: SectionBrand
}

/**
 * Accordion FAQ — single-expand for clean reading flow. Built without
 * the headlessui/disclosure dependency so the page bundle stays lean.
 * Marked "use client" because we manage the open index in state. The
 * only client-side component in the pack — every other section is RSC.
 */
export function Faq({ content, brand }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  if (content.items.length === 0) return null

  return (
    <section
      id="faq"
      className="bg-white px-6 py-24 sm:py-28"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          {content.eyebrow && (
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: brand.primaryColor }}
            >
              {content.eyebrow}
            </p>
          )}
          {content.heading && (
            <h2
              id="faq-heading"
              className="mt-4 text-balance text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl"
              style={{ fontFamily: brand.fontHeading }}
            >
              {content.heading}
            </h2>
          )}
        </div>

        <div className="mt-14 divide-y divide-neutral-200 border-y border-neutral-200">
          {content.items.map((item, idx) => {
            const open = openIdx === idx
            return (
              <div key={`${idx}-${item.question}`} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span
                    className="text-base font-semibold text-neutral-900"
                    style={{ fontFamily: brand.fontHeading }}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {item.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
