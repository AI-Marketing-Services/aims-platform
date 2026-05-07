/* eslint-disable @next/next/no-img-element */
import type { NavbarContent } from "@/lib/website/schemas"
import type { SectionBrand } from "@/lib/website/types"

interface Props {
  content: NavbarContent
  brand: SectionBrand
}

/**
 * Sticky top navigation. Logo or business name on the left, link list +
 * CTA on the right. Color-aware: defaults to the brand's primary color
 * for the CTA button. Mobile collapses links and shows just CTA.
 */
export function Navbar({ content, brand }: Props) {
  const ctaLabel = content.ctaLabel?.trim() || "Get started"
  const ctaHref = content.ctaHref?.trim() || brand.bookingUrl

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="/" aria-label={brand.businessName} className="flex items-center gap-2">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.businessName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span
              className="text-base font-bold tracking-tight text-neutral-900"
              style={{ fontFamily: brand.fontHeading }}
            >
              {brand.businessName}
            </span>
          )}
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {content.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={ctaHref}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {ctaLabel}
        </a>
      </div>
    </header>
  )
}
