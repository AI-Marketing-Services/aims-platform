/**
 * Bare layout for embeddable pages -- no header, footer, or navigation.
 * Designed to be loaded in an iframe on Mighty Networks or external sites.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
