/* eslint-disable @next/next/no-img-element */
import { Check } from "lucide-react"
import type { FeatureSplitContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: FeatureSplitContent
  brand: SectionBrand
}

/**
 * Alternating left/right rows of text + visual. Stronger storytelling
 * than the bento grid — each row gets full attention before the visitor
 * scrolls. Used by the Service Pro template to walk through 2-3 service
 * offerings with proof bullets.
 */
export function FeatureSplit({ content, brand }: Props) {
  if (content.rows.length === 0) return null

  return (
    <section
      className="bg-white px-6 py-24 sm:py-28"
      aria-labelledby="feature-split-heading"
    >
      <div className="mx-auto max-w-7xl">
        {(content.eyebrow || content.heading) && (
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
                id="feature-split-heading"
                className="mt-4 text-balance text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl"
                style={{ fontFamily: brand.fontHeading }}
              >
                {content.heading}
              </h2>
            )}
          </div>
        )}

        <div className="mx-auto mt-16 max-w-6xl space-y-24">
          {content.rows.map((row, idx) => {
            const reverse = idx % 2 === 1
            return (
              <div
                key={`${idx}-${row.title}`}
                className={`grid items-center gap-x-12 gap-y-10 lg:grid-cols-2 ${
                  reverse ? "lg:[&>:first-child]:order-last" : ""
                }`}
              >
                <div>
                  <h3
                    className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
                    style={{ fontFamily: brand.fontHeading }}
                  >
                    {row.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-600">
                    {row.body}
                  </p>

                  {row.bullets.length > 0 && (
                    <ul className="mt-6 space-y-3" role="list">
                      {row.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2.5 text-sm text-neutral-700"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: brand.primaryColor }}
                            aria-hidden
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt={row.imageAlt ?? row.title}
                      className="aspect-[4/3] w-full rounded-2xl border border-neutral-200 object-cover shadow-md"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="aspect-[4/3] w-full rounded-2xl shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${brand.primaryColor}1f, ${brand.accentColor}14)`,
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
