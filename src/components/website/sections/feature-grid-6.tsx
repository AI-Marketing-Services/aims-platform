import type { FeatureGrid6Content } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"
import { resolveIcon } from "../section-icon"

interface Props {
  content: FeatureGrid6Content
  brand: SectionBrand
}

/**
 * Bento-style 6-feature grid. Wider than the 3-up to suit feature-heavy
 * SaaS pitches. The first cell (top-left) gets a light brand wash to
 * anchor the eye and break up the otherwise uniform grid.
 */
export function FeatureGrid6({ content, brand }: Props) {
  if (content.items.length === 0) return null

  return (
    <section
      id="capabilities"
      className="bg-neutral-50 px-6 py-24 sm:py-28"
      aria-labelledby="feature-grid-6-heading"
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
              id="feature-grid-6-heading"
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

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, idx) => {
            const Icon = resolveIcon(item.iconName)
            const accent = idx === 0
            return (
              <article
                key={`${idx}-${item.title}`}
                className="rounded-2xl border border-neutral-200 bg-white p-6"
                style={
                  accent
                    ? {
                        background: `linear-gradient(180deg, ${brand.primaryColor}10 0%, #ffffff 70%)`,
                      }
                    : undefined
                }
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${brand.primaryColor}14`,
                    color: brand.primaryColor,
                  }}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </div>

                <h3
                  className="text-base font-semibold tracking-tight text-neutral-900"
                  style={{ fontFamily: brand.fontHeading }}
                >
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {item.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
