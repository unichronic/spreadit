'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useEffect } from 'react'
import Navbar from '../../components/Navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('DashboardLayout: Auth state changed', { isAuthenticated, isLoading, hasToken: !!token })
    
    if (!isLoading && !isAuthenticated) {
      console.log('DashboardLayout: Redirecting to login - not authenticated')
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, token])

  if (isLoading) {
    console.log('DashboardLayout: Still loading authentication state')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('DashboardLayout: Not authenticated, returning null')
    return null // Will redirect to login
  }

  console.log('DashboardLayout: Rendering dashboard content')
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold text-gray-900">CrossPost</span>
            </div>
            <nav className="space-y-2">
              <NavigationItem 
                href="/dashboard/posts" 
                icon="📝"
                title="My Posts"
                description="Manage your content"
              />
              <NavigationItem 
                href="/dashboard/posts/new" 
                icon="✨"
                title="New Post"
                description="Create new content"
              />
              <NavigationItem 
                href="/dashboard/connections" 
                icon="🔗"
                title="Connections"
                description="Platform settings"
              />
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavigationItem({ 
  href, 
  icon, 
  title, 
  description 
}: { 
  href: string
  icon: string
  title: string
  description: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  return (
    <Link 
      href={href}
      className={`block p-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 border border-blue-200' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center">
        <span className="text-lg mr-3">{icon}</span>
        <div>
          <div className={`font-medium text-sm ${
            isActive ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {title}
          </div>
          <div className={`text-xs ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {description}
          </div>
        </div>
      </div>
    </Link>
  )
} 