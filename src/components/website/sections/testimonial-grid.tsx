/* eslint-disable @next/next/no-img-element */
import type { TestimonialGridContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: TestimonialGridContent
  brand: SectionBrand
}

/** 3-up testimonial cards. Single-quote layout with avatar + attribution. */
export function TestimonialGrid({ content, brand }: Props) {
  if (content.items.length === 0) return null

  return (
    <section
      id="testimonials"
      className="bg-neutral-50 px-6 py-24 sm:py-28"
      aria-labelledby="testimonial-grid-heading"
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
              id="testimonial-grid-heading"
              className="mt-4 text-balance text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl"
              style={{ fontFamily: brand.fontHeading }}
            >
              {content.heading}
            </h2>
          )}
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {content.items.map((item, idx) => (
            <figure
              key={`${idx}-${item.authorName}`}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm"
            >
              <blockquote className="flex-1">
                <p className="text-base leading-relaxed text-neutral-800">
                  “{item.quote}”
                </p>
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-5">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: brand.primaryColor }}
                    aria-hidden
                  >
                    {item.authorName[0]}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-neutral-900">
                    {item.authorName}
                  </div>
                  {(item.authorTitle || item.authorCompany) && (
                    <div className="truncate text-xs text-neutral-500">
                      {[item.authorTitle, item.authorCompany]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
