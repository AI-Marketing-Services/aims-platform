import type { Metadata } from 'next'
import Script from 'next/script'
import { requireTenantBySubdomain } from '@/lib/tenant/resolve-tenant'
import { TenantThemeProvider } from '@/components/providers/tenant-theme-provider'

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
