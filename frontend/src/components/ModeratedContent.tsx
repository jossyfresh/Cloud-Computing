'use client'

import { useState } from 'react'
import { Post } from '@/types'
import { reportPost } from '@/lib/api'
import { toast } from 'react-toastify'

interface ModeratedContentProps {
  posts: Post[]
  onPostReport: () => void
}

interface ReportDialogProps {
  postId: string
  onClose: () => void
  onSubmit: (reason: string) => void
}

function ReportDialog({ postId, onClose, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(reason)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Report Post</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-3 border rounded-lg mb-4"
            rows={4}
            placeholder="Why are you reporting this post?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={submitting || !reason.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ModeratedContent({ posts, onPostReport }: ModeratedContentProps) {
  const [reportingPostId, setReportingPostId] = useState<string | null>(null)

  const handleReport = async (reason: string) => {
    if (!reportingPostId) return

    try {
      const result = await reportPost(reportingPostId, reason)
      if ('error' in result) {
        throw new Error(result.error)
      }
      toast('Post reported successfully', {
        type: 'success',
        position: 'top-right',
        autoClose: 5000
      })
      onPostReport()
    } catch (error) {
      console.error('Error reporting post:', error)
      toast('Failed to report post', {
        type: 'error',
        position: 'top-right',
        autoClose: 5000
      })
    }
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">No posts yet</h3>
          <p className="text-gray-500">Be the first to share your thoughts!</p>
        </div>
      </div>
    )
  }

  const getModerationColor = (post: Post) => {
    if (!post.moderation_result.flagged) return 'bg-green-100'
    switch (post.moderation_result.severity) {
      case 'high':
        return 'bg-red-100'
      case 'medium':
        return 'bg-yellow-100'
      default:
        return 'bg-blue-100'
    }
  }

  const getStatusText = (post: Post) => {
    if (!post.moderation_result.flagged) return 'Content Approved'
    return `Flagged (${post.moderation_result.severity} severity)`
  }

  const getStatusDescription = (post: Post) => {
    if (!post.moderation_result.flagged) {
      return 'This content has been reviewed and meets our community guidelines.'
    }
    return post.moderation_result.reason || 'This content has been flagged for review.'
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {post.user_email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {post.user_email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <p className="text-base text-gray-700 whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            <div className="ml-4 flex-shrink-0 flex flex-col space-y-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getModerationColor(
                  post
                )}`}
              >
                {getStatusText(post)}
              </span>
              <button
                onClick={() => setReportingPostId(post.id)}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Report
              </button>
            </div>
          </div>

          {post.moderation_result.reason && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Moderation Details
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {getStatusDescription(post)}
              </p>
              {post.moderation_result.confidence && (
                <p className="text-sm text-gray-600">
                  Confidence: {Math.round(post.moderation_result.confidence * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {reportingPostId && (
        <ReportDialog
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
          onSubmit={handleReport}
        />
      )}
    </div>
  )
}
