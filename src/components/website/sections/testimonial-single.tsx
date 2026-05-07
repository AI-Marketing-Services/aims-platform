/* eslint-disable @next/next/no-img-element */
import type { TestimonialSingleContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: TestimonialSingleContent
  brand: SectionBrand
}

/**
 * One large quote with a subtle brand-tinted background. The "anchor"
 * social-proof variant when the operator has one star testimonial they
 * want centered (vs three smaller voices on a grid).
 */
export function TestimonialSingle({ content, brand }: Props) {
  return (
    <section
      className="px-6 py-24 sm:py-28"
      style={{
        background: `linear-gradient(180deg, ${brand.primaryColor}0a, transparent 40%)`,
      }}
      aria-label="Customer testimonial"
    >
      <div className="mx-auto max-w-3xl text-center">
        {content.eyebrow && (
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: brand.primaryColor }}
          >
            {content.eyebrow}
          </p>
        )}

        <blockquote
          className="mt-6 text-balance text-2xl font-medium leading-snug tracking-tight text-neutral-900 sm:text-3xl"
          style={{ fontFamily: brand.fontHeading }}
        >
          “{content.quote}”
        </blockquote>

        <figcaption className="mt-10 flex items-center justify-center gap-3">
          {content.avatarUrl ? (
            <img
              src={content.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white"
              style={{ backgroundColor: brand.primaryColor }}
              aria-hidden
            >
              {content.authorName[0]}
            </div>
          )}
          <div className="text-left">
            <div className="text-sm font-semibold text-neutral-900">
              {content.authorName}
            </div>
            {(content.authorTitle || content.authorCompany) && (
              <div className="text-xs text-neutral-500">
                {[content.authorTitle, content.authorCompany]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>
        </figcaption>
      </div>
    </section>
  )
}
