'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import PublishDialog from '../../../components/PublishDialog'

interface Post {
  id: number
  title: string
  content_markdown: string
  created_at: string
  updated_at?: string
}

interface PublishHistory {
  platform_name: string
  status: string
  platform_post_url?: string
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [publishHistories, setPublishHistories] = useState<Record<number, PublishHistory[]>>({})
  const [publishDialog, setPublishDialog] = useState<{
    isOpen: boolean
    postId: number
    postTitle: string
  }>({
    isOpen: false,
    postId: 0,
    postTitle: ''
  })
  const [refreshCount, setRefreshCount] = useState(0)
  const [lastRefreshTime, setLastRefreshTime] = useState(0)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    // Fetch publish histories for all posts
    posts.forEach(post => fetchPublishHistory(post.id))
    setLastRefreshTime(Date.now())
  }, [posts])

  // Smart auto-refresh: only refresh if there are pending/processing tasks and within reasonable limits
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if we have any pending/processing tasks
      const hasPendingTasks = Object.values(publishHistories).some(histories =>
        histories.some(history => 
          history.status === 'pending' || history.status === 'processing'
        )
      )

      // Stop auto-refresh after 15 minutes or 15 refresh attempts
      const timeSinceStart = Date.now() - lastRefreshTime
      const maxRefreshTime = 15 * 60 * 1000 // 15 minutes
      const maxRefreshCount = 15 // 15 attempts * 60s = 15 minutes

      if (hasPendingTasks && timeSinceStart < maxRefreshTime && refreshCount < maxRefreshCount) {
        console.log(`Auto-refreshing publish histories (attempt ${refreshCount + 1}/${maxRefreshCount})`)
        posts.forEach(post => fetchPublishHistory(post.id))
        setRefreshCount(prev => prev + 1)
      } else if (refreshCount >= maxRefreshCount || timeSinceStart >= maxRefreshTime) {
        console.log('Stopping auto-refresh: reached maximum attempts or time limit')
        clearInterval(interval)
      }
    }, 60000) // 60 seconds (reduced from 30 seconds)

    return () => clearInterval(interval)
  }, [posts, publishHistories, refreshCount, lastRefreshTime])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found')
        window.location.href = '/login'
        return
      }

      const response = await fetch('http://localhost:8000/api/posts/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.status === 401) {
        console.error('Authentication failed - redirecting to login')
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        console.error('Failed to fetch posts', response.status, response.statusText)
        toast.error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to fetch posts')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPublishHistory = async (postId: number) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        return // Silent fail for this background operation
      }

      const response = await fetch(`http://localhost:8000/api/posts/${postId}/publish-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.status === 401) {
        console.error('Authentication failed')
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setPublishHistories(prev => ({
          ...prev,
          [postId]: data.publish_history
        }))
      }
    } catch (error) {
      console.error('Error fetching publish history:', error)
    }
  }

  const deletePost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:8000/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== id))
        toast.success('Post deleted successfully')
      } else {
        toast.error('Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const openPublishDialog = (post: Post) => {
    setPublishDialog({
      isOpen: true,
      postId: post.id,
      postTitle: post.title
    })
  }

  const closePublishDialog = () => {
    setPublishDialog({
      isOpen: false,
      postId: 0,
      postTitle: ''
    })
    // Reset refresh counters for new publish operation
    setRefreshCount(0)
    setLastRefreshTime(Date.now())
    // Refresh publish history after publishing
    setTimeout(() => {
      posts.forEach(post => fetchPublishHistory(post.id))
    }, 2000) // Wait 2 seconds for tasks to be queued
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'pending':
      case 'processing':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'failed':
        return '❌'
      case 'pending':
        return '⏳'
      case 'processing':
        return '🔄'
      default:
        return '❓'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
          <p className="mt-2 text-gray-600">Manage and publish your content across platforms</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="mr-2">✨</span>
            Create New Post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first blog post.</p>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publishing Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => {
                  const publishHistory = publishHistories[post.id] || []
                  const successfulPublishes = publishHistory.filter(p => p.status === 'success')
                  const processingPublishes = publishHistory.filter(p => p.status === 'processing' || p.status === 'pending')
                  
                  return (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {post.content_markdown.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {publishHistory.length > 0 ? (
                            publishHistory.map((pub, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-1"
                                title={`${pub.platform_name}: ${pub.status}${pub.status === 'failed' ? ' (hover for details)' : ''}`}
                              >
                                {pub.platform_post_url && pub.status === 'success' ? (
                                  <a 
                                    href={pub.platform_post_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 hover:opacity-70"
                                  >
                                    <span className="text-lg">{getPlatformIcon(pub.platform_name)}</span>
                                    <span className="text-xs">{getStatusIcon(pub.status)}</span>
                                  </a>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-lg">{getPlatformIcon(pub.platform_name)}</span>
                                    <span className="text-xs">{getStatusIcon(pub.status)}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">Not published</span>
                          )}
                          {processingPublishes.length > 0 && (
                            <span className="text-xs text-yellow-600 animate-pulse">
                              Publishing...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.updated_at ? formatDate(post.updated_at) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/posts/${post.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => openPublishDialog(post)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PublishDialog
        isOpen={publishDialog.isOpen}
        onClose={closePublishDialog}
        postId={publishDialog.postId}
        postTitle={publishDialog.postTitle}
      />
    </div>
  )
} 