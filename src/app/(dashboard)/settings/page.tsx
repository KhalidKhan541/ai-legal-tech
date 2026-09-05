"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Users,
  Key,
  Mail,
  Globe,
  Moon,
  Sun,
  Lock,
  Check,
  Save,
  Camera,
} from "lucide-react"

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "firm", label: "Firm", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "api", label: "API", icon: Key },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar nav */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <nav className="p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Profile Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
                      AR
                    </div>
                    <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                      <Camera className="h-3.5 w-3.5 text-slate-600" />
                    </button>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Profile Photo</div>
                    <div className="text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</div>
                    <Button variant="outline" size="sm" className="mt-2">Upload photo</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="First name" defaultValue="Alexandra" />
                  <Input label="Last name" defaultValue="Reed" />
                  <Input label="Email" type="email" defaultValue="alexandra@reedlaw.com" />
                  <Input label="Phone" defaultValue="(415) 555-0123" />
                  <Input label="Bar Number" defaultValue="CA-2025-12345" />
                  <Input label="Firm" defaultValue="Reed & Associates" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Bio</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                    defaultValue="Senior partner specializing in intellectual property litigation and corporate law."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Notification Preferences</h2>
              </div>
              <div className="p-6 space-y-6">
                {[
                  { label: "Email notifications", desc: "Receive email updates for important events", enabled: true },
                  { label: "Task assignments", desc: "Get notified when tasks are assigned to you", enabled: true },
                  { label: "Deadline reminders", desc: "Receive reminders before deadlines", enabled: true },
                  { label: "Invoice updates", desc: "Get notified about invoice status changes", enabled: false },
                  { label: "AI assistant updates", desc: "Notifications from the AI assistant", enabled: true },
                  { label: "Marketing emails", desc: "Product updates and tips", enabled: false },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{pref.label}</div>
                      <div className="text-xs text-slate-500">{pref.desc}</div>
                    </div>
                    <button className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      pref.enabled ? "bg-slate-900" : "bg-slate-200"
                    )}>
                      <span className={cn(
                        "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        pref.enabled && "translate-x-5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-base font-semibold text-slate-900">Security Settings</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">Password</div>
                        <div className="text-xs text-slate-500">Last changed 3 months ago</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Change password</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">Two-Factor Authentication</div>
                        <div className="text-xs text-slate-500">Add an extra layer of security</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">Active Sessions</div>
                        <div className="text-xs text-slate-500">2 devices currently logged in</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Manage sessions</Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
                <p className="mt-1 text-xs text-red-600">Permanently delete your account and all associated data.</p>
                <Button variant="destructive" size="sm" className="mt-3">Delete Account</Button>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">API Keys</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">Production Key</div>
                      <div className="font-mono text-xs text-slate-500">sk_live_...x4k9</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Copy</Button>
                      <Button variant="outline" size="sm">Regenerate</Button>
                    </div>
                  </div>
                </div>
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create new key
                </Button>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>
                {saved ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5v14" />
    </svg>
  )
}
