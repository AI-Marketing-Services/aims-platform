import type { TenantContext } from '@/components/providers/tenant-theme-provider'

type Props = {
  tenant: TenantContext
}

function resolveCtaHref(brand: TenantContext['brand']): string {
  if (brand.businessUrl?.includes('calendly.com')) {
    return brand.businessUrl
  }
  if (brand.userEmail) {
    return `mailto:${brand.userEmail}`
  }
  if (brand.businessUrl) {
    return brand.businessUrl
  }
  return '#contact'
}

function resolveCtaLabel(brand: TenantContext['brand']): string {
  if (brand.businessUrl?.includes('calendly.com')) {
    return 'Book a call'
  }
  return 'Get in touch'
}

export function LandingCta({ tenant }: Props) {
  const { brand } = tenant
  const href = resolveCtaHref(brand)
  const ctaLabel = resolveCtaLabel(brand)

  return (
    <section
      id="cta"
      className="py-20 px-4"
      style={{ backgroundColor: 'var(--tenant-primary)' }}
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="cta-heading"
          className="text-2xl font-bold tracking-tight text-[#08090D] sm:text-3xl md:text-4xl"
        >
          Ready to work with {brand.businessName}?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[#08090D]/70">
          {brand.tagline ?? 'Let&apos;s talk about what AI can do for your business.'}
        </p>
        <div className="mt-8">
          <a
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            className="inline-flex items-center gap-2 rounded-md bg-[#08090D] px-7 py-3.5 text-sm font-semibold text-[#F0EBE0] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08090D]"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
