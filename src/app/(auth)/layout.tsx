import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9e8] to-white flex flex-col">
      {/* Mini header */}
      <header className="p-5">
        <Link href="/" className="flex items-center w-fit">
          <span className="text-2xl font-black tracking-tight"><span className="text-[#1a0d00]">Inmo</span><span className="text-[#c9962a]">nest</span></span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} Inmonest · Tu nido, directo y sin comisiones
      </footer>
    </div>
  )
}
