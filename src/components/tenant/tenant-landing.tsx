import type { TenantContext } from '@/components/providers/tenant-theme-provider'
import { LandingHero } from './landing-hero'
import { LandingServices } from './landing-services'
import { LandingCta } from './landing-cta'

type Props = {
  tenant: TenantContext
}

export function TenantLanding({ tenant }: Props) {
  return (
    <main>
      <LandingHero tenant={tenant} />
      <LandingServices tenant={tenant} />
      <LandingCta tenant={tenant} />
    </main>
  )
}
