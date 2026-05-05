"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, Bell, Shield, ExternalLink, Plug, Pencil, Check, X } from "lucide-react"
import Image from "next/image"

interface Props {
  clerkUser: {
    firstName: string
    lastName: string
    email: string
    imageUrl: string
  }
  dbUser: {
    id: string
    name: string | null
    email: string
    company: string | null
    phone: string | null
    website: string | null
    industry: string | null
    locationCount: number
    emailNotifs: boolean
    slackNotifs: boolean
    notifNewPurchase: boolean
    notifFulfillmentUpdate: boolean
    notifSupportReply: boolean
    notifBillingAlert: boolean
    notifMarketingDigest: boolean
  } | null
}

// Editable profile field component
function EditableField({
  label,
  value,
  fieldKey,
  type = "text",
  onSave,
}: {
  label: string
  value: string
  fieldKey: string
  type?: "text" | "url" | "tel" | "number"
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (draft === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onSave(fieldKey, draft)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") {
      setDraft(value)
      setEditing(false)
    }
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setDraft(value); setEditing(false) }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 group">
          <p className="text-sm text-foreground">{value || "-"}</p>
          {saved && <span className="text-[10px] text-primary font-medium">Saved</span>}
          <button
            onClick={() => { setDraft(value); setEditing(true) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  )
}

// Select field for industry
function EditableSelectField({
  label,
  value,
  fieldKey,
  options,
  onSave,
}: {
  label: string
  value: string
  fieldKey: string
  options: string[]
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(val: string) {
    setSaving(true)
    await onSave(fieldKey, val)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {editing ? (
        <select
          autoFocus
          value={draft}
          onChange={(e) => { setDraft(e.target.value); handleSave(e.target.value) }}
          disabled={saving}
          className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-1.5 group">
          <p className="text-sm text-foreground">{value || "-"}</p>
          {saved && <span className="text-[10px] text-primary font-medium">Saved</span>}
          <button
            onClick={() => { setDraft(value); setEditing(true) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  )
}

const INDUSTRY_OPTIONS = [
  "Vending",
  "Retail",
  "Food & Beverage",
  "Healthcare",
  "Technology",
  "Real Estate",
  "Finance",
  "Manufacturing",
  "Logistics",
  "Other",
]

const HEARD_ABOUT_OPTIONS = [
  "Referral",
  "Google",
  "Vendingpreneurs Community",
  "Social Media",
  "Other",
]

const INTEGRATIONS = [
  { name: "QuickBooks", description: "Sync invoices and expenses" },
  { name: "Slack", description: "Get alerts in your workspace" },
  { name: "Google Calendar", description: "Sync meetings and reminders" },
]

// Toggle row component
function NotifToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-card shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  )
}

export function PortalSettingsClient({ clerkUser, dbUser }: Props) {
  const router = useRouter()

  // Profile field state - tracks current saved values
  const [profileFields, setProfileFields] = useState({
    company: dbUser?.company ?? "",
    industry: dbUser?.industry ?? "",
    phone: dbUser?.phone ?? "",
    website: dbUser?.website ?? "",
    locationCount: String(dbUser?.locationCount ?? 1),
    heardAbout: "",
  })

  // Notification state - channels
  const [emailNotifs, setEmailNotifs] = useState(dbUser?.emailNotifs ?? true)
  const [slackNotifs, setSlackNotifs] = useState(dbUser?.slackNotifs ?? false)
  const [inAppNotifs, setInAppNotifs] = useState(true) // Always on by default

  // Notification state - per event type. Defaults match the User
  // schema defaults; loaded from dbUser when available so the UI shows
  // the actual current state, not optimistic-on values.
  const [notifNewPurchase, setNotifNewPurchase] = useState(
    dbUser?.notifNewPurchase ?? true,
  )
  const [notifFulfillmentUpdate, setNotifFulfillmentUpdate] = useState(
    dbUser?.notifFulfillmentUpdate ?? true,
  )
  const [notifSupportReply, setNotifSupportReply] = useState(
    dbUser?.notifSupportReply ?? true,
  )
  const [notifBillingAlert, setNotifBillingAlert] = useState(
    dbUser?.notifBillingAlert ?? true,
  )
  const [notifMarketingDigest, setNotifMarketingDigest] = useState(
    dbUser?.notifMarketingDigest ?? false,
  )

  // Saving state for notification preferences
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleProfileSave(key: string, value: string) {
    setProfileFields((prev) => ({ ...prev, [key]: value }))

    const payload: Record<string, string | number> = {}
    if (key === "locationCount") {
      const num = parseInt(value, 10)
      if (!isNaN(num)) payload[key] = num
    } else {
      payload[key] = value
    }

    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => toast.error("Failed to save profile"))
  }

  async function handleToggle(field: "emailNotifs" | "slackNotifs", value: boolean) {
    if (field === "emailNotifs") setEmailNotifs(value)
    else setSlackNotifs(value)

    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => toast.error("Failed to save notification preference"))
  }

  async function saveNotificationPreferences() {
    setNotifSaving(true)
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notifNewPurchase,
        notifFulfillmentUpdate,
        notifSupportReply,
        notifBillingAlert,
        notifMarketingDigest,
      }),
    }).catch(() => toast.error("Failed to save notification preferences"))
    setNotifSaving(false)
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch("/api/user", { method: "DELETE" })
      if (res.ok) {
        router.push("/")
      } else {
        toast.error("Failed to delete account. Please contact support.")
        setDeleting(false)
        setDeleteConfirm(false)
      }
    } catch {
      toast.error("Failed to delete account. Please contact support.")
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <div className="w-full space-y-8 stagger-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Account Information</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {clerkUser.imageUrl && (
              <Image src={clerkUser.imageUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-full" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                {clerkUser.firstName} {clerkUser.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{clerkUser.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <EditableField
              label="Company"
              value={profileFields.company}
              fieldKey="company"
              onSave={handleProfileSave}
            />
            <EditableSelectField
              label="Industry"
              value={profileFields.industry}
              fieldKey="industry"
              options={INDUSTRY_OPTIONS}
              onSave={handleProfileSave}
            />
            <EditableField
              label="Phone"
              value={profileFields.phone}
              fieldKey="phone"
              type="tel"
              onSave={handleProfileSave}
            />
            <EditableField
              label="Website"
              value={profileFields.website}
              fieldKey="website"
              type="url"
              onSave={handleProfileSave}
            />
            <EditableField
              label="How many locations?"
              value={profileFields.locationCount}
              fieldKey="locationCount"
              type="number"
              onSave={handleProfileSave}
            />
            <EditableSelectField
              label="How did you hear about AIMS?"
              value={profileFields.heardAbout}
              fieldKey="heardAbout"
              options={HEARD_ABOUT_OPTIONS}
              onSave={handleProfileSave}
            />
          </div>
          <div className="pt-2">
            <a
              href="https://accounts.clerk.dev/user"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Edit profile in account settings
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {/* Channel toggles */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</p>
            <NotifToggle
              label="Email Notifications"
              description="Receive notification emails for important events"
              value={emailNotifs}
              onChange={(v) => handleToggle("emailNotifs", v)}
            />
            <NotifToggle
              label="In-App Notifications"
              description="See notifications in the bell icon dropdown"
              value={inAppNotifs}
              onChange={setInAppNotifs}
            />
            <NotifToggle
              label="Slack Notifications"
              description="Get notified in your team Slack workspace"
              value={slackNotifs}
              onChange={(v) => handleToggle("slackNotifs", v)}
            />
          </div>

          {/* Event type toggles */}
          <div className="pt-4 border-t border-border space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Types</p>
            <NotifToggle
              label="New Purchase"
              description="Get notified when a new subscription or purchase is made"
              value={notifNewPurchase}
              onChange={setNotifNewPurchase}
            />
            <NotifToggle
              label="Fulfillment Updates"
              description="Status changes on your service setup and deliverables"
              value={notifFulfillmentUpdate}
              onChange={setNotifFulfillmentUpdate}
            />
            <NotifToggle
              label="Support Replies"
              description="Responses to your support tickets"
              value={notifSupportReply}
              onChange={setNotifSupportReply}
            />
            <NotifToggle
              label="Billing Alerts"
              description="Upcoming renewals, payment confirmations, and invoice reminders"
              value={notifBillingAlert}
              onChange={setNotifBillingAlert}
            />
            <NotifToggle
              label="Daily morning brief"
              description="7am Mon-Fri email with hot leads, follow-ups due, yesterday's wins. Only fires on days where you have signal — quiet days = no email."
              value={notifMarketingDigest}
              onChange={setNotifMarketingDigest}
            />
          </div>

          {/* Save button */}
          <div className="pt-4 border-t border-border flex items-center gap-3">
            <button
              onClick={saveNotificationPreferences}
              disabled={notifSaving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {notifSaving ? "Saving..." : "Save Preferences"}
            </button>
            {notifSaved && (
              <span className="text-xs text-primary font-medium">Preferences saved</span>
            )}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Security</h2>
        </div>
        <a
          href="https://accounts.clerk.dev/user/security"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Change password
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Integrations */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Plug className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Integrations</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4 ml-11">Connect your tools to enhance your AIMS services.</p>
        <div className="divide-y divide-border">
          {INTEGRATIONS.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between py-3 last:pb-0 first:pt-0">
              <div>
                <p className="text-sm font-medium text-foreground">{integration.name}</p>
                <p className="text-xs text-muted-foreground">{integration.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Not connected</span>
                <a
                  href={`/get-started?integration=${encodeURIComponent(integration.name.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Connect
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-6">
        <h2 className="text-base font-semibold text-primary mb-1">Danger Zone</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Deleting your account will remove all your data permanently. This cannot be undone.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-primary font-medium">Are you sure? This is permanent.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-card transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
