import type { Metadata } from 'next'
import Script from 'next/script'
import { requireTenantBySubdomain } from '@/lib/tenant/resolve-tenant'
import { TenantThemeProvider } from '@/components/providers/tenant-theme-provider'
import { setAttributionCookie } from '@/lib/tenant/attribution'

type Props = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { resolveTenantBySubdomain } = await import('@/lib/tenant/resolve-tenant')
  const tenant = await resolveTenantBySubdomain(slug)
  if (!tenant) return {}

  return {
    title: tenant.operatorSite.seoTitle ?? tenant.brand.businessName,
    description: tenant.operatorSite.seoDescription ?? tenant.brand.tagline ?? undefined,
    icons: tenant.brand.faviconUrl ? { icon: tenant.brand.faviconUrl } : undefined,
    openGraph: {
      title: tenant.operatorSite.seoTitle ?? tenant.brand.businessName,
      description: tenant.operatorSite.seoDescription ?? tenant.brand.tagline ?? undefined,
    },
  }
}

export default async function SlugSiteLayout({ children, params }: Props) {
  const { slug } = await params
  const tenant = await requireTenantBySubdomain(slug)

  // First-touch attribution: drop a 30-day cookie tying this visitor
  // to the reseller whose site they landed on. Lead-capture endpoints
  // across the platform check this cookie as a fallback when a body
  // doesn't already carry a resellerId.
  await setAttributionCookie(tenant.reseller.id)

  return (
    <TenantThemeProvider tenant={tenant}>
      {tenant.operatorSite.analyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tenant.operatorSite.analyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tenant.operatorSite.analyticsId}');
            `}
          </Script>
        </>
      )}
      {children}
    </TenantThemeProvider>
  )
}
