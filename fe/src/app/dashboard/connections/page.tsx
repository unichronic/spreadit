'use client'

import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '../../../hooks/useAuth'

interface Connection {
  platform_name: string
  is_connected: boolean
  expires_at?: string
  connected_at?: string
}

interface ApiKeyForm {
  platform: string
  apiKey: string
  isLoading: boolean
}

export default function ConnectionsPage() {
  const { isAuthenticated, token, isLoading: authLoading } = useAuth()
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiKeyForms, setApiKeyForms] = useState<Record<string, ApiKeyForm>>({
    'dev.to': { platform: 'dev.to', apiKey: '', isLoading: false },
    'hashnode': { platform: 'hashnode', apiKey: '', isLoading: false }
  })

  useEffect(() => {
    // Only fetch connections when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated && token) {
      console.log('ConnectionsPage: Auth ready, fetching connections')
      fetchConnections()
    } else if (!authLoading && !isAuthenticated) {
      console.log('ConnectionsPage: Not authenticated, stopping loading')
      setIsLoading(false)
    }
  }, [isAuthenticated, token, authLoading])

  const fetchConnections = async () => {
    try {
      console.log('ConnectionsPage: Making API call with token:', token ? `${token.substring(0, 20)}...` : 'null')
      
      if (!token) {
        console.error('No auth token available')
        toast.error('Please log in again')
        setIsLoading(false)
        return
      }
      
      const response = await fetch('http://localhost:8000/api/connections/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      console.log('Connections response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
        console.log('ConnectionsPage: Successfully loaded connections:', data)
      } else {
        console.error('Failed to fetch connections, status:', response.status)
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.')
        } else {
          toast.error('Failed to load connections')
        }
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
      toast.error('Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectMedium = () => {
    window.location.href = 'http://localhost:8000/api/connections/medium/login'
  }

  const handleRevokeConnection = async (platform: string) => {
    if (!confirm(`Are you sure you want to revoke the connection to ${platform}? This will prevent publishing to this platform until you reconnect.`)) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:8000/api/connections/${platform}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success(`${platform} connection revoked successfully`)
        await fetchConnections()
      } else {
        toast.error(`Failed to revoke ${platform} connection`)
      }
    } catch (error) {
      console.error(`Error revoking ${platform} connection:`, error)
      toast.error(`Failed to revoke ${platform} connection`)
    }
  }

  const handleSaveApiKey = async (platform: string) => {
    const form = apiKeyForms[platform]
    if (!form.apiKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setApiKeyForms(prev => ({
      ...prev,
      [platform]: { ...prev[platform], isLoading: true }
    }))

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/connections/save_key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform_name: platform,
          api_key: form.apiKey
        }),
      })

      if (response.ok) {
        // Clear the input and refresh connections
        setApiKeyForms(prev => ({
          ...prev,
          [platform]: { ...prev[platform], apiKey: '' }
        }))
        toast.success(`${platform} API key saved successfully`)
        await fetchConnections()
      } else {
        toast.error(`Failed to save ${platform} API key`)
      }
    } catch (error) {
      console.error(`Error saving ${platform} API key:`, error)
      toast.error(`Failed to save ${platform} API key`)
    } finally {
      setApiKeyForms(prev => ({
        ...prev,
        [platform]: { ...prev[platform], isLoading: false }
      }))
    }
  }

  const handleApiKeyChange = (platform: string, value: string) => {
    setApiKeyForms(prev => ({
      ...prev,
      [platform]: { ...prev[platform], apiKey: value }
    }))
  }

  const getConnectionStatus = (platform: string) => {
    const connection = connections.find(c => c.platform_name === platform)
    return connection?.is_connected || false
  }

  const getConnectionDetails = (platform: string) => {
    return connections.find(c => c.platform_name === platform)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'dev.to':
        return '👩‍💻'
      case 'hashnode':
        return '🔗'
      case 'medium':
        return '📝'
      default:
        return '🌐'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const ConnectionCard = ({ title, platform, description, children }: {
    title: string
    platform: string
    description: string
    children: React.ReactNode
  }) => {
    const isConnected = getConnectionStatus(platform)
    const connectionDetails = getConnectionDetails(platform)
    
    return (
      <div className={`bg-white rounded-xl border-2 p-6 transition-all ${
        isConnected ? 'border-green-200 shadow-sm' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <span className="text-3xl mr-4">{getPlatformIcon(platform)}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
              {isConnected && connectionDetails?.connected_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Connected on {formatDate(connectionDetails.connected_at)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isConnected ? '✅ Connected' : '❌ Not Connected'}
            </div>
            {isConnected && (
              <button
                onClick={() => handleRevokeConnection(platform)}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Revoke Connection
              </button>
            )}
          </div>
        </div>
        
        {/* Connection Details */}
        {isConnected && connectionDetails && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <span className="text-green-600 mr-2">🔒</span>
              <span className="text-sm font-medium">Securely Connected</span>
            </div>
            <div className="text-xs text-green-700 mt-1">
              Your posts can now be automatically published to this platform
            </div>
          </div>
        )}
        
        {children}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Toaster position="top-right" />
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Connections</h1>
        <p className="mt-2 text-gray-600">Connect your blogging platforms to cross-post your content securely</p>
        
        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 font-semibold">Connected Platforms</div>
            <div className="text-2xl font-bold text-blue-900">
              {connections.filter(c => c.is_connected).length}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-gray-600 font-semibold">Available Platforms</div>
            <div className="text-2xl font-bold text-gray-900">
              {connections.length}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 font-semibold">Ready to Publish</div>
            <div className="text-2xl font-bold text-green-900">
              {connections.filter(c => c.is_connected).length > 0 ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Medium Connection */}
        <ConnectionCard
          title="Medium"
          platform="medium"
          description="Connect via OAuth to automatically publish posts to Medium"
        >
          {!getConnectionStatus('medium') ? (
            <button
              onClick={handleConnectMedium}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75S24 8.83 24 12z"/>
              </svg>
              Connect to Medium
            </button>
          ) : (
            <div className="text-sm text-gray-600">
              ✅ Medium is connected and ready to receive your posts
            </div>
          )}
        </ConnectionCard>

        {/* Dev.to Connection */}
        <ConnectionCard
          title="Dev.to"
          platform="dev.to"
          description="Enter your Dev.to API key to publish posts directly to the developer community"
        >
          {!getConnectionStatus('dev.to') ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="devto-api-key" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="devto-api-key"
                    value={apiKeyForms['dev.to'].apiKey}
                    onChange={(e) => handleApiKeyChange('dev.to', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Enter your Dev.to API key..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-400">🔐</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Get your API key from <a 
                    href="https://dev.to/settings/extensions" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Dev.to Settings → Extensions
                  </a>
                </p>
                <button
                  onClick={() => handleSaveApiKey('dev.to')}
                  disabled={!apiKeyForms['dev.to'].apiKey.trim() || apiKeyForms['dev.to'].isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {apiKeyForms['dev.to'].isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save API Key'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              ✅ Dev.to is connected and ready to receive your posts
            </div>
          )}
        </ConnectionCard>

        {/* Hashnode Connection */}
        <ConnectionCard
          title="Hashnode"
          platform="hashnode"
          description="Connect your Hashnode blog to automatically publish developer-focused content"
        >
          {!getConnectionStatus('hashnode') ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="hashnode-api-key" className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Access Token
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="hashnode-api-key"
                    value={apiKeyForms['hashnode'].apiKey}
                    onChange={(e) => handleApiKeyChange('hashnode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Enter your Hashnode personal access token..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-400">🔐</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Get your token from <a 
                    href="https://hashnode.com/settings/developer" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Hashnode Developer Settings
                  </a>
                </p>
                <button
                  onClick={() => handleSaveApiKey('hashnode')}
                  disabled={!apiKeyForms['hashnode'].apiKey.trim() || apiKeyForms['hashnode'].isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {apiKeyForms['hashnode'].isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Token'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              ✅ Hashnode is connected and ready to receive your posts
            </div>
          )}
        </ConnectionCard>
      </div>

      {/* Security Notice */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start">
          <span className="text-blue-600 text-xl mr-3">🔒</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Security & Privacy</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All API keys are encrypted and stored securely</li>
              <li>• You can revoke connections at any time</li>
              <li>• We only access the permissions needed for publishing</li>
              <li>• Your content remains under your full control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 