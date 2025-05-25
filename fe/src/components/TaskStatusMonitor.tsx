import React, { useRef, useEffect } from 'react'
import { useTaskStatus } from '../hooks/useTaskStatus'

interface TaskStatusMonitorProps {
  taskIds: Record<string, string> // platform -> task_id mapping
  onTaskComplete?: (platform: string, success: boolean) => void
}

export default function TaskStatusMonitor({ taskIds, onTaskComplete }: TaskStatusMonitorProps) {
  // Track which platforms have already been notified to prevent duplicate toasts
  const notifiedPlatformsRef = useRef<Set<string>>(new Set())

  // Reset notification tracking when taskIds change (new publish operation)
  useEffect(() => {
    notifiedPlatformsRef.current.clear()
  }, [taskIds])

  const { taskStatuses, isLoading } = useTaskStatus({
    taskIds,
    enabled: Object.keys(taskIds).length > 0,
    maxRetries: 30, // 30 attempts * 5s = 2.5 minutes of active polling
    maxDuration: 8 * 60 * 1000, // 8 minutes total timeout
    staleTimeout: 5 * 60 * 1000, // 5 minutes for stale task detection
    pollInterval: 5000, // 5 seconds between polls (reduced frequency)
    onStatusUpdate: (platform, status) => {
      // Call callback when task completes, but only once per platform
      if (status.ready && onTaskComplete && !notifiedPlatformsRef.current.has(platform)) {
        notifiedPlatformsRef.current.add(platform)
        onTaskComplete(platform, status.successful || false)
      }
    }
  })

  if (Object.keys(taskIds).length === 0) {
    return null
  }

  const getStatusIcon = (status: string, ready: boolean, successful: boolean | null, error?: string) => {
    if (!ready) {
      return <span className="animate-spin">🔄</span>
    }
    if (successful) {
      return <span className="text-green-600">✅</span>
    }
    // Show different icons for different types of failures
    if (error?.includes('stale') || error?.includes('not found')) {
      return <span className="text-orange-600">⏰</span>
    }
    return <span className="text-red-600">❌</span>
  }

  const getStatusText = (status: string, ready: boolean, error?: string) => {
    if (!ready) {
      return `${status}...`
    }
    if (error?.includes('stale')) {
      return 'Timeout'
    }
    if (error?.includes('not found')) {
      return 'Service unavailable'
    }
    return status
  }

  const getStatusColor = (status: string, successful: boolean | null, error?: string) => {
    if (successful) {
      return 'text-green-600'
    }
    if (error?.includes('stale') || error?.includes('not found')) {
      return 'text-orange-600'
    }
    if (successful === false) {
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h4 className="text-sm font-medium text-blue-900 mb-2">
        Publishing Status {isLoading && <span className="text-xs">(checking...)</span>}
      </h4>
      
      <div className="space-y-2">
        {Object.entries(taskIds).map(([platform, taskId]) => {
          const taskStatus = taskStatuses[platform]
          
          return (
            <div key={platform} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium capitalize">{platform}</span>
                {taskStatus && (
                  <>
                    {getStatusIcon(taskStatus.status, taskStatus.ready, taskStatus.successful, taskStatus.error)}
                    <span className={getStatusColor(taskStatus.status, taskStatus.successful, taskStatus.error)}>
                      {getStatusText(taskStatus.status, taskStatus.ready, taskStatus.error)}
                    </span>
                    {taskStatus.error && (
                      <span className="text-xs text-gray-500" title={taskStatus.error}>
                        ⚠️
                      </span>
                    )}
                  </>
                )}
                {!taskStatus && (
                  <span className="text-gray-500 text-xs">Task monitoring unavailable</span>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                {taskId.substring(0, 8)}...
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-3 text-xs text-blue-700">
        💡 Tasks timeout after 8 minutes. Polling checks every 5 seconds for 2.5 minutes.
      </div>
    </div>
  )
} 