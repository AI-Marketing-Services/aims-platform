import Image from 'next/image'
import type { TenantContext } from '@/components/providers/tenant-theme-provider'

type Props = {
  tenant: TenantContext
}

export function LandingHero({ tenant }: Props) {
  const { brand } = tenant
  const headline = brand.oneLiner ?? brand.tagline ?? 'AI-powered services for your business'
  const subheadline = brand.idealClient ?? brand.niche ?? null
  const fontHeading = brand.fontHeading ?? 'DM Sans'

  return (
    <section
      className="relative flex min-h-[85dvh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:py-32 text-center"
      aria-labelledby="hero-headline"
    >
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--tenant-primary) 12%, transparent), transparent 70%), #08090D',
        }}
      />

      {/* Logo or business name */}
      <div className="mb-8">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={`${brand.businessName} logo`}
            width={160}
            height={48}
            className="mx-auto h-12 w-auto object-contain"
            priority
          />
        ) : (
          <span className="text-base font-semibold tracking-widest uppercase text-[color:var(--tenant-primary)]">
            {brand.businessName}
          </span>
        )}
      </div>

      {/* Headline */}
      <h1
        id="hero-headline"
        className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#F0EBE0] sm:text-5xl md:text-6xl"
        style={{ fontFamily: fontHeading }}
      >
        {headline}
      </h1>

      {/* Subheadline */}
      {subheadline && (
        <p className="mx-auto mt-6 max-w-xl text-lg text-[#F0EBE0]/70 sm:text-xl">
          {subheadline}
        </p>
      )}

      {/* CTA */}
      <div className="mt-10">
        <a
          href="#cta"
          className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 text-sm font-semibold text-[#08090D] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: 'var(--tenant-primary)' }}
        >
          Get started
        </a>
      </div>
    </section>
  )
}
