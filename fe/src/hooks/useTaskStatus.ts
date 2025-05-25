import { useState, useEffect, useRef } from 'react'

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
  maxRetries?: number // Maximum number of polling attempts (default: 40)
  maxDuration?: number // Maximum polling duration in ms (default: 5 minutes)
  staleTimeout?: number // Time in ms after which PENDING tasks are considered stale (default: 3 minutes)
  pollInterval?: number // Polling interval in ms (default: 3000)
}

export function useTaskStatus({ 
  taskIds, 
  enabled, 
  onStatusUpdate,
  maxRetries = 40, // 40 attempts * 3s = 2 minutes of polling
  maxDuration = 5 * 60 * 1000, // 5 minutes
  staleTimeout = 3 * 60 * 1000, // 3 minutes
  pollInterval = 3000 // 3 seconds
}: UseTaskStatusProps) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Track polling state
  const retryCountRef = useRef(0)
  const startTimeRef = useRef<number>(0)
  const taskStartTimesRef = useRef<Record<string, number>>({})
  const lastStatusesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!enabled || Object.keys(taskIds).length === 0) {
      return
    }

    // Reset tracking state
    retryCountRef.current = 0
    startTimeRef.current = Date.now()
    taskStartTimesRef.current = {}
    lastStatusesRef.current = {}
    
    // Initialize task start times
    Object.keys(taskIds).forEach(platform => {
      taskStartTimesRef.current[platform] = Date.now()
      lastStatusesRef.current[platform] = ''
    })

    let timeoutId: NodeJS.Timeout

    const checkTaskStatuses = async () => {
      setIsLoading(true)
      
      try {
        // Check if we've exceeded maximum duration
        const elapsedTime = Date.now() - startTimeRef.current
        if (elapsedTime > maxDuration) {
          console.warn(`Task polling stopped: exceeded maximum duration of ${maxDuration}ms`)
          setIsLoading(false)
          return
        }

        // Check if we've exceeded maximum retries
        if (retryCountRef.current >= maxRetries) {
          console.warn(`Task polling stopped: exceeded maximum retries of ${maxRetries}`)
          setIsLoading(false)
          return
        }

        retryCountRef.current++

        const statusPromises = Object.entries(taskIds).map(async ([platform, taskId]) => {
          try {
            const response = await fetch(`http://localhost:8000/api/tasks/status/${taskId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              },
            })
            if (response.ok) {
              const status: TaskStatus = await response.json()
              
              // Check for stale PENDING tasks
              if (status.status === 'PENDING') {
                const taskElapsedTime = Date.now() - (taskStartTimesRef.current[platform] || Date.now())
                if (taskElapsedTime > staleTimeout) {
                  console.warn(`Task ${taskId} for ${platform} is stale (PENDING for ${taskElapsedTime}ms)`)
                  // Mark as failed due to staleness
                  return { 
                    platform, 
                    status: {
                      ...status,
                      status: 'FAILURE',
                      ready: true,
                      successful: false,
                      failed: true,
                      error: `Task stale: PENDING for more than ${staleTimeout / 1000} seconds`
                    }
                  }
                }
              }
              
              return { platform, status }
            } else if (response.status === 404) {
              // Task not found - probably Celery not running or task expired
              console.warn(`Task ${taskId} not found (404) - Celery may not be running`)
              return { 
                platform, 
                status: {
                  task_id: taskId,
                  status: 'FAILURE',
                  result: null,
                  ready: true,
                  successful: false,
                  failed: true,
                  error: 'Task not found - Celery may not be running or task expired'
                }
              }
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
            
            // Only call callback if status actually changed (debouncing)
            const statusKey = `${status.status}-${status.ready}-${status.successful}`
            if (onStatusUpdate && lastStatusesRef.current[platform] !== statusKey) {
              lastStatusesRef.current[platform] = statusKey
              onStatusUpdate(platform, status)
            }
          }
        })

        setTaskStatuses(newStatuses)

        // Continue polling if any tasks are still pending/running
        const hasActiveTasks = Object.values(newStatuses).some(
          status => !status.ready && (status.status === 'PENDING' || status.status === 'RETRY' || status.status === 'STARTED')
        )

        if (hasActiveTasks) {
          // Use adaptive polling: slower for stable states, faster for active states
          const hasActivelyChangingTasks = Object.values(newStatuses).some(
            status => status.status === 'RETRY' || status.status === 'STARTED'
          )
          const adaptivePollInterval = hasActivelyChangingTasks ? pollInterval : pollInterval * 2
          
          timeoutId = setTimeout(checkTaskStatuses, adaptivePollInterval)
        } else {
          console.log('All tasks completed, stopping polling')
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error checking task statuses:', error)
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
  }, [taskIds, enabled, onStatusUpdate, maxRetries, maxDuration, staleTimeout, pollInterval])

  return {
    taskStatuses,
    isLoading
  }
} 