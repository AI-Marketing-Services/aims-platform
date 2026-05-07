import { Check } from "lucide-react"
import type { Pricing3Content } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: Pricing3Content
  brand: SectionBrand
}

/**
 * 3-tier pricing table. The middle tier (or any tier flagged
 * `highlight: true`) is rendered with the operator's primary color
 * border + a "Most popular" badge to direct attention.
 */
export function Pricing3({ content, brand }: Props) {
  if (content.tiers.length === 0) return null

  return (
    <section
      id="pricing"
      className="bg-white px-6 py-24 sm:py-28"
      aria-labelledby="pricing-3-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
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
              id="pricing-3-heading"
              className="mt-4 text-balance text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl"
              style={{ fontFamily: brand.fontHeading }}
            >
              {content.heading}
            </h2>
          )}
          {content.subheading && (
            <p className="mt-4 text-base leading-relaxed text-neutral-600">
              {content.subheading}
            </p>
          )}
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          {content.tiers.map((tier, idx) => {
            const ctaHref = tier.ctaHref?.trim() || brand.bookingUrl
            const ctaLabel = tier.ctaLabel?.trim() || "Get started"
            return (
              <div
                key={`${idx}-${tier.name}`}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  tier.highlight
                    ? "shadow-xl"
                    : "border-neutral-200 bg-white"
                }`}
                style={
                  tier.highlight
                    ? {
                        borderColor: brand.primaryColor,
                        background: `linear-gradient(180deg, ${brand.primaryColor}08 0%, #ffffff 60%)`,
                      }
                    : undefined
                }
              >
                {tier.highlight && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    Most popular
                  </span>
                )}

                <h3
                  className="text-base font-semibold text-neutral-900"
                  style={{ fontFamily: brand.fontHeading }}
                >
                  {tier.name}
                </h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-neutral-500">
                      /{tier.cadence}
                    </span>
                  )}
                </div>

                {tier.description && (
                  <p className="mt-3 text-sm text-neutral-600">{tier.description}</p>
                )}

                {tier.features.length > 0 && (
                  <ul className="mt-6 flex-1 space-y-3" role="list">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 flex-shrink-0"
                          style={{ color: brand.primaryColor }}
                          aria-hidden
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <a
                  href={ctaHref}
                  className={`mt-7 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
                    tier.highlight
                      ? "text-white shadow-sm"
                      : "border border-neutral-300 text-neutral-700 hover:border-neutral-400"
                  }`}
                  style={
                    tier.highlight
                      ? { backgroundColor: brand.primaryColor }
                      : undefined
                  }
                >
                  {ctaLabel}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
