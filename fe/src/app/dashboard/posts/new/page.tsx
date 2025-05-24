'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import TipTapEditor from '../../../../components/TipTapEditor'

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Please enter a title for your post')
      return
    }
    
    if (!content.trim()) {
      toast.error('Please add some content to your post')
      return
    }

    setIsSubmitting(true)
    setIsDraft(saveAsDraft)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content_markdown: content,
          is_draft: saveAsDraft
        }),
      })

      if (response.ok) {
        if (saveAsDraft) {
          toast.success('Draft saved successfully!')
        } else {
          toast.success('Post created successfully!')
        }
        router.push('/dashboard/posts')
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
      setIsDraft(false)
    }
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200
    const wordCount = getWordCount(text)
    return Math.ceil(wordCount / wordsPerMinute)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
            <p className="mt-2 text-gray-600">Write engaging content for your audience</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {(title || content) && (
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="mr-1">📝</span>
              {getWordCount(content)} words
            </div>
            <div className="flex items-center">
              <span className="mr-1">⏱️</span>
              {getReadingTime(content)} min read
            </div>
            <div className="flex items-center">
              <span className="mr-1">📖</span>
              {title.length}/100 title chars
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Title Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-3">
            Post Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter an engaging title for your post..."
            maxLength={100}
            required
          />
          <div className="mt-2 flex justify-between items-center text-sm">
            <p className="text-gray-500">Make it compelling and SEO-friendly</p>
            <span className={`${title.length > 80 ? 'text-orange-600' : 'text-gray-400'}`}>
              {title.length}/100
            </span>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Post Content
            </label>
            <p className="text-sm text-gray-500">
              Use the rich editor to format your content. Supports markdown shortcuts.
            </p>
          </div>
          <div className="p-6">
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your amazing post here... 

You can use:
• **bold text** or *italic text*
• # Headings
• - Lists
• Code blocks and more!"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-8 mt-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Preview Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Auto-saving enabled
              </div>
              {content && (
                <div className="hidden sm:block">
                  Ready to publish or save as draft
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDraft && isSubmitting ? (
                  <>
                    <div className="inline-block animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2"></div>
                    Saving Draft...
                  </>
                ) : (
                  '💾 Save as Draft'
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && !isDraft ? (
                  <>
                    <div className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating Post...
                  </>
                ) : (
                  '🚀 Create Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Tips Section */}
      {!content && (
        <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Writing Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Start with a compelling hook to grab your readers' attention</li>
            <li>• Use headers to structure your content and improve readability</li>
            <li>• Include code examples or images to illustrate your points</li>
            <li>• Keep paragraphs short and scannable for better engagement</li>
          </ul>
        </div>
      )}
    </div>
  )
} 