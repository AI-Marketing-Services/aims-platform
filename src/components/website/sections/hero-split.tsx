/* eslint-disable @next/next/no-img-element */
import type { HeroSplitContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: HeroSplitContent
  brand: SectionBrand
}

/**
 * Two-column hero — copy left, product visual right. The empty image
 * slot falls back to a tasteful placeholder gradient so an operator
 * who hasn't uploaded a screenshot still gets a polished render.
 */
export function HeroSplit({ content, brand }: Props) {
  const primaryHref = content.primaryCtaHref?.trim() || brand.bookingUrl
  const primaryLabel = content.primaryCtaLabel?.trim() || "Get started"

  return (
    <section
      className="relative bg-white px-6 py-24 sm:py-28"
      aria-labelledby="hero-split-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-x-12 gap-y-12 lg:grid-cols-2">
        <div>
          {content.eyebrow && (
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: brand.primaryColor }}
            >
              {content.eyebrow}
            </p>
          )}

          <h1
            id="hero-split-heading"
            className="mt-5 text-balance text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl"
            style={{ fontFamily: brand.fontHeading }}
          >
            {content.headline}
          </h1>

          {content.subheadline && (
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              {content.subheadline}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
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

        {/* Visual column. Falls back to a brand-tinted gradient block
            when no image is uploaded so the layout stays balanced. */}
        <div className="relative">
          {content.imageUrl ? (
            <img
              src={content.imageUrl}
              alt={content.imageAlt ?? brand.businessName}
              className="aspect-[4/3] w-full rounded-2xl border border-neutral-200 object-cover shadow-xl"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden="true"
              className="aspect-[4/3] w-full rounded-2xl shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${brand.primaryColor}33, ${brand.accentColor}22)`,
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
