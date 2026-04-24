import type { TenantContext } from '@/components/providers/tenant-theme-provider'
import { LandingCtaForm } from './landing-cta-form'

type Props = {
  tenant: TenantContext
}

export function LandingCta({ tenant }: Props) {
  const { brand } = tenant

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
          {brand.tagline ?? "Let's talk about what AI can do for your business."}
        </p>
        <div className="mt-8">
          <LandingCtaForm tenant={tenant} />
        </div>
      </div>
    </section>
  )
}
