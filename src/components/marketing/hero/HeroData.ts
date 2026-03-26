import {
  LayoutDashboard, Users, Megaphone, GitBranch,
  BarChart2, Settings, Bell,
} from "lucide-react"

// ─── Data Types ──────────────────────────────────────────────────────────────

export type LeadStatus = "hot" | "warm" | "new"

export interface Lead {
  initials: string
  color: string
  name: string
  company: string
  status: LeadStatus
  score: number
  email: string
  phone: string
  lastContacted: string
  notes: string
}

export interface Notification {
  icon: React.ElementType
  text: string
  time: string
  unread: boolean
  action: string
  type: "lead" | "campaign" | "meeting" | "billing" | "system"
}

export interface Campaign {
  name: string
  status: "live" | "paused"
  leads: number
  meetings: number
  emailsSent: number
  openRate: number
  isAB?: boolean
}

export interface KanbanDeal {
  company: string
  value: string
  days: number
}

export interface KanbanColumn {
  label: string
  deals: KanbanDeal[]
}

// ─── Static Data ─────────────────────────────────────────────────────────────

export const RECENT_LEADS: Lead[] = [
  { initials: "SC", color: "#C4972A", name: "Sarah Chen", company: "Acme Corp", status: "hot", score: 92, email: "sarah@acmecorp.com", phone: "+1 555-0101", lastContacted: "2h ago", notes: "Follow up on Q2 budget - interested in AI Sales Engine" },
  { initials: "MW", color: "#8B6914", name: "Marcus Webb", company: "TechFlow Inc", status: "warm", score: 74, email: "marcus@techflow.io", phone: "+1 555-0102", lastContacted: "1d ago", notes: "Requested demo for outbound automation stack" },
  { initials: "DR", color: "#7F1D1D", name: "Diana Ross", company: "Velocity Partners", status: "warm", score: 68, email: "diana@velocityp.com", phone: "+1 555-0103", lastContacted: "2d ago", notes: "Evaluating competitors - send case studies" },
  { initials: "JL", color: "#A17D22", name: "James Liu", company: "Growth Labs", status: "new", score: 61, email: "james@growthlabs.co", phone: "+1 555-0104", lastContacted: "3d ago", notes: "Inbound from LinkedIn ad - schedule intro call" },
  { initials: "KP", color: "#6B21A8", name: "Kevin Park", company: "CloudBase", status: "new", score: 55, email: "kevin@cloudbase.io", phone: "+1 555-0105", lastContacted: "4d ago", notes: "Referred by Acme Corp - high intent signal" },
  { initials: "AL", color: "#0369A1", name: "Amy Lin", company: "FinStack", status: "warm", score: 71, email: "amy@finstack.com", phone: "+1 555-0106", lastContacted: "1d ago", notes: "Interested in fractional SDR + AI calling bundle" },
]

export const HOT_DEALS = [
  { company: "Acme Corp", value: "$120K", status: "Closing" },
  { company: "Growth Labs", value: "$450K", status: "Closing" },
  { company: "TechFlow Inc", value: "$85K", status: "Proposal" },
]

export const REVENUE_SOURCES = [
  { label: "LinkedIn", value: "$1.2M", pct: 100 },
  { label: "Email", value: "$950K", pct: 79 },
  { label: "Partner", value: "$450K", pct: 38 },
]

export const NOTIFICATIONS: Notification[] = [
  { icon: Users, text: "New high-value lead: Sarah Chen", time: "4 hours ago", unread: true, action: "View →", type: "lead" },
  { icon: Megaphone, text: "Campaign 'Alpha' started", time: "3 hours ago", unread: true, action: "View →", type: "campaign" },
  { icon: Bell, text: "Meeting booked: Acme Corp", time: "3 hours ago", unread: false, action: "Reply →", type: "meeting" },
  { icon: Users, text: "Invoice paid: $12,000", time: "Yesterday", unread: false, action: "Dismiss", type: "billing" },
  { icon: Users, text: "Lead score alert: Kevin Park hit 55", time: "2 days ago", unread: false, action: "View →", type: "system" },
]

export const CAMPAIGNS: Campaign[] = [
  { name: "Alpha Outbound", status: "live", leads: 124, meetings: 14, emailsSent: 1840, openRate: 48, isAB: true },
  { name: "Re-engagement Q1", status: "live", leads: 89, meetings: 8, emailsSent: 1420, openRate: 41 },
  { name: "AI Voice Follow-up", status: "paused", leads: 56, meetings: 5, emailsSent: 1561, openRate: 38 },
]

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    label: "New Lead",
    deals: [
      { company: "CloudBase", value: "$42K", days: 2 },
      { company: "FinStack", value: "$67K", days: 4 },
      { company: "PivotIO", value: "$31K", days: 1 },
    ],
  },
  {
    label: "Demo Booked",
    deals: [
      { company: "TechFlow Inc", value: "$85K", days: 7 },
      { company: "Velocity Ptrs", value: "$110K", days: 5 },
    ],
  },
  {
    label: "Closing",
    deals: [
      { company: "Acme Corp", value: "$120K", days: 14 },
      { company: "Growth Labs", value: "$450K", days: 11 },
    ],
  },
]

export const TEAM_ACTIVITY = [
  { initials: "SC", text: "SC booked meeting with Acme Corp", time: "2h ago" },
  { initials: "MW", text: "MW replied to TechFlow proposal", time: "4h ago" },
  { initials: "DR", text: "DR added 12 leads from LinkedIn", time: "6h ago" },
]

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Users, label: "Leads", id: "leads" },
  { icon: Megaphone, label: "Campaigns", id: "campaigns" },
  { icon: GitBranch, label: "Pipeline", id: "pipeline" },
  { icon: Bell, label: "Notifications", id: "notifications" },
  { icon: BarChart2, label: "Reports", id: "reports" },
  { icon: Settings, label: "Settings", id: "settings" },
]

export const FLOAT_LOGOS = [
  { src: "/integrations/hubspot-svgrepo-com.svg", label: "HubSpot", style: { top: "8%", left: "10%" }, delay: 0, tiltDir: 1 },
  { src: "/integrations/notion.svg", label: "Notion", style: { top: "6%", right: "10%" }, delay: 0.1, tiltDir: -1 },
  { src: "/integrations/instantly.webp", label: "Instantly", style: { top: "36%", left: "6%" }, delay: 0.2, tiltDir: -1 },
  { src: "/integrations/slack.png", label: "Slack", style: { top: "34%", right: "6%" }, delay: 0.3, tiltDir: 1 },
]
