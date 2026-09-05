import Link from "next/link"
import { Scale } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">LexAI</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            AI-Powered Legal Intelligence
          </h1>
          <p className="text-lg text-slate-300 max-w-md">
            Join 500+ law firms using LexAI to automate contract review,
            streamline research, and manage their practice.
          </p>
          <div className="flex gap-8">
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-slate-400">Law Firms</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">2M+</div>
              <div className="text-sm text-slate-400">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">40%</div>
              <div className="text-sm text-slate-400">Time Saved</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          &copy; 2025 LexAI, Inc. All rights reserved.
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">LexAI</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
