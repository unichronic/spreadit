'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import TaskStatusMonitor from './TaskStatusMonitor'

interface Connection {
  platform_name: string
  is_connected: boolean
}

interface PublishDialogProps {
  isOpen: boolean
  onClose: () => void
  postId: number
  postTitle: string
}

export default function PublishDialog({ isOpen, onClose, postId, postTitle }: PublishDialogProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [taskIds, setTaskIds] = useState<Record<string, string>>({})
  const [showTaskMonitor, setShowTaskMonitor] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConnections()
      setTaskIds({})
      setShowTaskMonitor(false)
    }
  }, [isOpen])

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found')
        window.location.href = '/login'
        return
      }

      const response = await fetch('http://localhost:8000/api/connections/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.status === 401) {
        console.error('Authentication failed - redirecting to login')
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        const data = await response.json()
        setConnections(data)
        // Pre-select connected platforms
        const connectedPlatforms = data
          .filter((conn: Connection) => conn.is_connected)
          .map((conn: Connection) => conn.platform_name)
        setSelectedPlatforms(connectedPlatforms)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
      toast.error('Failed to load platform connections')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found')
        window.location.href = '/login'
        return
      }

      const publishData = {
        post_id: postId,
        platforms: selectedPlatforms,
        canonical_url: null,
        tags: null,
        hashnode_publication_id: null
      }

      // Try Celery endpoint first
      console.log('🚀 Attempting Celery publishing...')
      let response = await fetch(`http://localhost:8000/api/posts/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData),
      })

      let usedDirectPublishing = false

      // If Celery fails, automatically fallback to direct publishing
      if (!response.ok) {
        console.log(`⚠️ Celery publishing failed (${response.status}), falling back to direct publishing...`)
        toast('Celery unavailable, using direct publishing...', { 
          icon: '⚡',
          duration: 3000 
        })
        
        response = await fetch(`http://localhost:8000/api/posts/publish-direct`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(publishData),
        })
        usedDirectPublishing = true
      }

      // Handle authentication errors
      if (response.status === 401) {
        console.error('Authentication failed - redirecting to login')
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        const result = await response.json()
        
        if (usedDirectPublishing) {
          // Handle direct publishing response
          const successfulPlatforms = Object.entries(result.results || {})
            .filter(([_, result]: [string, any]) => result.success)
            .map(([platform, _]: [string, any]) => platform)
          
          const failedPlatforms = Object.entries(result.results || {})
            .filter(([_, result]: [string, any]) => !result.success)
            .map(([platform, result]: [string, any]) => ({ platform, error: result.error }))
          
          if (successfulPlatforms.length > 0) {
            toast.success(
              `✅ Successfully published to: ${successfulPlatforms.join(', ')}`,
              { duration: 6000 }
            )
          }
          
          if (failedPlatforms.length > 0) {
            failedPlatforms.forEach(({ platform, error }) => {
              toast.error(`❌ Failed to publish to ${platform}: ${error}`, { duration: 8000 })
            })
          }
          
          if (result.success) {
            toast.success(result.message, { duration: 4000 })
            onClose() // Close dialog on success
          }
        } else {
          // Handle Celery response (has task_ids)
        if (result.task_ids) {
          setTaskIds(result.task_ids)
          setShowTaskMonitor(true)
        
        toast.success(
          `Publishing queued for ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}`,
          { duration: 4000 }
        )
        
        toast(
          'Publishing is happening in the background. You can monitor progress below or close this dialog.',
          { 
            icon: '⏳',
            duration: 6000
          }
        )
          } else {
            // Fallback for other response formats
            toast.success('Publishing completed successfully!')
            onClose()
          }
        }
      } else {
        const errorData = await response.json()
        let errorMessage = 'Failed to publish'
        
        // Handle Pydantic validation errors (422)
        if (response.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => 
              `${err.loc?.join('.')} - ${err.msg}`
            ).join('; ')
            errorMessage = `Validation error: ${errorMessages}`
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      toast.error('Failed to publish post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskComplete = (platform: string, success: boolean) => {
    if (success) {
      toast.success(`Successfully published to ${platform}!`)
    } else {
      toast.error(`Failed to publish to ${platform}`)
    }
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

  const getPlatformDisplayName = (platform: string) => {
    switch (platform) {
      case 'dev.to':
        return 'Dev.to'
      case 'hashnode':
        return 'Hashnode'
      case 'medium':
        return 'Medium'
      default:
        return platform
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Publish Post</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select platforms to publish "{postTitle}"
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Publishing happens in the background - you can continue working while posts are being published.
          </p>
        </div>

        {!showTaskMonitor && !isLoadingConnections && (
          <div className="space-y-3 mb-6">
            {connections.map((connection) => {
              const isConnected = connection.is_connected
              const isSelected = selectedPlatforms.includes(connection.platform_name)
              
              return (
                <label
                  key={connection.platform_name}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isConnected 
                      ? 'border-gray-200 hover:bg-gray-50' 
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(connection.platform_name)}
                    disabled={!isConnected}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-xl">{getPlatformIcon(connection.platform_name)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {getPlatformDisplayName(connection.platform_name)}
                    </div>
                    <div className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        )}

        {isLoadingConnections && (
          <div className="space-y-3 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {showTaskMonitor && (
          <TaskStatusMonitor 
            taskIds={taskIds} 
            onTaskComplete={handleTaskComplete}
          />
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {showTaskMonitor ? 'Close' : 'Cancel'}
          </button>
          {!showTaskMonitor && (
            <button
              onClick={handlePublish}
              disabled={isLoading || selectedPlatforms.length === 0 || isLoadingConnections}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Queuing...' : `Queue for ${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 