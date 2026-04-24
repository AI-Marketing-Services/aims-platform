import type { TenantContext } from '@/components/providers/tenant-theme-provider'

type Service = {
  title: string
  description: string
  icon?: string
}

const DEFAULT_SERVICES: Service[] = [
  {
    title: 'Content Engine',
    description:
      'AI-generated content pipelines that produce blog posts, social copy, and email sequences tailored to your brand voice — consistently, at scale.',
  },
  {
    title: 'CRM + Lead Scout',
    description:
      'Automated lead research, enrichment, and CRM updates so your team focuses on closing, not data entry. Every prospect arrives pre-qualified.',
  },
  {
    title: 'Done-for-You AI Setup',
    description:
      'End-to-end deployment of AI workflows inside your existing stack. We handle the build, testing, and handoff so you are live in days, not months.',
  },
]

function parseServices(homepageContent: unknown): Service[] | null {
  if (!homepageContent || typeof homepageContent !== 'object') return null
  const content = homepageContent as Record<string, unknown>
  if (!Array.isArray(content.services)) return null
  const services = content.services as unknown[]
  if (services.length === 0) return null

  const parsed: Service[] = []
  for (const item of services) {
    if (!item || typeof item !== 'object') continue
    const svc = item as Record<string, unknown>
    if (typeof svc.title !== 'string' || typeof svc.description !== 'string') continue
    parsed.push({
      title: svc.title,
      description: svc.description,
      icon: typeof svc.icon === 'string' ? svc.icon : undefined,
    })
  }
  return parsed.length > 0 ? parsed : null
}

type Props = {
  tenant: TenantContext
}

export function LandingServices({ tenant }: Props) {
  const services = parseServices(tenant.operatorSite.homepageContent) ?? DEFAULT_SERVICES

  return (
    <section className="py-20 px-4 bg-[#141923]" aria-labelledby="services-heading">
      <div className="mx-auto max-w-5xl">
        <h2
          id="services-heading"
          className="text-center text-2xl font-bold tracking-tight text-[#F0EBE0] sm:text-3xl md:text-4xl"
        >
          What we do for you
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[#F0EBE0]/60">
          {tenant.brand.tagline ?? 'Practical AI, delivered.'}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <article
              key={svc.title}
              className="group rounded-2xl border border-white/10 bg-[#08090D] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--tenant-primary)] hover:shadow-[0_0_24px_color-mix(in_srgb,var(--tenant-primary)_30%,transparent)]"
            >
              {svc.icon && (
                <div className="mb-4 text-2xl" aria-hidden="true">
                  {svc.icon}
                </div>
              )}
              <h3 className="text-base font-semibold text-[#F0EBE0]">{svc.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#F0EBE0]/60">{svc.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
