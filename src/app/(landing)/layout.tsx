import { CommunityFooter } from "@/components/community/CommunityFooter"
import { CommunityNav } from "@/components/community/CommunityNav"
import { AnnouncementBar } from "@/components/community/AnnouncementBar"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-ink text-cream">
      <AnnouncementBar />
      <CommunityNav />
      <main className="flex-1">{children}</main>
      <CommunityFooter />
    </div>
  )
}
