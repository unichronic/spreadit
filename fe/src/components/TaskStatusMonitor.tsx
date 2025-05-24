import React from 'react'
import { useTaskStatus } from '../hooks/useTaskStatus'

interface TaskStatusMonitorProps {
  taskIds: Record<string, string> // platform -> task_id mapping
  onTaskComplete?: (platform: string, success: boolean) => void
}

export default function TaskStatusMonitor({ taskIds, onTaskComplete }: TaskStatusMonitorProps) {
  const { taskStatuses, isLoading } = useTaskStatus({
    taskIds,
    enabled: Object.keys(taskIds).length > 0,
    onStatusUpdate: (platform, status) => {
      // Call callback when task completes
      if (status.ready && onTaskComplete) {
        onTaskComplete(platform, status.successful || false)
      }
    }
  })

  if (Object.keys(taskIds).length === 0) {
    return null
  }

  const getStatusIcon = (status: string, ready: boolean, successful: boolean | null) => {
    if (!ready) {
      return <span className="animate-spin">🔄</span>
    }
    if (successful) {
      return <span className="text-green-600">✅</span>
    }
    return <span className="text-red-600">❌</span>
  }

  const getStatusText = (status: string, ready: boolean) => {
    if (!ready) {
      return `${status}...`
    }
    return status
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
                    {getStatusIcon(taskStatus.status, taskStatus.ready, taskStatus.successful)}
                    <span className="text-gray-600">
                      {getStatusText(taskStatus.status, taskStatus.ready)}
                    </span>
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
        💡 Task status monitoring requires Celery worker to be running
      </div>
    </div>
  )
} 