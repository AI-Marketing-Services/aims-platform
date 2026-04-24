'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

export type TenantContext = {
  operatorSite: {
    id: string
    subdomain: string
    customDomain: string | null
    themeId: string
    customCss: string | null
    analyticsId: string | null
    seoTitle: string | null
    seoDescription: string | null
    homepageContent: unknown
  }
  brand: {
    businessName: string
    logoUrl: string | null
    faviconUrl: string | null
    brandColor: string
    accentColor: string | null
    fontHeading: string
    tagline: string | null
    oneLiner: string | null
    niche: string | null
    idealClient: string | null
    businessUrl: string | null
    userEmail: string | null
  }
}

const TenantContextInternal = createContext<TenantContext | null>(null)

export function TenantThemeProvider({
  tenant,
  children,
}: {
  tenant: TenantContext
  children: React.ReactNode
}) {
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--tenant-primary', tenant.brand.brandColor)
    root.style.setProperty('--tenant-accent', tenant.brand.accentColor ?? tenant.brand.brandColor)
    root.style.setProperty('--tenant-font-heading', tenant.brand.fontHeading)
  }, [tenant.brand.brandColor, tenant.brand.accentColor, tenant.brand.fontHeading])

  useEffect(() => {
    if (!tenant.operatorSite.customCss) {
      styleRef.current?.remove()
      styleRef.current = null
      return
    }

    // SECURITY TODO: v1 injects raw CSS from DB. Before launch, sanitize with
    // a CSS allowlist parser or scope all rules under `.tenant-scope {}` to
    // prevent potential CSS injection attacks (e.g. url(), @import tricks).
    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      styleRef.current.setAttribute('data-tenant-custom-css', '')
      document.head.appendChild(styleRef.current)
    }

    styleRef.current.textContent = tenant.operatorSite.customCss

    return () => {
      styleRef.current?.remove()
      styleRef.current = null
    }
  }, [tenant.operatorSite.customCss])

  return (
    <TenantContextInternal.Provider value={tenant}>
      {children}
    </TenantContextInternal.Provider>
  )
}

export function useTenant(): TenantContext {
  const ctx = useContext(TenantContextInternal)
  if (!ctx) {
    throw new Error('useTenant must be used inside <TenantThemeProvider>')
  }
  return ctx
}
