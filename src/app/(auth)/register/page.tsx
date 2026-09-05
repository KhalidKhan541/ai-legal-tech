"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/store"
import { Mail, Lock, User, Building2, Scale, Check } from "lucide-react"

const plans = [
  { id: "solo", name: "Solo", price: "$49", period: "/mo", features: ["1 user", "50 matters", "AI contract review", "Basic research"] },
  { id: "team", name: "Team", price: "$149", period: "/mo", features: ["5 users", "Unlimited matters", "Advanced AI", "Priority support"], popular: true },
  { id: "enterprise", name: "Enterprise", price: "Custom", period: "", features: ["Unlimited users", "Custom integrations", "Dedicated support", "SLA"] },
]

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAppStore((s) => s.setUser)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    firm: "",
    plan: "team",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await new Promise((r) => setTimeout(r, 1000))

    setUser({
      id: "u-001",
      name: form.name,
      email: form.email,
      role: "attorney",
      firm: form.firm,
    })
    router.push("/")
    setLoading(false)
  }

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {/* Plan Selection */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => update("plan", plan.id)}
            className={`relative rounded-lg border p-3 text-left text-sm transition-all ${
              form.plan === plan.id
                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                Popular
              </span>
            )}
            <div className="font-semibold text-slate-900">{plan.name}</div>
            <div className="text-xs text-slate-500">
              {plan.price}{plan.period}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Smith"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          leftIcon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label="Email address"
          type="email"
          placeholder="jane@lawfirm.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Input
          label="Law firm"
          placeholder="Smith & Associates"
          value={form.firm}
          onChange={(e) => update("firm", e.target.value)}
          leftIcon={<Building2 className="h-4 w-4" />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          required
          hint="Must be at least 8 characters with a number and symbol"
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Account
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
          <div className="text-xs text-slate-600">
            By creating an account, you agree to our{" "}
            <Link href="#" className="underline hover:text-slate-900">Terms of Service</Link>
            {" "}and{" "}
            <Link href="#" className="underline hover:text-slate-900">Privacy Policy</Link>.
            Your data is encrypted and stored securely.
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-legal-600 hover:text-legal-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
