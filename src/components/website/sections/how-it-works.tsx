import type { HowItWorksContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: HowItWorksContent
  brand: SectionBrand
}

/**
 * Numbered steps in a horizontal flow. Each step's number badge wears
 * the operator's primary color, with a connecting line on lg+ to imply
 * sequence. On mobile the line is hidden and steps stack.
 */
export function HowItWorks({ content, brand }: Props) {
  if (content.steps.length === 0) return null

  return (
    <section
      id="how-it-works"
      className="bg-white px-6 py-24 sm:py-28"
      aria-labelledby="how-it-works-heading"
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
              id="how-it-works-heading"
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

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3 lg:gap-6">
          {content.steps.map((step, idx) => (
            <div
              key={`${idx}-${step.title}`}
              className="relative flex flex-col items-center text-center"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shadow-sm"
                style={{ backgroundColor: brand.primaryColor }}
                aria-hidden
              >
                {idx + 1}
              </div>

              <h3
                className="mt-5 text-lg font-semibold tracking-tight text-neutral-900"
                style={{ fontFamily: brand.fontHeading }}
              >
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
