import type { HeroCenterContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: HeroCenterContent
  brand: SectionBrand
}

/**
 * Centered hero — eyebrow, big headline, supporting subhead, dual CTAs.
 * Subtle radial gradient using the operator's primary color picks up
 * the brand without dominating the type. Modern SaaS proportions:
 * tight tracking, comfortable line height, generous vertical padding.
 */
export function HeroCenter({ content, brand }: Props) {
  const primaryHref = content.primaryCtaHref?.trim() || brand.bookingUrl
  const primaryLabel = content.primaryCtaLabel?.trim() || "Get started"

  return (
    <section
      className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32"
      aria-labelledby="hero-center-heading"
    >
      {/* Subtle radial — operator brand wash, never overwhelming */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[600px] opacity-[0.08]"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 50% 0%, ${brand.primaryColor}, transparent 60%)`,
        }}
      />

      <div className="mx-auto max-w-3xl text-center">
        {content.eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: brand.primaryColor }}
          >
            {content.eyebrow}
          </p>
        )}

        <h1
          id="hero-center-heading"
          className="mt-6 text-balance text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl"
          style={{ fontFamily: brand.fontHeading }}
        >
          {content.headline}
        </h1>

        {content.subheadline && (
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            {content.subheadline}
          </p>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={primaryHref}
            className="inline-flex items-center gap-1.5 rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {primaryLabel}
          </a>

          {content.secondaryCtaLabel && (
            <a
              href={content.secondaryCtaHref?.trim() || "#features"}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              {content.secondaryCtaLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
