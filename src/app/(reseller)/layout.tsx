import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FolderOpen,
} from "lucide-react"

const RESELLER_NAV = [
  { label: "Dashboard", href: "/reseller/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/reseller/clients", icon: Users },
  { label: "Commissions", href: "/reseller/commissions", icon: DollarSign },
  { label: "Resources", href: "/reseller/resources", icon: FolderOpen },
]

export default async function ResellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <Link href="/reseller/dashboard" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="AIMS" width={32} height={32} className="object-contain" />
              <div>
                <span className="text-lg font-bold">AIMS</span>
                <span className="ml-1.5 text-[10px] font-medium text-amber-500 uppercase tracking-wider">Partner</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 py-4 px-2 space-y-0.5">
            {RESELLER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
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
