/* eslint-disable @next/next/no-img-element */
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react"
import type { FooterContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

const SOCIAL_ICONS = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  github: Github,
} as const

interface Props {
  content: FooterContent
  brand: SectionBrand
}

export function SiteFooter({ content, brand }: Props) {
  const year = new Date().getFullYear()
  const copyright =
    content.copyrightLine?.trim() || `© ${year} ${brand.businessName}. All rights reserved.`

  return (
    <footer className="border-t border-neutral-200 bg-white px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.businessName}
                className="h-7 w-auto object-contain opacity-80"
              />
            ) : (
              <span
                className="text-base font-semibold tracking-tight text-neutral-700"
                style={{ fontFamily: brand.fontHeading }}
              >
                {brand.businessName}
              </span>
            )}
          </div>

          {content.links.length > 0 && (
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              {content.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {content.socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {content.socialLinks.map((s) => {
                const Icon = SOCIAL_ICONS[s.platform]
                return (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="text-neutral-400 transition-colors hover:text-neutral-700"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-8 border-t border-neutral-100 pt-6 text-xs text-neutral-500">
          {copyright}
        </p>
      </div>
    </footer>
  )
}
