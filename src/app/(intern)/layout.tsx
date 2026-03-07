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
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col border-r border-border bg-card">
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
