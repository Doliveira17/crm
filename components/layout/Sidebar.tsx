'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, MessageSquare, Tag, Zap, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    title: 'Interações',
    href: '/interacoes',
    icon: MessageSquare,
  },
  {
    title: 'Tags',
    href: '/tags',
    icon: Tag,
  },
  {
    title: 'Faturas',
    href: '/faturas',
    icon: Zap,
  },
  {
    title: 'Técnica',
    href: '/tecnica',
    icon: Wrench,
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  return (
    <aside className={cn(
      'border-r bg-card transition-all duration-300 relative',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className={cn(
        'px-6 py-6 flex items-center',
        isCollapsed ? 'justify-center px-3' : 'justify-between'
      )}>
        {!isCollapsed && (
          <h1 className="flex items-baseline gap-1">
            <span className="text-xl font-light tracking-tight text-emerald-500">Solar</span>
            <span className="text-xl font-semibold tracking-tight text-foreground">Energy</span>
            <span className="ml-1 text-xs font-medium text-muted-foreground">CRM</span>
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'h-8 w-8',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
