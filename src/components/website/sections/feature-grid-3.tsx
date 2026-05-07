import type { FeatureGrid3Content } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"
import { resolveIcon } from "../section-icon"

interface Props {
  content: FeatureGrid3Content
  brand: SectionBrand
}

/**
 * 3-column feature grid. The classic "What we do" / "Capabilities"
 * section that anchors most SaaS landings. Icons are tinted with the
 * operator's primary color in a soft chip so the section reads as
 * branded without flooding the page in primary.
 */
export function FeatureGrid3({ content, brand }: Props) {
  if (content.items.length === 0) return null

  return (
    <section
      id="features"
      className="bg-white px-6 py-24 sm:py-28"
      aria-labelledby="feature-grid-3-heading"
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
              id="feature-grid-3-heading"
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

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {content.items.map((item, idx) => {
            const Icon = resolveIcon(item.iconName)
            return (
              <article
                key={`${idx}-${item.title}`}
                className="group rounded-2xl border border-neutral-200 bg-white p-7 transition-shadow hover:shadow-lg"
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${brand.primaryColor}14`,
                    color: brand.primaryColor,
                  }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>

                <h3
                  className="text-lg font-semibold tracking-tight text-neutral-900"
                  style={{ fontFamily: brand.fontHeading }}
                >
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
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
