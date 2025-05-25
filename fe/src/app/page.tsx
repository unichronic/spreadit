'use client'

import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  // Don't render navigation buttons while checking auth
  const renderNavigation = () => {
    if (isLoading) {
  return (
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
        </div>
      )
    }

    if (isAuthenticated) {
      return (
        <Link
          href="/dashboard/posts"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      )
    }

    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  const renderActionButtons = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="animate-pulse h-12 bg-gray-200 rounded-xl w-40"></div>
          <div className="animate-pulse h-12 bg-gray-200 rounded-xl w-40"></div>
        </div>
      )
    }

    const startWritingHref = isAuthenticated ? "/dashboard/posts/new" : "/login"
    const connectPlatformsHref = isAuthenticated ? "/dashboard/connections" : "/login"

    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        <Link
          href={startWritingHref}
          className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          <span className="mr-2">✨</span>
          Start Writing
        </Link>
        <Link
          href={connectPlatformsHref}
          className="inline-flex items-center px-8 py-4 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
        >
          <span className="mr-2">🔗</span>
          Connect Platforms
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CrossPost</span>
          </div>
          {renderNavigation()}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Publish Everywhere,
            <span className="text-blue-600"> Write Once</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            CrossPost helps you distribute your content across multiple blogging platforms 
            with customized formatting for each audience. Write once, publish everywhere.
          </p>
          
          {renderActionButtons()}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rich Editor</h3>
              <p className="text-gray-600">
                Write with our intuitive rich text editor that supports markdown shortcuts and formatting.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Platform</h3>
              <p className="text-gray-600">
                Publish to Dev.to, Hashnode, Medium, and more platforms with platform-specific customizations.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Background Publishing</h3>
              <p className="text-gray-600">
                Posts are published in the background so you can continue working while we handle the rest.
              </p>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="mt-20">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Supported Platforms</h2>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👩‍💻</span>
                <span className="font-medium">Dev.to</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔗</span>
                <span className="font-medium">Hashnode</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📝</span>
                <span className="font-medium">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🐦</span>
                <span className="font-medium">Twitter</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p>&copy; 2024 CrossPost. Built for content creators who want to reach every audience.</p>
        </div>
      </footer>
    </div>
  )
}
