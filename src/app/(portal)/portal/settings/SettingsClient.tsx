"use client"

import { useState } from "react"
import { User, Bell, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"

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
  } | null
}

export function PortalSettingsClient({ clerkUser, dbUser }: Props) {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [slackNotifs, setSlackNotifs] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  return (
    <div className="max-w-2xl space-y-8">
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
              <img src={clerkUser.imageUrl} alt="" className="h-12 w-12 rounded-full" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                {clerkUser.firstName} {clerkUser.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{clerkUser.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Company</p>
              <p className="text-sm text-foreground">{dbUser?.company ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Industry</p>
              <p className="text-sm text-foreground">{dbUser?.industry ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-sm text-foreground">{dbUser?.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Website</p>
              <p className="text-sm text-foreground">{dbUser?.website ?? "—"}</p>
            </div>
          </div>
          <div className="pt-2">
            <a
              href="https://accounts.clerk.dev/user"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#DC2626] hover:underline"
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Service updates, billing alerts, reports</p>
            </div>
            <button
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifs ? "bg-[#DC2626]" : "bg-muted"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailNotifs ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Slack Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified in your team Slack</p>
            </div>
            <button
              onClick={() => setSlackNotifs(!slackNotifs)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${slackNotifs ? "bg-[#DC2626]" : "bg-muted"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${slackNotifs ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Password */}
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

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-base font-semibold text-red-600 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Deleting your account will remove all your data permanently. This cannot be undone.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">Are you sure? This is permanent.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                Yes, delete my account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
