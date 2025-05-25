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
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
      {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">CP</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">CrossPost</h2>
                <p className="text-xs text-gray-500">Multi-platform publisher</p>
              </div>
            </div>
        </div>
          
          <nav className="px-4 pb-4">
            <div className="space-y-2">
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
            </div>
            
            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Quick Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Posts Created</span>
                  <span className="font-medium text-blue-900">-</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Platforms Connected</span>
                  <span className="font-medium text-blue-900">-</span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-xs text-gray-600 mb-3">Get started with our guides</p>
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                📚 View Documentation
              </button>
            </div>
        </nav>
      </div>
      
      {/* Main content */}
        <div className="flex-1 overflow-auto">
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
  const isActive = pathname === href || (href !== '/dashboard/posts' && pathname.startsWith(href))
  
  return (
    <Link 
      href={href} 
      className={`group flex items-center p-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-blue-100 text-blue-700 shadow-sm' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <span className={`text-xl mr-4 transition-transform ${
        isActive ? 'scale-110' : 'group-hover:scale-110'
      }`}>{icon}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className={`text-xs transition-colors ${
          isActive 
            ? 'text-blue-600' 
            : 'text-gray-500 group-hover:text-blue-600'
        }`}>{description}</div>
      </div>
      <div className={`transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
} 