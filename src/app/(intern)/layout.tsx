import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  ListTodo,
  Target,
  FileText,
  Briefcase,
} from "lucide-react"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const INTERN_NAV = [
  { label: "Dashboard", href: "/intern/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/intern/tasks", icon: ListTodo },
  { label: "Sprints", href: "/intern/sprints", icon: Target },
  { label: "EOD Report", href: "/intern/eod-report", icon: FileText },
  { label: "Portfolio", href: "/intern/portfolio", icon: Briefcase },
]

export default async function InternLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top header */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-deep border-b border-border sticky top-0 z-40">
        <Link href="/intern/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="AIMS" width={80} height={32} className="object-contain h-7 w-auto" />
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Builder</span>
        </Link>
        <UserButton />
      </div>

      <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden">
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-deep">
          <div className="flex h-16 items-center px-4 border-b border-border">
            <Link href="/intern/dashboard" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="AIMS" width={32} height={32} className="object-contain" />
              <div>
                <span className="text-lg font-bold">AIMS</span>
                <span className="ml-1.5 text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Builder</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 py-4 px-2 space-y-0.5">
            {INTERN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            <UserButton />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 pb-20 lg:p-6 lg:pb-8 xl:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Intern mobile navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 px-2 safe-area-pb">
        {INTERN_NAV.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 flex-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
