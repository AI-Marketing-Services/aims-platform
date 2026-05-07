/**
 * Curated Lucide icon set surfaced in the editor. Keeping the list
 * tight (vs accepting any Lucide name) bounds the editor's dropdown
 * and prevents operators from picking icons that would clash with the
 * SaaS landing aesthetic (e.g. emojis, gaming, cooking).
 *
 * Names match Lucide's component names so the resolver is a simple map.
 */
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  LayoutGrid,
  LineChart,
  Mail,
  MessageSquare,
  Phone,
  PieChart,
  Rocket,
  Search,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  LayoutGrid,
  LineChart,
  Mail,
  MessageSquare,
  Phone,
  PieChart,
  Rocket,
  Search,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Workflow,
  Zap,
}

/** Names exposed in the editor dropdown — sorted for the picker. */
export const SECTION_ICON_NAMES: ReadonlyArray<string> = Object.keys(ICON_MAP).sort()

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles
  return ICON_MAP[name] ?? Sparkles
}
