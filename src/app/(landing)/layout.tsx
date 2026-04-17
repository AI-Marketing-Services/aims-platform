import { CommunityFooter } from "@/components/community/CommunityFooter"
import { CommunityNav } from "@/components/community/CommunityNav"
import { AnnouncementBar } from "@/components/community/AnnouncementBar"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1A1A1A] font-inter scroll-smooth [&_*]:scroll-smooth">
      <style>{`html { scroll-behavior: smooth; scroll-padding-top: 96px; }`}</style>
      <AnnouncementBar />
      <CommunityNav />
      <main id="main-content" className="flex-1">{children}</main>
      <CommunityFooter />
    </div>
  )
}
