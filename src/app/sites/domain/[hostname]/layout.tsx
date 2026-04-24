import type { Metadata } from 'next'
import Script from 'next/script'
import { requireTenantByCustomDomain } from '@/lib/tenant/resolve-tenant'
import { TenantThemeProvider } from '@/components/providers/tenant-theme-provider'

type Props = {
  children: React.ReactNode
  params: Promise<{ hostname: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hostname } = await params
  const { resolveTenantByCustomDomain } = await import('@/lib/tenant/resolve-tenant')
  const tenant = await resolveTenantByCustomDomain(hostname)
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

export default async function DomainSiteLayout({ children, params }: Props) {
  const { hostname } = await params
  const tenant = await requireTenantByCustomDomain(hostname)

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
