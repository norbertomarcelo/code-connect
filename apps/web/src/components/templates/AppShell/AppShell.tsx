import type { ReactNode } from 'react'
import { SidebarNav } from '../../organisms/SidebarNav'

interface AppShellProps {
  children: ReactNode
}

/**
 * Sidebar + content column shared by the feed, the post page and the rest of
 * the signed-in area. Owns the <main> landmark, the way AuthTemplate does:
 * pages render their own <h1> inside it. The column is `flex flex-col gap-6`,
 * so children carry no margins of their own.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen justify-center bg-graphite">
      <div className="flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-6 md:flex-row md:py-14">
        <SidebarNav />
        <main className="flex w-full min-w-0 flex-1 flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  )
}
