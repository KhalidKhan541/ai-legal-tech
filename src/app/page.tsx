"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Scale,
  FileText,
  Search,
  Clock,
  Shield,
  Zap,
  ChevronRight,
  ArrowRight,
  Bot,
  Users,
  BarChart3,
  Menu,
  X,
} from "lucide-react"

const features = [
  {
    icon: Bot,
    title: "AI Contract Review",
    description: "Analyze contracts in seconds. Identify risks, extract key clauses, and get AI-powered recommendations.",
  },
  {
    icon: Search,
    title: "Legal Research",
    description: "Search case law, statutes, and regulations with natural language. Get citation-verified answers.",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Organize, version, and collaborate on legal documents with intelligent categorization.",
  },
  {
    icon: Clock,
    title: "Time & Billing",
    description: "Automatic time tracking, invoice generation, and trust accounting in one place.",
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Secure client collaboration portal with real-time matter updates and document sharing.",
  },
  {
    icon: Shield,
    title: "Conflict Checking",
    description: "Automated conflict checks across your entire client database with real-time alerts.",
  },
]

const stats = [
  { value: "500+", label: "Law Firms" },
  { value: "2M+", label: "Documents Processed" },
  { value: "99.9%", label: "Uptime" },
  { value: "40%", label: "Time Saved" },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">LexAI</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              About
            </a>
            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-2">
              <a href="#features" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Features</a>
              <a href="#pricing" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Pricing</a>
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Sign In</Link>
              <Link href="/register">
                <Button className="w-full" size="sm">Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMyAxLjM0MyAzIDNzLTEuMzQzIDMtMyAzLTMtMS4zNDMtMy0zIDEuMzQzLTMgMy0zem0wIDZjMS42NTcgMCAzIDEuMzQzIDMgcy0xLjM0MyAzLTMgMy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Legal Intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              The Future of Legal Practice Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              LexAI combines advanced AI with legal expertise to automate contract review, streamline research,
              and manage your entire practice from one intelligent platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-white text-slate-900 hover:bg-slate-100">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="xl" className="border-slate-600 text-white hover:bg-slate-800">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything Your Firm Needs
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From intake to invoicing, LexAI handles every aspect of modern legal practice.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors group-hover:bg-legal-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                  <div className="mt-4">
                    <span className="inline-flex items-center text-sm font-medium text-slate-900 group-hover:text-legal-700">
                      Learn more <ChevronRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Practice?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Join 500+ law firms already using LexAI to work smarter. Start your free 14-day trial today.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-white text-slate-900 hover:bg-slate-100">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">LexAI</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; 2025 LexAI, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
