/* eslint-disable @next/next/no-img-element */
import type { LogoBarContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: LogoBarContent
  brand: SectionBrand
}

/**
 * "Trusted by" social-proof strip. When an operator hasn't uploaded
 * partner logos we render their company names as monochrome wordmarks —
 * still useful proof, without dead-empty slots.
 */
export function LogoBar({ content, brand }: Props) {
  if (content.logos.length === 0) return null

  return (
    <section className="bg-neutral-50 px-6 py-14" aria-label="Trusted by">
      <div className="mx-auto max-w-7xl">
        {content.caption && (
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {content.caption}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 items-center gap-x-8 gap-y-6 opacity-70 sm:grid-cols-3 lg:grid-cols-6">
          {content.logos.map((logo) => (
            <div
              key={logo.name}
              className="flex h-10 items-center justify-center"
              title={logo.name}
            >
              {logo.imageUrl ? (
                <img
                  src={logo.imageUrl}
                  alt={logo.name}
                  className="max-h-10 w-auto object-contain grayscale"
                  loading="lazy"
                />
              ) : (
                <span
                  className="text-sm font-semibold tracking-tight text-neutral-700"
                  style={{ fontFamily: brand.fontHeading }}
                >
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
