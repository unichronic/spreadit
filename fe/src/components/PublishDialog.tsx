'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import TaskStatusMonitor from './TaskStatusMonitor'

interface Connection {
  platform_name: string
  is_connected: boolean
}

interface PlatformConfig {
  tags?: string
  shortIntro?: string
  canonicalUrl?: string
  hashnodePublicationId?: string
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
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, PlatformConfig>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [taskIds, setTaskIds] = useState<Record<string, string>>({})
  const [showTaskMonitor, setShowTaskMonitor] = useState(false)
  const [currentStep, setCurrentStep] = useState<'select' | 'customize' | 'publish'>('select')

  useEffect(() => {
    if (isOpen) {
      fetchConnections()
      setTaskIds({})
      setShowTaskMonitor(false)
      setCurrentStep('select')
      setPlatformConfigs({})
    }
  }, [isOpen])

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/connections/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
        // Pre-select connected platforms
        const connectedPlatforms = data
          .filter((conn: Connection) => conn.is_connected)
          .map((conn: Connection) => conn.platform_name)
        setSelectedPlatforms(connectedPlatforms)
        
        // Initialize platform configs
        const initialConfigs: Record<string, PlatformConfig> = {}
        connectedPlatforms.forEach((platform: string) => {
          initialConfigs[platform] = {
            tags: '',
            shortIntro: '',
            canonicalUrl: '',
            hashnodePublicationId: ''
          }
        })
        setPlatformConfigs(initialConfigs)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
      toast.error('Failed to load platform connections')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => {
      const newSelected = prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
      
      // Initialize or remove platform config
      setPlatformConfigs(prevConfigs => {
        const newConfigs = { ...prevConfigs }
        if (newSelected.includes(platform) && !newConfigs[platform]) {
          newConfigs[platform] = {
            tags: '',
            shortIntro: '',
            canonicalUrl: '',
            hashnodePublicationId: ''
          }
        } else if (!newSelected.includes(platform)) {
          delete newConfigs[platform]
        }
        return newConfigs
      })
      
      return newSelected
    })
  }

  const handleConfigChange = (platform: string, field: keyof PlatformConfig, value: string) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }))
  }

  const handleNext = () => {
    if (currentStep === 'select' && selectedPlatforms.length > 0) {
      setCurrentStep('customize')
    } else if (currentStep === 'customize') {
      setCurrentStep('publish')
      handlePublish()
    }
  }

  const handleBack = () => {
    if (currentStep === 'customize') {
      setCurrentStep('select')
    }
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    setIsLoading(true)
    try {
      // Prepare platform-specific data
      const platformData = selectedPlatforms.map(platform => ({
        platform,
        config: platformConfigs[platform] || {}
      }))

      const token = localStorage.getItem('authToken')
      
      // Try Celery endpoint first, fallback to direct if it fails
      let response = await fetch(`http://localhost:8000/api/posts/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          platforms: selectedPlatforms,
          platform_configs: platformConfigs,
          canonical_url: platformConfigs['dev.to']?.canonicalUrl || null,
          tags: platformConfigs['dev.to']?.tags || null,
          hashnode_publication_id: platformConfigs['hashnode']?.hashnodePublicationId || null
        }),
      })
      
      // If Celery endpoint fails with task-related errors, try direct publishing
      if (!response.ok && (response.status === 500 || response.status === 404)) {
        console.log('Celery endpoint failed, trying direct publishing...')
        response = await fetch(`http://localhost:8000/api/posts/publish-direct`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_id: postId,
            platforms: selectedPlatforms,
            canonical_url: platformConfigs['dev.to']?.canonicalUrl || null,
            tags: platformConfigs['dev.to']?.tags || null,
            hashnode_publication_id: platformConfigs['hashnode']?.hashnodePublicationId || null
          }),
        })
      }

      if (response.ok) {
        const result = await response.json()
        
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
        } 
        // Handle direct publishing response (immediate results)
        else if (result.results) {
          const successfulPlatforms = Object.entries(result.results)
            .filter(([_, result]: [string, any]) => result.success)
            .map(([platform, _]: [string, any]) => platform)
          
          const failedPlatforms = Object.entries(result.results)
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
        }
        // Fallback for other response formats
        else {
          toast.success('Publishing completed successfully!')
          onClose()
        }
      } else {
        const errorData = await response.json()
        let errorMessage = 'Failed to queue publish tasks'
        
        // Handle Pydantic validation errors (422)
        if (response.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors are arrays of objects with {type, loc, msg, input}
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
        setCurrentStep('customize')
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      toast.error('Failed to queue publish tasks')
      setCurrentStep('customize')
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
      case 'twitter':
        return '🐦'
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
      case 'twitter':
        return 'Twitter'
      default:
        return platform
    }
  }

  const getPlatformDescription = (platform: string) => {
    switch (platform) {
      case 'dev.to':
        return 'Developer community platform'
      case 'hashnode':
        return 'Developer blogging platform'
      case 'medium':
        return 'Publishing platform for writers'
      case 'twitter':
        return 'Social media microblogging'
      default:
        return 'Social platform'
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'select' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
        }`}>
          {currentStep === 'select' ? '1' : '✓'}
        </div>
        <div className={`w-16 h-0.5 ${currentStep !== 'select' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'customize' ? 'bg-blue-600 text-white' : 
          currentStep === 'publish' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {currentStep === 'publish' ? '✓' : '2'}
        </div>
        <div className={`w-16 h-0.5 ${currentStep === 'publish' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'publish' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3
        </div>
      </div>
    </div>
  )

  const renderPlatformSelection = () => {
    const connectedPlatforms = connections.filter(conn => conn.is_connected)
    const disconnectedCount = connections.length - connectedPlatforms.length
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Select Platforms</h3>
          <p className="text-sm text-gray-600 mt-1">Choose where to publish "{postTitle}"</p>
          {connectedPlatforms.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                🔗 No platforms connected yet. <button 
                  onClick={() => window.open('/dashboard/connections', '_blank')} 
                  className="underline hover:no-underline font-medium"
                >
                  Connect platforms first
                </button>
              </p>
            </div>
          )}
        </div>
        
        {connectedPlatforms.length > 0 && (
          <div className="grid gap-3">
            {connectedPlatforms.map((connection) => {
              const isSelected = selectedPlatforms.includes(connection.platform_name)
              
              return (
                <label
                  key={connection.platform_name}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(connection.platform_name)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getPlatformIcon(connection.platform_name)}</span>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {getPlatformDisplayName(connection.platform_name)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getPlatformDescription(connection.platform_name)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ready to Publish
                  </div>
                </label>
              )
            })}
          </div>
        )}
        
        {disconnectedCount > 0 && connectedPlatforms.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 {disconnectedCount} more platform{disconnectedCount > 1 ? 's' : ''} available. <button 
                onClick={() => window.open('/dashboard/connections', '_blank')} 
                className="underline hover:no-underline font-medium"
              >
                Connect more platforms
              </button>
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderPlatformCustomization = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Customize for Each Platform</h3>
        <p className="text-sm text-gray-600 mt-1">Tailor your post for each platform's audience</p>
      </div>

      {selectedPlatforms.map(platform => (
        <div key={platform} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
          <div className="flex items-center mb-4">
            <span className="text-xl mr-3">{getPlatformIcon(platform)}</span>
            <h4 className="font-semibold text-gray-900">{getPlatformDisplayName(platform)}</h4>
          </div>
          
          <div className="space-y-4">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
                <span className="text-gray-500 text-xs ml-1">
                  (comma-separated, e.g., "react, javascript, webdev")
                </span>
              </label>
              <input
                type="text"
                value={platformConfigs[platform]?.tags || ''}
                onChange={(e) => handleConfigChange(platform, 'tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add relevant tags..."
              />
            </div>

            {/* Short Intro for social platforms */}
            {(platform === 'twitter') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Intro
                  <span className="text-gray-500 text-xs ml-1">
                    (Tweet-style intro, max 280 characters)
                  </span>
                </label>
                <textarea
                  value={platformConfigs[platform]?.shortIntro || ''}
                  onChange={(e) => handleConfigChange(platform, 'shortIntro', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  maxLength={280}
                  placeholder="Write a compelling intro for this platform..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  {(platformConfigs[platform]?.shortIntro || '').length}/280 characters
                </div>
              </div>
            )}

            {/* Platform-specific fields */}
            {platform === 'hashnode' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publication ID (Optional)
                </label>
                <input
                  type="text"
                  value={platformConfigs[platform]?.hashnodePublicationId || ''}
                  onChange={(e) => handleConfigChange(platform, 'hashnodePublicationId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to publish to your personal blog"
                />
              </div>
            )}

            {/* Canonical URL */}
            {platform === 'dev.to' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canonical URL (Optional)
                </label>
                <input
                  type="url"
                  value={platformConfigs[platform]?.canonicalUrl || ''}
                  onChange={(e) => handleConfigChange(platform, 'canonicalUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/original-post"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Step Indicator */}
        {!showTaskMonitor && renderStepIndicator()}

        {/* Content based on current step */}
        {showTaskMonitor ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Publishing Status</h2>
            <TaskStatusMonitor 
              taskIds={taskIds} 
              onTaskComplete={handleTaskComplete}
            />
          </div>
        ) : (
          <div>
            {isLoadingConnections ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-6"></div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-3 p-4 border rounded-xl">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {currentStep === 'select' && renderPlatformSelection()}
                {currentStep === 'customize' && renderPlatformCustomization()}
                {currentStep === 'publish' && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Publishing Your Post</h3>
                    <p className="text-sm text-gray-600 mt-2">This may take a few moments...</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!showTaskMonitor && !isLoadingConnections && (
          <div className="flex justify-between mt-8">
            <div>
              {currentStep === 'customize' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              {currentStep !== 'publish' && (
                <button
                  onClick={handleNext}
                  disabled={selectedPlatforms.length === 0 || isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === 'select' ? 'Next →' : 'Publish'}
                </button>
              )}
            </div>
          </div>
        )}

        {showTaskMonitor && (
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 