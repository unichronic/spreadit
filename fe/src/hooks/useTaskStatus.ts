import { useState, useEffect } from 'react'

interface TaskStatus {
  task_id: string
  status: string
  result: any
  ready: boolean
  successful: boolean | null
  failed: boolean | null
  error?: string
  platform_info?: {
    platform: string
    data: any
  }
}

interface UseTaskStatusProps {
  taskIds: Record<string, string> // platform -> task_id mapping
  enabled: boolean
  onStatusUpdate?: (platform: string, status: TaskStatus) => void
}

export function useTaskStatus({ taskIds, enabled, onStatusUpdate }: UseTaskStatusProps) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || Object.keys(taskIds).length === 0) {
      return
    }

    let timeoutId: NodeJS.Timeout

    const checkTaskStatuses = async () => {
      setIsLoading(true)
      try {
        const statusPromises = Object.entries(taskIds).map(async ([platform, taskId]) => {
          try {
            const response = await fetch(`http://localhost:8000/api/tasks/status/${taskId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              },
            })
            if (response.ok) {
              const status: TaskStatus = await response.json()
              return { platform, status }
            } else if (response.status === 404) {
              // Task not found - probably Celery not running or task expired
              console.warn(`Task ${taskId} not found (404) - Celery may not be running`)
              return { platform, status: null }
            } else {
              console.error(`Failed to fetch status for task ${taskId}: ${response.status}`)
              return { platform, status: null }
            }
          } catch (error) {
            console.error(`Error fetching status for task ${taskId}:`, error)
            return { platform, status: null }
          }
        })

        const results = await Promise.all(statusPromises)
        const newStatuses: Record<string, TaskStatus> = {}

        results.forEach(({ platform, status }) => {
          if (status) {
            newStatuses[platform] = status
            // Call callback if provided
            if (onStatusUpdate) {
              onStatusUpdate(platform, status)
            }
          }
        })

        setTaskStatuses(newStatuses)

        // Continue polling if any tasks are still pending/running
        const hasActiveTasks = Object.values(newStatuses).some(
          status => !status.ready || status.status === 'PENDING' || status.status === 'RETRY'
        )

        if (hasActiveTasks) {
          timeoutId = setTimeout(checkTaskStatuses, 3000) // Poll every 3 seconds
        }
      } catch (error) {
        console.error('Error checking task statuses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Start polling
    checkTaskStatuses()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [taskIds, enabled, onStatusUpdate])

  return {
    taskStatuses,
    isLoading
  }
} 